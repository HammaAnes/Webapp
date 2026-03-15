<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Méthode non autorisée', 405);
}

$authData = Auth::requireAdmin();
$userId = $authData['id'];

try {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        Response::error('Données invalides', 400);
    }

    $contactId = $data['contactId'] ?? '';
    if (empty($contactId)) {
        Response::error('ID du contact requis', 400);
    }

    $db = Database::getInstance()->getConnection();
    $db->beginTransaction();

    $stmt = $db->prepare("SELECT * FROM contacts WHERE id = ?");
    $stmt->execute([$contactId]);
    $contact = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$contact) {
        $db->rollBack();
        Response::error('Contact non trouvé', 404);
    }

    if ($contact['user_id']) {
        $db->rollBack();
        Response::error('Ce contact a déjà un compte utilisateur', 400);
    }

    if (empty($contact['email'])) {
        $db->rollBack();
        Response::error('Le contact doit avoir un email pour créer un compte', 400);
    }

    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$contact['email']]);
    if ($stmt->fetch()) {
        $db->rollBack();
        Response::error('Un utilisateur avec cet email existe déjà', 400);
    }

    $newUserId = UuidHelper::generate();
    $tempPassword = bin2hex(random_bytes(8));
    $hashedPassword = password_hash($tempPassword, PASSWORD_BCRYPT);

    $insertUser = "
        INSERT INTO users (
            id, email, password, nom, prenom, telephone, role, statut, entreprise
        ) VALUES (
            :id, :email, :password, :nom, :prenom, :telephone, 'user', 'actif', :entreprise
        )
    ";

    $stmt = $db->prepare($insertUser);
    $stmt->execute([
        ':id' => $newUserId,
        ':email' => $contact['email'],
        ':password' => $hashedPassword,
        ':nom' => $contact['nom'],
        ':prenom' => $contact['prenom'],
        ':telephone' => $contact['telephone'],
        ':entreprise' => $contact['entreprise']
    ]);

    $updateContact = "UPDATE contacts SET user_id = :user_id, statut = 'client', updated_at = NOW() WHERE id = :id";
    $stmt = $db->prepare($updateContact);
    $stmt->execute([
        ':user_id' => $newUserId,
        ':id' => $contactId
    ]);

    $updateReservations = "UPDATE reservations SET user_id = :user_id, contact_id = NULL WHERE contact_id = :contact_id";
    $stmt = $db->prepare($updateReservations);
    $stmt->execute([
        ':user_id' => $newUserId,
        ':contact_id' => $contactId
    ]);

    $updateDomiciliations = "UPDATE domiciliations SET user_id = :user_id, contact_id = NULL WHERE contact_id = :contact_id";
    $stmt = $db->prepare($updateDomiciliations);
    $stmt->execute([
        ':user_id' => $newUserId,
        ':contact_id' => $contactId
    ]);

    if (isset($data['sendWelcomeEmail']) && $data['sendWelcomeEmail']) {
        $mailer = new Mailer();
        $emailSent = $mailer->sendTemplateEmail(
            $contact['email'],
            'Bienvenue sur Coffice',
            'welcome',
            [
                'prenom' => $contact['prenom'],
                'nom' => $contact['nom'],
                'email' => $contact['email'],
                'password' => $tempPassword,
                'loginUrl' => 'https://coffice.dz/connexion'
            ]
        );
    }

    AuditLogger::log($userId, 'contact_converted_to_user', 'contacts', $contactId, [
        'user_id' => $newUserId,
        'email' => $contact['email']
    ]);

    $db->commit();

    Response::success([
        'message' => 'Contact converti en utilisateur avec succès',
        'userId' => $newUserId,
        'temporaryPassword' => $tempPassword,
        'emailSent' => $emailSent ?? false
    ]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    ErrorHandler::logError($e);
    Response::error('Erreur serveur: ' . $e->getMessage(), 500);
}

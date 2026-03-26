<?php
/**
 * Fiche client 360° — endpoint agrégé
 * GET /api/users/profile360.php?id=xxx
 * Retourne toute l'activité d'un utilisateur en un seul appel.
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    $auth = Auth::verifyAuth();

    $userId = $_GET['id'] ?? null;
    if (!$userId) {
        Response::error('ID utilisateur manquant', 400);
    }

    // Un user peut voir son propre profil, l'admin peut voir tous les profils
    if ($auth['role'] !== 'admin' && $auth['id'] !== $userId) {
        Response::error('Accès refusé', 403);
    }

    // ─── 1. Infos utilisateur ─────────────────────────────────────────────────
    $stmtUser = $db->prepare("
        SELECT id, email, nom, prenom, telephone, role, statut, avatar,
               profession, entreprise, adresse, bio, wilaya, commune,
               type_entreprise, nif, nis, registre_commerce,
               raison_sociale, activite_principale,
               carte_identite_url, derniere_connexion, created_at,
               code_parrainage, credit
        FROM persons
        WHERE id = ?
    ");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        Response::notFound('Utilisateur introuvable');
    }

    // ─── 2. Réservations ──────────────────────────────────────────────────────
    // Essai avec abonnement_couvert (migration 033+), fallback sans
    try {
        $stmtRes = $db->prepare("
            SELECT r.id, r.date_debut, r.date_fin, r.statut, r.montant_total,
                   r.type_reservation, r.participants, r.notes,
                   r.abonnement_couvert, r.created_at,
                   e.nom AS espace_nom, e.type AS espace_type
            FROM reservations r
            LEFT JOIN espaces e ON r.espace_id = e.id
            WHERE r.person_id = ?
            ORDER BY r.date_debut DESC
            LIMIT 50
        ");
        $stmtRes->execute([$userId]);
        $reservations = $stmtRes->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // abonnement_couvert absent — fallback sans la colonne
        $stmtRes = $db->prepare("
            SELECT r.id, r.date_debut, r.date_fin, r.statut, r.montant_total,
                   r.type_reservation, r.participants, r.notes,
                   0 AS abonnement_couvert, r.created_at,
                   e.nom AS espace_nom, e.type AS espace_type
            FROM reservations r
            LEFT JOIN espaces e ON r.espace_id = e.id
            WHERE r.person_id = ?
            ORDER BY r.date_debut DESC
            LIMIT 50
        ");
        $stmtRes->execute([$userId]);
        $reservations = $stmtRes->fetchAll(PDO::FETCH_ASSOC);
    }

    // ─── 3. Abonnements ───────────────────────────────────────────────────────
    $stmtAbo = $db->prepare("
        SELECT au.id, au.statut, au.date_debut, au.date_fin, au.created_at,
               a.nom AS abonnement_nom, a.prix, a.duree_mois, a.description
        FROM abonnements_utilisateurs au
        LEFT JOIN abonnements a ON au.abonnement_id = a.id
        WHERE au.person_id = ?
        ORDER BY au.created_at DESC
    ");
    $stmtAbo->execute([$userId]);
    $abonnements = $stmtAbo->fetchAll(PDO::FETCH_ASSOC);

    // ─── 4. Domiciliation(s) ──────────────────────────────────────────────────
    $stmtDom = $db->prepare("
        SELECT id, raison_sociale, statut, date_debut, date_fin,
               montant_mensuel, numero_bureau, adresse_siege_social AS adresse_domiciliation,
               forme_juridique, activite_principale AS activite, created_at
        FROM domiciliations
        WHERE person_id = ?
        ORDER BY created_at DESC
    ");
    $stmtDom->execute([$userId]);
    $domiciliations = $stmtDom->fetchAll(PDO::FETCH_ASSOC);

    // ─── 5. Toutes les transactions (source unique : transactions_caisse) ─────
    $stmtCaisse = $db->prepare("
        SELECT tc.id, tc.type_transaction, tc.montant, tc.mode_paiement,
               tc.numero_recu, tc.statut, tc.notes, tc.reference_paiement,
               tc.created_at,
               u.prenom AS encaisse_par_prenom, u.nom AS encaisse_par_nom
        FROM transactions_caisse tc
        LEFT JOIN persons u ON tc.encaisse_par = u.id
        WHERE tc.person_id = ?
           OR tc.reservation_id IN (SELECT id FROM reservations WHERE person_id = ?)
           OR tc.domiciliation_id IN (SELECT id FROM domiciliations WHERE person_id = ?)
           OR tc.abonnement_utilisateur_id IN (SELECT id FROM abonnements_utilisateurs WHERE person_id = ?)
        ORDER BY tc.created_at DESC
        LIMIT 50
    ");
    $stmtCaisse->execute([$userId, $userId, $userId, $userId]);
    $transactionsCaisse = $stmtCaisse->fetchAll(PDO::FETCH_ASSOC);

    // ─── 7. Codes promo utilisés ──────────────────────────────────────────────
    $stmtPromo = $db->prepare("
        SELECT u.id, u.montant_reduction, u.created_at,
               cp.code, cp.type, cp.valeur
        FROM utilisations_codes_promo u
        LEFT JOIN codes_promo cp ON u.code_promo_id = cp.id
        WHERE u.user_id = ?
        ORDER BY u.created_at DESC
    ");
    $stmtPromo->execute([$userId]);
    $codesPromo = $stmtPromo->fetchAll(PDO::FETCH_ASSOC);

    // ─── 8. Parrainages ───────────────────────────────────────────────────────
    $stmtParrain = $db->prepare("
        SELECT p.id, p.code_parrain, p.parraines, p.recompenses_totales, p.created_at
        FROM parrainages p
        WHERE p.parrain_id = ?
        ORDER BY p.created_at DESC
    ");
    $stmtParrain->execute([$userId]);
    $parrainages = $stmtParrain->fetchAll(PDO::FETCH_ASSOC);

    // ─── 9. Stats agrégées ────────────────────────────────────────────────────
    $totalDepense = array_sum(array_column(
        array_filter($reservations, fn($r) => !$r['abonnement_couvert']),
        'montant_total'
    ));
    $totalEncaisse = array_sum(array_column(
        array_filter($transactionsCaisse, fn($t) => $t['statut'] === 'encaisse'),
        'montant'
    ));
    $nbReservations = count($reservations);
    $nbPresencesAbonnement = count(array_filter($reservations, fn($r) => $r['abonnement_couvert']));
    $nbAnnulations = count(array_filter($reservations, fn($r) => $r['statut'] === 'annulee'));
    $totalReductions = array_sum(array_column($codesPromo, 'montant_reduction'));

    $aboActif = null;
    foreach ($abonnements as $abo) {
        if ($abo['statut'] === 'actif') {
            $aboActif = $abo;
            break;
        }
    }
    $domActif = null;
    foreach ($domiciliations as $dom) {
        if ($dom['statut'] === 'active') {
            $domActif = $dom;
            break;
        }
    }

    $stats = [
        'total_depense'           => (float) $totalDepense,
        'total_encaisse_caisse'   => (float) $totalEncaisse,
        'nb_reservations'         => $nbReservations,
        'nb_presences_abonnement' => $nbPresencesAbonnement,
        'nb_annulations'          => $nbAnnulations,
        'total_reductions'        => (float) $totalReductions,
        'nb_parrainages'          => count($parrainages),
        'has_abonnement_actif'    => $aboActif !== null,
        'has_domiciliation_active' => $domActif !== null,
        'anciennete_jours'        => (int) floor((time() - strtotime($user['created_at'])) / 86400),
    ];

    Response::success([
        'user'                => $user,
        'reservations'        => $reservations,
        'abonnements'         => $abonnements,
        'abonnement_actif'    => $aboActif,
        'domiciliations'      => $domiciliations,
        'domiciliation_active' => $domActif,
        'transactions_caisse' => $transactionsCaisse,
        'codes_promo'         => $codesPromo,
        'parrainages'         => $parrainages,
        'stats'               => $stats,
    ]);

} catch (Exception $e) {
    Logger::error('profile360 error', ['error' => $e->getMessage()]);
    Response::serverError();
}

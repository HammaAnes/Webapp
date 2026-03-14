<?php
require_once __DIR__ . '/../bootstrap.php';

$token = $_GET['token'] ?? '';

if (!$token) {
    http_response_code(400);
    echo '<h1>Lien invalide</h1><p>Ce lien de désabonnement n\'est pas valide.</p>';
    exit;
}

try {
    $stmt = $db->prepare('SELECT user_id FROM email_preferences WHERE unsubscribe_token = ?');
    $stmt->execute([$token]);
    $prefs = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$prefs) {
        http_response_code(404);
        echo renderPage('Lien expiré', '<p>Ce lien de désabonnement n\'est plus valide ou a déjà été utilisé.</p><a href="https://coffice.dz">Retour au site</a>');
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $categories = $_POST['categories'] ?? [];
        $updates = [];
        $params = [];

        $validCategories = ['email_transactionnel', 'email_rappels', 'email_marketing', 'email_systeme'];

        if (in_array('all', $categories)) {
            foreach ($validCategories as $cat) {
                if ($cat !== 'email_transactionnel') {
                    $updates[] = "$cat = 0";
                }
            }
        } else {
            foreach ($categories as $cat) {
                if (in_array($cat, $validCategories) && $cat !== 'email_transactionnel') {
                    $updates[] = "$cat = 0";
                }
            }
        }

        if (!empty($updates)) {
            $db->prepare('UPDATE email_preferences SET ' . implode(', ', $updates) . ' WHERE unsubscribe_token = ?')
               ->execute([$token]);
        }

        echo renderPage('Désabonnement confirmé', '
<p style="color:#374151;font-size:15px;line-height:1.6;">Vos préférences ont été mises à jour. Vous ne recevrez plus les emails sélectionnés.</p>
<p style="font-size:13px;color:#9ca3af;margin-top:16px;">Vous pouvez modifier vos préférences à tout moment depuis votre compte Coffice.</p>
<a href="https://coffice.dz/app/profil" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#0284c7;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Mon compte</a>
        ');
        exit;
    }

    echo renderPage('Gérer mes préférences email', '
<p style="color:#374151;font-size:15px;line-height:1.6;margin-bottom:24px;">Choisissez les types d\'emails que vous souhaitez ne plus recevoir.</p>
<form method="POST" action="/api/email/unsubscribe.php?token=' . htmlspecialchars($token) . '">
<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
  <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;color:#374151;">
    <input type="checkbox" name="categories[]" value="email_marketing" style="width:16px;height:16px;accent-color:#0284c7;"> Emails marketing et promotions
  </label>
  <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;color:#374151;">
    <input type="checkbox" name="categories[]" value="email_rappels" style="width:16px;height:16px;accent-color:#0284c7;"> Rappels et notifications
  </label>
  <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;color:#374151;">
    <input type="checkbox" name="categories[]" value="all" style="width:16px;height:16px;accent-color:#0284c7;"> Tout désactiver (sauf emails transactionnels essentiels)
  </label>
</div>
<button type="submit" style="padding:12px 28px;background:#dc2626;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;">Confirmer le désabonnement</button>
<a href="https://coffice.dz" style="display:inline-block;margin-left:12px;font-size:14px;color:#6b7280;text-decoration:none;">Annuler</a>
</form>
    ');
} catch (Exception $e) {
    Logger::error('email/unsubscribe.php error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo '<h1>Erreur</h1><p>Une erreur est survenue. Veuillez réessayer.</p>';
}

function renderPage(string $title, string $content): string
{
    return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>' . htmlspecialchars($title) . ' – Coffice</title>
<style>body{margin:0;padding:40px 16px;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.card{max-width:480px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden}
.header{padding:28px 32px;border-bottom:1px solid #e5e7eb;text-align:center}
.header img{height:40px}
.body{padding:32px}</style></head>
<body><div class="card">
<div class="header"><a href="https://coffice.dz"><img src="https://coffice.dz/logo_coffice.png" alt="Coffice"></a></div>
<div class="body"><h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px;">' . htmlspecialchars($title) . '</h2>' . $content . '</div>
</div></body></html>';
}

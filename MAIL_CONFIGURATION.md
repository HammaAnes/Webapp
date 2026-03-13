# Configuration Email - Coffice

## Problème identifié

La fonction PHP `mail()` est **désactivée** sur le serveur de production. Cela empêche l'envoi d'emails de bienvenue, de notifications, et de réinitialisation de mot de passe.

### Erreur dans les logs
```
Call to undefined function mail()
```

## Solutions possibles

### Option 1 : Activer mail() sur le serveur (RECOMMANDÉ)

Contactez votre hébergeur (cPanel) pour activer la fonction `mail()` dans PHP.

**Via cPanel :**
1. Connectez-vous à cPanel
2. Allez dans "Select PHP Version" ou "MultiPHP INI Editor"
3. Vérifiez que `disable_functions` ne contient pas `mail`
4. Si `mail` est désactivé, contactez le support

### Option 2 : Utiliser PHPMailer (DÉJÀ CONFIGURÉ)

Le code utilise déjà PHPMailer comme solution de secours. Vérifiez que PHPMailer est bien installé :

```bash
# Via composer
composer require phpmailer/phpmailer
```

**Configuration dans `.env` :**
```bash
MAIL_MAILER=smtp
MAIL_HOST=mail.coffice.dz
MAIL_PORT=465
MAIL_USERNAME=desk@coffice.dz
MAIL_PASSWORD=Coffice2026!
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=desk@coffice.dz
MAIL_FROM_NAME=Coffice
```

### Option 3 : Utiliser un service SMTP externe

Configurez un service SMTP comme :
- **Gmail SMTP** (smtp.gmail.com:587)
- **SendGrid** (gratuit jusqu'à 100 emails/jour)
- **Mailgun** (gratuit jusqu'à 5000 emails/mois)
- **Amazon SES**

## Vérification du fonctionnement

### Test via script PHP

Créez un fichier `test-email.php` dans `/api/` :

```php
<?php
require_once 'utils/Mailer.php';

$result = Mailer::sendWelcomeEmail(
    'votre-email@example.com',
    'Test User'
);

if ($result['success']) {
    echo "Email envoyé avec succès !";
} else {
    echo "Erreur : " . $result['error'];
}
```

Accédez à `https://coffice.dz/api/test-email.php` pour tester.

**⚠️ IMPORTANT : Supprimez ce fichier après le test !**

## Fonctionnalités affectées

Sans emails fonctionnels, les utilisateurs ne reçoivent pas :
- ✉️ Email de bienvenue après inscription
- ✉️ Email de réinitialisation de mot de passe
- ✉️ Notifications de réservation
- ✉️ Notifications de domiciliation

**Note :** L'inscription fonctionne quand même, seul l'email n'est pas envoyé. Les utilisateurs peuvent se connecter normalement.

## État actuel

D'après les logs :
- ✅ Les inscriptions fonctionnent (utilisateurs créés)
- ✅ Les tokens sont générés
- ✅ Les connexions fonctionnent
- ❌ Les emails ne sont pas envoyés

## Action recommandée

Contactez votre hébergeur pour activer la fonction `mail()` PHP ou vérifiez que PHPMailer est bien configuré avec vos credentials SMTP.

<?php
// Migrated: proxy vers persons/index.php (contacts = persons sans compte)
if (!isset($_GET['has_account'])) {
    $_GET['has_account'] = 'false';
}
require __DIR__ . '/../persons/index.php';

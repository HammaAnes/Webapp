<?php
// Migrated: proxy vers persons/index.php?has_account=true
if (!isset($_GET['has_account'])) {
    $_GET['has_account'] = 'true';
}
require __DIR__ . '/../persons/index.php';

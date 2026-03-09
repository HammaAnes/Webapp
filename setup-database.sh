#!/bin/bash

###############################################################################
# Script de configuration de la base de données Coffice v4.2.0
# Usage: bash setup-database.sh
###############################################################################

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "🗄️  Configuration Base de Données Coffice"
echo "=========================================="
echo ""

# Demander les informations de connexion
read -p "📝 Nom de la base de données [cofficed_coffice]: " DB_NAME
DB_NAME=${DB_NAME:-cofficed_coffice}

read -p "📝 Utilisateur MySQL [cofficed_coffice]: " DB_USER
DB_USER=${DB_USER:-cofficed_coffice}

read -sp "🔐 Mot de passe MySQL: " DB_PASSWORD
echo ""
echo ""

# Vérifier la connexion
echo "🔍 Test de connexion..."
if mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connexion réussie${NC}"
else
    echo -e "${RED}❌ Erreur de connexion${NC}"
    echo "Vérifiez vos identifiants MySQL"
    exit 1
fi
echo ""

# Créer la base si elle n'existe pas
echo "📦 Création de la base de données si nécessaire..."
mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo -e "${GREEN}✓ Base de données prête${NC}"
echo ""

# Vérifier les fichiers de migration
if [ ! -f "database/coffice.sql" ]; then
    echo -e "${RED}❌ Erreur: database/coffice.sql non trouvé${NC}"
    exit 1
fi

# Import du schéma principal
echo "📥 Import du schéma principal (coffice.sql)..."
mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/coffice.sql
echo -e "${GREEN}✓ Schéma principal importé${NC}"
echo ""

# Migrations
MIGRATIONS=(
    "002_password_resets.sql"
    "003_add_rappel_envoye.sql"
    "004_performance_indexes.sql"
    "005_audit_logging.sql"
    "006_add_code_parrainage.sql"
    "007_operational_features.sql"
    "008_domiciliation_workflow.sql"
    "009_fix_codes_promo_columns.sql"
    "010_walk_ins.sql"
    "011_erp_tables.sql"
)

echo "🔄 Exécution des migrations..."
for migration in "${MIGRATIONS[@]}"; do
    migration_file="database/migrations/$migration"
    if [ -f "$migration_file" ]; then
        echo -e "  ${BLUE}→${NC} $migration"
        mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$migration_file"
        echo -e "  ${GREEN}✓${NC} Migration appliquée"
    else
        echo -e "  ${YELLOW}⚠️  Migration non trouvée: $migration${NC}"
    fi
done
echo ""

# Optimisation des tables
echo "⚡ Optimisation des tables..."
mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "ANALYZE TABLE users, reservations, domiciliations, espaces, parrainages, parrainages_details;" > /dev/null 2>&1
echo -e "${GREEN}✓ Tables optimisées${NC}"
echo ""

# Statistiques
echo "📊 Statistiques de la base de données:"
echo ""

# Nombre de tables
TABLE_COUNT=$(mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';" -N)
echo "  Tables: $TABLE_COUNT"

# Nombre d'utilisateurs
USER_COUNT=$(mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM users;" -N 2>/dev/null || echo "0")
echo "  Utilisateurs: $USER_COUNT"

# Nombre d'espaces
ESPACE_COUNT=$(mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM espaces;" -N 2>/dev/null || echo "0")
echo "  Espaces: $ESPACE_COUNT"

echo ""

# Résumé
echo "=========================================="
echo -e "${GREEN}✅ Configuration terminée avec succès!${NC}"
echo "=========================================="
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Créer un compte admin:"
echo "   mysql -u $DB_USER -p $DB_NAME"
echo "   UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';"
echo ""
echo "2. Vérifier l'API:"
echo "   curl https://coffice.dz/api/check.php"
echo "   curl https://coffice.dz/api/test_db_connection.php"
echo ""
echo "3. Tester l'application:"
echo "   Ouvrir https://coffice.dz dans un navigateur"
echo "   Créer un compte test"
echo "   Vérifier que le code de parrainage est généré"
echo ""

#!/bin/bash

###############################################################################
# Script de déploiement Coffice v4.2.0
# Usage: bash deploy-prod.sh
###############################################################################

set -e  # Arrêter en cas d'erreur

echo "=========================================="
echo "🚀 Déploiement Coffice v4.2.0"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé${NC}"
    echo "Assurez-vous d'être dans le répertoire du projet"
    exit 1
fi

echo "📁 Répertoire de travail: $(pwd)"
echo ""

# 1. Nettoyage des fichiers de développement
echo "🧹 Étape 1/5: Nettoyage des fichiers de développement..."
rm -rf node_modules/
rm -rf src/
rm -f package.json package-lock.json
rm -f tsconfig.json tsconfig.node.json
rm -f vite.config.ts postcss.config.js tailwind.config.js
rm -rf .git/
rm -f .gitignore
echo -e "${GREEN}✓ Fichiers de développement supprimés${NC}"
echo ""

# 2. Copier le contenu de dist/ à la racine
echo "📦 Étape 2/5: Déplacement des fichiers de production..."
if [ -d "dist" ]; then
    cp -r dist/* ./
    echo -e "${GREEN}✓ Fichiers de dist/ copiés à la racine${NC}"
else
    echo -e "${RED}❌ Erreur: Dossier dist/ non trouvé${NC}"
    echo "Assurez-vous d'avoir exécuté 'npm run build' avant le déploiement"
    exit 1
fi
echo ""

# 3. Vérifier la structure
echo "🔍 Étape 3/5: Vérification de la structure..."
if [ -f "index.html" ] && [ -d "assets" ] && [ -d "api" ]; then
    echo -e "${GREEN}✓ Structure correcte détectée${NC}"
    echo "  - index.html: ✓"
    echo "  - assets/: ✓"
    echo "  - api/: ✓"
else
    echo -e "${RED}❌ Erreur: Structure incorrecte${NC}"
    exit 1
fi
echo ""

# 4. Créer les dossiers nécessaires
echo "📁 Étape 4/5: Création des dossiers nécessaires..."
mkdir -p api/uploads/documents
mkdir -p api/logs
echo -e "${GREEN}✓ Dossiers créés${NC}"
echo ""

# 5. Configurer les permissions
echo "🔐 Étape 5/5: Configuration des permissions..."
chmod 755 api/uploads
chmod 755 api/uploads/documents
chmod 755 api/logs
if [ -f ".env" ]; then
    chmod 644 .env
    echo -e "${GREEN}✓ Permissions configurées${NC}"
else
    echo -e "${YELLOW}⚠️  Fichier .env non trouvé - à créer manuellement${NC}"
fi
echo ""

# Résumé final
echo "=========================================="
echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo "=========================================="
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Configuration .env"
echo "   nano .env"
echo ""
echo "2. Import base de données:"
echo "   mysql -u USER -p DATABASE < database/coffice.sql"
echo ""
echo "3. Migrations (dans l'ordre):"
echo "   mysql -u USER -p DATABASE < database/migrations/002_password_resets.sql"
echo "   mysql -u USER -p DATABASE < database/migrations/003_add_rappel_envoye.sql"
echo "   mysql -u USER -p DATABASE < database/migrations/004_performance_indexes.sql"
echo "   mysql -u USER -p DATABASE < database/migrations/005_audit_logging.sql"
echo "   mysql -u USER -p DATABASE < database/migrations/006_add_code_parrainage.sql"
echo ""
echo "4. Tests:"
echo "   curl https://coffice.dz/api/check.php"
echo "   curl https://coffice.dz/api/test_db_connection.php"
echo ""
echo "📖 Consultez DEPLOY_CHECKLIST.md pour plus de détails"
echo ""

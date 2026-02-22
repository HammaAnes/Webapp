#!/bin/bash

# Script de nettoyage des console.log/error/warn
# Remplace par logger.* pour un meilleur debugging

echo "🧹 Nettoyage des console.* dans le code..."

# Compteur
TOTAL=0

# Parcourir tous les fichiers TypeScript/React sauf logger.ts
find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "logger.ts" -print0 | while IFS= read -r -d '' file; do
    # Compter les occurrences avant
    BEFORE=$(grep -c "console\." "$file" 2>/dev/null || echo 0)

    if [ "$BEFORE" -gt 0 ]; then
        echo "  📝 $file ($BEFORE occurrences)"

        # Remplacements
        sed -i 's/console\.log(/logger.log(/g' "$file"
        sed -i 's/console\.error(/logger.error(/g' "$file"
        sed -i 's/console\.warn(/logger.warn(/g' "$file"
        sed -i 's/console\.debug(/logger.debug(/g' "$file"
        sed -i 's/console\.info(/logger.info(/g' "$file"

        TOTAL=$((TOTAL + BEFORE))
    fi
done

echo ""
echo "✅ $TOTAL occurrences remplacées"
echo ""
echo "⚠️  N'oubliez pas d'importer logger dans les fichiers modifiés :"
echo "   import { logger } from '../utils/logger';"

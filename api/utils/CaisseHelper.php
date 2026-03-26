<?php

/**
 * CaisseHelper — utilitaires pour la table transactions_caisse.
 */
class CaisseHelper
{
    /**
     * Génère un numéro de reçu unique (ex: REC-2026-0042).
     *
     * Doit être appelé à l'intérieur d'une transaction PDO active afin que
     * le verrou FOR UPDATE soit cohérent et évite les doublons en parallèle.
     */
    public static function generateNumeroRecu(PDO $db): string
    {
        $annee = date('Y');
        $stmt  = $db->prepare(
            "SELECT COUNT(*) FROM transactions_caisse WHERE YEAR(created_at) = ? FOR UPDATE"
        );
        $stmt->execute([$annee]);
        $count = (int) $stmt->fetchColumn();
        return sprintf('REC-%s-%04d', $annee, $count + 1);
    }

    /**
     * Insère une ligne dans transactions_caisse.
     *
     * @param PDO    $db
     * @param array  $data  Clés : type_transaction, montant, mode_paiement,
     *                      person_id?, domiciliation_id?, abonnement_utilisateur_id?,
     *                      reservation_id?, encaisse_par?, reference_paiement?, notes?,
     *                      statut? (défaut 'en_attente')
     * @return string  Le numéro de reçu généré.
     */
    public static function insert(PDO $db, array $data): string
    {
        $id          = UuidHelper::generate();
        $numeroRecu  = self::generateNumeroRecu($db);
        $statut      = $data['statut'] ?? 'en_attente';

        $db->prepare("
            INSERT INTO transactions_caisse
              (id, person_id, reservation_id, domiciliation_id, abonnement_utilisateur_id,
               type_transaction, montant, mode_paiement, statut,
               reference_paiement, numero_recu, notes, encaisse_par)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ")->execute([
            $id,
            $data['person_id']                   ?? null,
            $data['reservation_id']              ?? null,
            $data['domiciliation_id']             ?? null,
            $data['abonnement_utilisateur_id']    ?? null,
            $data['type_transaction'],
            $data['montant'],
            $data['mode_paiement']               ?? 'cash',
            $statut,
            $data['reference_paiement']           ?? null,
            $numeroRecu,
            $data['notes']                        ?? null,
            $data['encaisse_par']                 ?? null,
        ]);

        return $numeroRecu;
    }
}

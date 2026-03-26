<?php

/**
 * ContactResolver — résout toujours un tiers_id (contact_id) depuis une requête admin.
 *
 * tiers est l'entité principale (prospects + utilisateurs).
 * - Si contact_id fourni     → valide dans tiers et retourne directement.
 * - Si user_id fourni        → résout vers le tiers.id du user.
 * - Sinon                    → utilise le tiers_id de l'auth courante.
 *
 * Usage dans un endpoint :
 *   $contactId = ContactResolver::resolve($db, $dataArr, $auth['tiers_id']);
 */
class ContactResolver
{
    /**
     * @param  PDO         $db
     * @param  array       $data           Données de la requête
     * @param  string|null $authTiersId    tiers_id de l'utilisateur connecté (fallback)
     * @return string      tiers.id validé
     * @throws Exception   404 si introuvable, 400 si aucun identifiant fourni
     */
    public static function resolve(PDO $db, array $data, ?string $authTiersId = null): string
    {
        // contact_id fourni directement → valider dans tiers
        if (!empty($data['contact_id'])) {
            $stmt = $db->prepare("SELECT id FROM tiers WHERE id = ?");
            $stmt->execute([$data['contact_id']]);
            if (!$stmt->fetch()) {
                throw new Exception("Contact introuvable", 404);
            }
            return $data['contact_id'];
        }

        // user_id fourni → résoudre vers tiers.id
        if (!empty($data['user_id'])) {
            $stmt = $db->prepare("SELECT tiers_id FROM users WHERE id = ?");
            $stmt->execute([$data['user_id']]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                throw new Exception("Utilisateur introuvable", 404);
            }
            if (empty($row['tiers_id'])) {
                throw new Exception("Cet utilisateur n'a pas de fiche tiers associée.", 500);
            }
            return $row['tiers_id'];
        }

        // Fallback : utilisateur connecté
        if (!empty($authTiersId)) {
            return $authTiersId;
        }

        throw new Exception("Un contact ou un utilisateur est requis", 400);
    }
}

<?php

/**
 * Classe utilitaire pour les réponses API
 */

class Response
{
    /**
     * Envoyer une réponse JSON
     */
    public static function json($data, $code = 200)
    {
        http_response_code($code);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit();
    }

    /**
     * Réponse de succès
     */
    public static function success($data = null, $message = "Succès", $code = 200)
    {
        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    /**
     * Réponse d'erreur
     */
    public static function error($message = "Une erreur est survenue", $code = 400, $details = null)
    {
        self::json([
            'success' => false,
            'error' => $message,
            'details' => $details
        ], $code);
    }

    /**
     * Conflit (409)
     */
    public static function conflict($message = "Conflit détecté")
    {
        self::error($message, 409);
    }

    /**
     * Erreur de validation (422)
     */
    public static function validationError($message = "Erreur de validation", $details = null)
    {
        self::error($message, 422, $details);
    }

    /**
     * Non autorisé
     */
    public static function unauthorized($message = "Non autorisé")
    {
        self::error($message, 401);
    }

    /**
     * Interdit
     */
    public static function forbidden($message = "Accès interdit")
    {
        self::error($message, 403);
    }

    /**
     * Non trouvé
     */
    public static function notFound($message = "Ressource non trouvée")
    {
        self::error($message, 404);
    }

    /**
     * Erreur serveur
     */
    public static function serverError($message = "Erreur serveur")
    {
        self::error($message, 500);
    }

    /**
     * Récupérer et parser le JSON du body de la requête
     * @return object|null
     */
    public static function getJsonInput()
    {
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput);

        if (json_last_error() !== JSON_ERROR_NONE) {
            self::error("Données JSON invalides", 400);
        }

        return $data;
    }

    /**
     * Valider que les champs requis sont présents
     * @param object $data
     * @param array $requiredFields
     * @return bool
     */
    public static function validateRequired($data, array $requiredFields)
    {
        $missing = [];

        foreach ($requiredFields as $field) {
            if (!isset($data->$field) || empty($data->$field)) {
                $missing[] = $field;
            }
        }

        if (!empty($missing)) {
            self::error("Champs manquants: " . implode(', ', $missing), 400);
        }

        return true;
    }
}

<?php

/**
 * Utilitaire de sanitization pour prévenir les attaques XSS
 */

class Sanitizer
{
    /**
     * Nettoyer une chaîne de caractères pour l'affichage HTML
     * Échappe tous les caractères HTML spéciaux
     *
     * @param string|null $string
     * @return string|null
     */
    public static function cleanHtml($string)
    {
        if ($string === null) {
            return null;
        }

        return htmlspecialchars($string, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * Nettoyer un tableau de chaînes pour l'affichage HTML
     *
     * @param array $array
     * @return array
     */
    public static function cleanHtmlArray($array)
    {
        if (!is_array($array)) {
            return [];
        }

        return array_map([self::class, 'cleanHtml'], $array);
    }

    /**
     * Nettoyer du texte en autorisant certaines balises HTML sécurisées
     * Utile pour les notes, descriptions, etc.
     *
     * @param string|null $text
     * @param array $allowedTags Balises HTML autorisées
     * @return string|null
     */
    public static function cleanText($text, $allowedTags = [])
    {
        if ($text === null) {
            return null;
        }

        // Par défaut, on n'autorise aucune balise HTML
        if (empty($allowedTags)) {
            return strip_tags($text);
        }

        // Construire la liste des balises autorisées
        $allowedTagsString = '<' . implode('><', $allowedTags) . '>';

        return strip_tags($text, $allowedTagsString);
    }

    /**
     * Valider et nettoyer une adresse email
     *
     * @param string|null $email
     * @return string|null
     */
    public static function cleanEmail($email)
    {
        if ($email === null) {
            return null;
        }

        $cleaned = filter_var($email, FILTER_SANITIZE_EMAIL);

        // Vérifier que c'est une vraie adresse email
        if (filter_var($cleaned, FILTER_VALIDATE_EMAIL)) {
            return strtolower(trim($cleaned));
        }

        return null;
    }

    /**
     * Nettoyer un numéro de téléphone
     * Retire tous les caractères non numériques sauf + au début
     *
     * @param string|null $phone
     * @return string|null
     */
    public static function cleanPhone($phone)
    {
        if ($phone === null) {
            return null;
        }

        // Retirer les espaces
        $phone = trim($phone);

        // Garder le + au début si présent
        $prefix = '';
        if (substr($phone, 0, 1) === '+') {
            $prefix = '+';
            $phone = substr($phone, 1);
        }

        // Retirer tout sauf les chiffres
        $phone = preg_replace('/[^0-9]/', '', $phone);

        return $prefix . $phone;
    }

    /**
     * Nettoyer un nombre
     *
     * @param mixed $number
     * @return int|float|null
     */
    public static function cleanNumber($number)
    {
        if ($number === null || $number === '') {
            return null;
        }

        if (is_numeric($number)) {
            return strpos($number, '.') !== false ? (float)$number : (int)$number;
        }

        return null;
    }

    /**
     * Nettoyer une URL
     *
     * @param string|null $url
     * @return string|null
     */
    public static function cleanUrl($url)
    {
        if ($url === null) {
            return null;
        }

        $cleaned = filter_var($url, FILTER_SANITIZE_URL);

        if (filter_var($cleaned, FILTER_VALIDATE_URL)) {
            return $cleaned;
        }

        return null;
    }

    /**
     * Nettoyer un objet JSON de manière récursive
     *
     * @param object|array $data
     * @return object|array
     */
    public static function cleanJsonData($data)
    {
        if (is_object($data)) {
            $data = (array)$data;
            $wasObject = true;
        } else {
            $wasObject = false;
        }

        if (is_array($data)) {
            foreach ($data as $key => $value) {
                if (is_string($value)) {
                    $data[$key] = self::cleanHtml($value);
                } elseif (is_array($value) || is_object($value)) {
                    $data[$key] = self::cleanJsonData($value);
                }
            }
        }

        return $wasObject ? (object)$data : $data;
    }

    /**
     * Échapper les caractères pour SQL LIKE
     *
     * @param string $string
     * @return string
     */
    public static function escapeLike($string)
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $string);
    }

    /**
     * Nettoyer un nom de fichier pour éviter les attaques path traversal
     *
     * @param string $filename
     * @return string
     */
    public static function cleanFilename($filename)
    {
        $filename = basename($filename);

        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);

        $filename = preg_replace('/(\.\.+)/', '.', $filename);

        $filename = trim($filename, '._-');

        if (empty($filename)) {
            $filename = 'file_' . time();
        }

        return $filename;
    }
}

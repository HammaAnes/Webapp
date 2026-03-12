<?php

/**
 * Utilitaire de pagination pour les listes
 */

class Pagination
{
    private $page;
    private $limit;
    private $offset;
    private $totalItems;
    private $totalPages;

    /**
     * Constructeur
     *
     * @param int $page Numéro de page (commence à 1)
     * @param int $limit Nombre d'éléments par page
     * @param int $maxLimit Limite maximale d'éléments par page
     */
     
    public static function paginate($total, $page = 1, $limit = 20)
    {
        $totalPages = max(1, ceil($total / $limit));

        return [
            'total' => (int) $total,
            'page' => (int) $page,
            'limit' => (int) $limit,
            'total_pages' => $totalPages,
            'has_prev' => $page > 1,
            'has_next' => $page < $totalPages,
        ];
    }
     
    public function __construct($page = 1, $limit = 20, $maxLimit = 100)
    {
        $this->page = max(1, (int)$page);
        $this->limit = min(max(1, (int)$limit), $maxLimit);
        $this->offset = ($this->page - 1) * $this->limit;
    }

    /**
     * Créer une instance depuis les paramètres GET
     *
     * @return Pagination
     */
    public static function fromRequest()
    {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

        return new self($page, $limit);
    }

    /**
     * Obtenir l'offset SQL
     *
     * @return int
     */
    public function getOffset()
    {
        return $this->offset;
    }

    /**
     * Obtenir la limite SQL
     *
     * @return int
     */
    public function getLimit()
    {
        return $this->limit;
    }

    /**
     * Obtenir la page actuelle
     *
     * @return int
     */
    public function getPage()
    {
        return $this->page;
    }

    /**
     * Définir le nombre total d'éléments
     *
     * @param int $total
     */
    public function setTotalItems($total)
    {
        $this->totalItems = (int)$total;
        $this->totalPages = ceil($this->totalItems / $this->limit);
    }

    /**
     * Obtenir la clause LIMIT SQL
     *
     * @return string
     */
    public function getSqlLimit()
    {
        return "LIMIT {$this->limit} OFFSET {$this->offset}";
    }

    /**
     * Obtenir les métadonnées de pagination
     *
     * @return array
     */
    public function getMetadata()
    {
        return [
            'page' => $this->page,
            'limit' => $this->limit,
            'total_items' => $this->totalItems ?? 0,
            'total_pages' => $this->totalPages ?? 0,
            'has_next' => $this->hasNext(),
            'has_prev' => $this->hasPrev()
        ];
    }

    /**
     * Vérifier s'il y a une page suivante
     *
     * @return bool
     */
    public function hasNext()
    {
        return $this->page < $this->totalPages;
    }

    /**
     * Vérifier s'il y a une page précédente
     *
     * @return bool
     */
    public function hasPrev()
    {
        return $this->page > 1;
    }

    /**
     * Formater une réponse avec pagination
     *
     * @param array $data Données à retourner
     * @param int $total Nombre total d'éléments
     * @return array
     */
    public function formatResponse($data, $total)
    {
        $this->setTotalItems($total);

        return [
            'data' => $data,
            'pagination' => $this->getMetadata()
        ];
    }

    /**
     * Compter le nombre total d'éléments dans une table
     *
     * @param PDO $db Connexion à la base de données
     * @param string $table Nom de la table
     * @param string $whereClause Clause WHERE (optionnelle)
     * @param array $params Paramètres pour la clause WHERE
     * @return int
     */
    public static function countTotal($db, $table, $whereClause = '', $params = [])
    {
        $query = "SELECT COUNT(*) as total FROM {$table}";

        if (!empty($whereClause)) {
            $query .= " WHERE {$whereClause}";
        }

        $stmt = $db->prepare($query);
        $stmt->execute($params);

        return (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
    }
}

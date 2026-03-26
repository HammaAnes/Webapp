<?php

/**
 * DolibarrClient — Stub d'intégration ERP Dolibarr
 *
 * Prêt pour connexion. Les coordonnées API seront fournies par Aghiles.
 * Une fois configurées, décommenter les appels dans les endpoints concernés.
 *
 * Variables d'environnement attendues :
 *   DOLIBARR_URL      = https://dolibarr.coffice.dz (ex)
 *   DOLIBARR_API_KEY  = <clé API Dolibarr>
 *   DOLIBARR_ENABLED  = true
 */
class DolibarrClient
{
    private static ?self $instance = null;
    private string $baseUrl;
    private string $apiKey;
    private bool $enabled;

    private function __construct()
    {
        $this->baseUrl = rtrim(env('DOLIBARR_URL', ''), '/');
        $this->apiKey  = env('DOLIBARR_API_KEY', '');
        $this->enabled = env('DOLIBARR_ENABLED', 'false') === 'true';
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function isConfigured(): bool
    {
        return $this->enabled && !empty($this->baseUrl) && !empty($this->apiKey);
    }

    // ─── Tiers (Clients) ──────────────────────────────────────────────────────

    /**
     * Créer ou mettre à jour un tiers dans Dolibarr à partir d'un user Coffice.
     */
    public function syncClient(array $user): ?array
    {
        if (!$this->isConfigured()) return null;
        // TODO: POST /api/index.php/thirdparties
        Logger::info('DolibarrClient::syncClient — stub', ['user_id' => $user['id'] ?? null]);
        return null;
    }

    /**
     * Récupérer un tiers par email.
     */
    public function getClientByEmail(string $email): ?array
    {
        if (!$this->isConfigured()) return null;
        // TODO: GET /api/index.php/thirdparties?email=...
        Logger::info('DolibarrClient::getClientByEmail — stub', ['email' => $email]);
        return null;
    }

    // ─── Factures ─────────────────────────────────────────────────────────────

    /**
     * Créer une facture dans Dolibarr pour une transaction Coffice.
     */
    public function createInvoice(array $transaction): ?array
    {
        if (!$this->isConfigured()) return null;
        // TODO: POST /api/index.php/invoices
        Logger::info('DolibarrClient::createInvoice — stub', [
            'transaction_id' => $transaction['id'] ?? null,
            'montant'        => $transaction['montant'] ?? null,
        ]);
        return null;
    }

    /**
     * Marquer une facture comme payée.
     */
    public function markInvoicePaid(string $invoiceId, float $montant, string $modePaiement = 'cash'): bool
    {
        if (!$this->isConfigured()) return false;
        // TODO: POST /api/index.php/invoices/{id}/payments
        Logger::info('DolibarrClient::markInvoicePaid — stub', [
            'invoice_id'    => $invoiceId,
            'montant'       => $montant,
            'mode_paiement' => $modePaiement,
        ]);
        return false;
    }

    // ─── Contrats (Domiciliations) ─────────────────────────────────────────────

    /**
     * Créer un contrat de domiciliation dans Dolibarr.
     */
    public function createDomiciliationContract(array $domiciliation): ?array
    {
        if (!$this->isConfigured()) return null;
        // TODO: POST /api/index.php/contracts
        Logger::info('DolibarrClient::createDomiciliationContract — stub', [
            'domiciliation_id' => $domiciliation['id'] ?? null,
        ]);
        return null;
    }

    // ─── HTTP helper ──────────────────────────────────────────────────────────

    private function request(string $method, string $endpoint, ?array $body = null): ?array
    {
        $url = $this->baseUrl . '/api/index.php/' . ltrim($endpoint, '/');
        $ch  = curl_init($url);

        $headers = [
            'DOLAPIKEY: ' . $this->apiKey,
            'Content-Type: application/json',
            'Accept: application/json',
        ];

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_CUSTOMREQUEST  => strtoupper($method),
        ]);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error    = curl_error($ch);
        curl_close($ch);

        if ($error) {
            Logger::error('DolibarrClient cURL error', ['error' => $error, 'endpoint' => $endpoint]);
            return null;
        }

        if ($httpCode >= 400) {
            Logger::warning('DolibarrClient HTTP ' . $httpCode, ['endpoint' => $endpoint, 'body' => $response]);
            return null;
        }

        return json_decode($response, true);
    }
}

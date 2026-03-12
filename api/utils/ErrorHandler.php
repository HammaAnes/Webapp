<?php

/**
 * ErrorHandler - Gestion centralisée des erreurs
 * Simplifie la gestion des exceptions dans les endpoints
 */

class ErrorHandler
{
    /**
     * Exécute un callback avec gestion automatique des erreurs
     */
    public static function handle(callable $callback)
    {
        try {
            return $callback();
        } catch (PDOException $e) {
            Logger::error("Database error", ['message' => $e->getMessage()]);

            if (getenv('APP_ENV') === 'development') {
                Response::error("Erreur de base de données: " . $e->getMessage(), 500);
            } else {
                Response::error("Erreur de base de données", 500);
            }
        } catch (ValidationException $e) {
            Response::error($e->getMessage(), 400);
        } catch (UnauthorizedException $e) {
            Response::unauthorized($e->getMessage());
        } catch (NotFoundException $e) {
            Response::error($e->getMessage(), 404);
        } catch (Exception $e) {
            Logger::error("Unexpected error", ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            if (getenv('APP_ENV') === 'development') {
                Response::error("Erreur: " . $e->getMessage(), 500);
            } else {
                Response::serverError();
            }
        }
    }

    /**
     * Exécute un callback avec gestion des erreurs et rollback de transaction
     */
    public static function handleWithTransaction($db, callable $callback)
    {
        try {
            $db->beginTransaction();
            $result = $callback();
            $db->commit();
            return $result;
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }
}

// Exceptions personnalisées
class ValidationException extends Exception
{
}
class UnauthorizedException extends Exception
{
}
class NotFoundException extends Exception
{
}

/*
  # Fix Database Constraints - Missing Status Values

  ## Summary
  Several status values are used throughout the application code but are missing
  from the database CHECK constraints, causing silent failures.

  ## Changes

  ### 1. reservations.statut - Add 'no_show'
  The 'no_show' status is used in:
  - api/reservations/update.php (transition logic)
  - src/pages/dashboard/admin/Aujourdhui.tsx (UI button + badge)
  - src/constants/index.ts
  But the DB constraint only allows: confirmee, en_attente, en_cours, annulee, terminee
  This causes a DB error whenever an admin tries to mark a reservation as no-show.

  ### 2. notifications.type - Add 'parrainage', 'promo', 'abonnement'
  The Notifications page filters by these types, and backend code creates
  notifications with these types. But the DB only allows:
  info, success, warning, error, reservation, domiciliation, paiement, systeme
  This causes DB errors when creating parrainage/promo/abonnement notifications,
  and the filters on the Notifications page always show 0 results.

  ## Security
  No RLS changes - existing policies unaffected.
*/

-- 1. Fix reservations.statut - add 'no_show'
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_statut_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_statut_check
  CHECK (statut = ANY (ARRAY[
    'confirmee'::text,
    'en_attente'::text,
    'en_cours'::text,
    'annulee'::text,
    'terminee'::text,
    'no_show'::text
  ]));

-- 2. Fix notifications.type - add parrainage, promo, abonnement
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'info'::text,
    'success'::text,
    'warning'::text,
    'error'::text,
    'reservation'::text,
    'domiciliation'::text,
    'paiement'::text,
    'systeme'::text,
    'parrainage'::text,
    'promo'::text,
    'abonnement'::text
  ]));

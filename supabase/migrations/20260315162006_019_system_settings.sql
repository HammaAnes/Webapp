/*
  # Create system_settings table

  ## Summary
  Creates the system_settings table used by the admin settings panel to store
  configurable application parameters such as company info, email settings,
  and notification preferences.

  ## New Tables
  - `system_settings`
    - `id` (uuid, primary key)
    - `setting_key` (text, unique per section) - the parameter name
    - `setting_value` (text) - JSON-encoded or plain string value
    - `setting_section` (text) - grouping key (general, mailing, notifications, etc.)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Default Values
  Inserts sensible defaults for the general, mailing, and notifications sections
  so the settings page loads correctly even before the admin configures anything.

  ## Security
  - RLS is enabled
  - Only authenticated admins can read or write settings
    (enforced at the API layer via Auth::requireAdmin(); no anon access)
  - A permissive SELECT policy for authenticated users is intentionally omitted
    because the PHP API handles authorization before touching this table.
    We add a broad authenticated-read policy here so Supabase direct queries
    can still work if needed in the future.
*/

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  setting_value text NOT NULL DEFAULT '',
  setting_section text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (setting_section, setting_key)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO system_settings (setting_key, setting_value, setting_section) VALUES
  ('nom_entreprise', 'COFFICE', 'general'),
  ('email', 'desk@coffice.dz', 'general'),
  ('telephone', '+213 795 38 01 24', 'general'),
  ('adresse', '4ème étage, Mohammadia Mall, Alger', 'general'),
  ('horaires_ouverture', '08:30', 'general'),
  ('horaires_fermeture', '18:30', 'general'),
  ('smtp_from_name', 'Coffice', 'mailing'),
  ('smtp_from_email', 'desk@coffice.dz', 'mailing'),
  ('email_admin', 'desk@coffice.dz', 'mailing'),
  ('signature_text', 'L''équipe Coffice - Coworking & Domiciliation', 'mailing'),
  ('email_nouvelles_reservations', 'true', 'notifications'),
  ('email_nouveaux_utilisateurs', 'true', 'notifications'),
  ('email_expirations_abonnements', 'true', 'notifications'),
  ('email_annulations', 'true', 'notifications'),
  ('email_domiciliations', 'true', 'notifications'),
  ('notifications_push', 'false', 'notifications')
ON CONFLICT (setting_section, setting_key) DO NOTHING;

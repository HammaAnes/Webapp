/*
  # Add Google OAuth Support

  1. Changes
    - Add `google_id` column to users table for storing Google unique identifier
    - Add index on `google_id` for fast lookups
    - Make `password_hash` nullable to support OAuth-only accounts

  2. Notes
    - Users can now sign in with Google OR email/password
    - google_id stores the unique Google user ID (sub claim from ID token)
    - Existing users are unaffected (google_id will be NULL)
*/

-- Add google_id column if it doesn't exist
SET @exist := (SELECT COUNT(*) FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'google_id' AND table_schema = DATABASE());
SET @sqlstmt := IF(@exist = 0,
    'ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL COMMENT ''Google OAuth ID (sub claim)''',
    'SELECT ''Column google_id already exists'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Make password_hash nullable for OAuth accounts
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL COMMENT 'Hash bcrypt du mot de passe (NULL pour OAuth)';

-- Add index on google_id for fast lookups (ignore if exists)
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics
               WHERE table_name = 'users' AND index_name = 'idx_google_id' AND table_schema = DATABASE());
SET @sqlstmt := IF(@exist = 0,
    'CREATE INDEX idx_google_id ON users(google_id)',
    'SELECT ''Index idx_google_id already exists'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.POSTGRES_DB || 'tidal_db'
});

// Ensure Tidal token columns exist (safe to run on every startup)
pool.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS tidal_access_token      TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS tidal_refresh_token     TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS tidal_token_expires_at  BIGINT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS tidal_display_name      VARCHAR(255);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS tidal_user_id           VARCHAR(255);
  ALTER TABLE playlists ADD COLUMN IF NOT EXISTS tracks_matched      INTEGER DEFAULT 0;
`).catch(err => console.error('DB migration error:', err.message));

module.exports = pool;

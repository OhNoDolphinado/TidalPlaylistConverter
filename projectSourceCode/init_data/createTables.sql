-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  spotify_access_token  TEXT,
  spotify_refresh_token TEXT,
  spotify_token_expires_at BIGINT,
  spotify_display_name  VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Spotify token columns to existing databases (safe to run multiple times)
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_access_token      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_refresh_token     TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_token_expires_at  BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_display_name      VARCHAR(255);

-- Create playlists table for storing user playlists
CREATE TABLE IF NOT EXISTS playlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tidal_playlist_id VARCHAR(255),
  spotify_playlist_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
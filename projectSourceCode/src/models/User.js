const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async create({ name, email, password }) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at
    `;

    const values = [name, email, passwordHash];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, name, email, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, { name, email }) {
    const query = `
      UPDATE users
      SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, email, updated_at
    `;
    const values = [name, email, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getPlaylistsCount(userId) {
    const query = 'SELECT COUNT(*) as count FROM playlists WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async saveSpotifyTokens(userId, { access_token, refresh_token, expires_at, display_name }) {
    const query = `
      UPDATE users
      SET spotify_access_token      = $1,
          spotify_refresh_token     = $2,
          spotify_token_expires_at  = $3,
          spotify_display_name      = $4,
          updated_at                = CURRENT_TIMESTAMP
      WHERE id = $5
    `;
    await pool.query(query, [access_token, refresh_token, expires_at, display_name, userId]);
  }

  static async getSpotifyTokens(userId) {
    const query = `
      SELECT spotify_access_token, spotify_refresh_token,
             spotify_token_expires_at, spotify_display_name
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);
    const row = result.rows[0];
    if (!row || !row.spotify_access_token) return null;
    return {
      access_token:  row.spotify_access_token,
      refresh_token: row.spotify_refresh_token,
      expires_at:    Number(row.spotify_token_expires_at),
      display_name:  row.spotify_display_name,
    };
  }

  static async clearSpotifyTokens(userId) {
    const query = `
      UPDATE users
      SET spotify_access_token     = NULL,
          spotify_refresh_token    = NULL,
          spotify_token_expires_at = NULL,
          spotify_display_name     = NULL,
          updated_at               = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  }
}

module.exports = User;
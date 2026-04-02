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
}

module.exports = User;
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Health check
router.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Database health check
router.get('/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', message: 'Database connection successful', timestamp: result.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'Error', message: 'Database connection failed', error: err.message });
  }
});

module.exports = router;

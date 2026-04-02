const express = require('express');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

// GET /api/auth/profile
router.get('/profile', (req, res, next) => {
  // Check if user is authenticated
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}, AuthController.getProfile);

// PUT /api/auth/profile
router.put('/profile', (req, res, next) => {
  // Check if user is authenticated
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}, AuthController.updateProfile);

module.exports = router;
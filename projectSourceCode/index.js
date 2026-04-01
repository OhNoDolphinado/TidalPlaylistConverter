require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const healthRoutes = require('./src/routes/health');
const auth = require('./src/routes/auth');
const errorHandler = require('./src/middleware/errorHandler');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', auth);

// Serve static HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Error handling middleware
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  // Simple hardcoded auth for demo
  if (email === 'user@example.com' && password === 'password') {
    req.session.user = { name: 'John Doe', email: email };
    res.redirect('/profile');
  } else {
    res.redirect('/login?error=1');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/profile', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { app };

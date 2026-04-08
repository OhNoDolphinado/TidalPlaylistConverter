const express = require('express');
const SpotifyController = require('../controllers/SpotifyController');

const router = express.Router();

// Redirect user to Spotify login page
router.get('/login', SpotifyController.login);

// Spotify redirects here after user approves
router.get('/callback', SpotifyController.callback);

// Check if the current session has a valid Spotify connection
router.get('/status', SpotifyController.status);

// Disconnect Spotify from the current session
router.post('/disconnect', SpotifyController.disconnect);

// Fetch the authenticated user's Spotify playlists
router.get('/playlists', SpotifyController.getPlaylists);

module.exports = router;

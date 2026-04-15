const express          = require('express');
const { TidalController } = require('../controllers/TidalController');

const router = express.Router();

// Redirect user to Tidal login page
router.get('/login', TidalController.login);

// Tidal redirects here after user approves
router.get('/callback', TidalController.callback);

// Check if the current session has a valid Tidal connection
router.get('/status', TidalController.status);

// Disconnect Tidal from the current session
router.post('/disconnect', TidalController.disconnect);

// Convert a Spotify playlist to Tidal
router.post('/convert', TidalController.convert);

module.exports = router;

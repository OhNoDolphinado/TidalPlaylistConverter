const axios = require('axios');
const User  = require('../models/User');

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI  = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback';

const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-private',
  'user-read-email',
].join(' ');

function basicAuthHeader() {
  return `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`;
}

function tokenIsValid(spotify) {
  return spotify && spotify.access_token && spotify.expires_at > Date.now() + 60_000;
}

async function refreshAccessToken(tokens) {
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: tokens.refresh_token,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: basicAuthHeader(),
      },
    }
  );

  const { access_token, expires_in, refresh_token } = response.data;
  tokens.access_token = access_token;
  tokens.expires_at   = Date.now() + expires_in * 1000;
  if (refresh_token) tokens.refresh_token = refresh_token;
}

// Load tokens from DB into session if not already there, then refresh if expired.
// Returns the token object or null if the user has never connected Spotify.
async function getValidTokens(session) {
  // Load from DB if session is empty
  if (!session.spotify && session.user) {
    const stored = await User.getSpotifyTokens(session.user.id);
    if (stored) session.spotify = stored;
  }

  if (!session.spotify) return null;

  if (!tokenIsValid(session.spotify)) {
    await refreshAccessToken(session.spotify);
    // Persist refreshed tokens back to DB
    if (session.user) {
      await User.saveSpotifyTokens(session.user.id, session.spotify);
    }
  }

  return session.spotify;
}

class SpotifyController {

  // GET /api/spotify/login
  static login(req, res) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     CLIENT_ID,
      scope:         SCOPES,
      redirect_uri:  REDIRECT_URI,
      state:         req.session.id,
    });
    res.redirect(`https://accounts.spotify.com/authorize?${params}`);
  }

  // GET /api/spotify/callback
  static async callback(req, res) {
    const { code, error } = req.query;

    if (error) return res.redirect('/profile?spotify_error=access_denied');
    if (!code)  return res.redirect('/profile?spotify_error=missing_code');

    try {
      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type:   'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: basicAuthHeader(),
          },
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Fetch Spotify display name to store alongside the tokens
      const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const display_name = profileResponse.data.display_name || profileResponse.data.email;

      const tokens = {
        access_token,
        refresh_token,
        expires_at:   Date.now() + expires_in * 1000,
        display_name,
      };

      req.session.spotify = tokens;

      // Persist to DB so tokens survive server restarts
      if (req.session.user) {
        await User.saveSpotifyTokens(req.session.user.id, tokens);
      }

      res.redirect('/profile?spotify_connected=true');
    } catch (err) {
      console.error('Spotify callback error:', err.response?.data || err.message);
      res.redirect('/profile?spotify_error=token_exchange_failed');
    }
  }

  // GET /api/spotify/status
  static async status(req, res) {
    try {
      const tokens = await getValidTokens(req.session);
      if (!tokens) return res.json({ connected: false });

      res.json({
        connected:    true,
        display_name: tokens.display_name || null,
      });
    } catch (err) {
      console.error('Spotify status error:', err.response?.data || err.message);
      res.json({ connected: false });
    }
  }

  // POST /api/spotify/disconnect
  static async disconnect(req, res) {
    delete req.session.spotify;
    if (req.session.user) {
      await User.clearSpotifyTokens(req.session.user.id);
    }
    res.json({ message: 'Spotify disconnected' });
  }

  // GET /api/spotify/playlists
  static async getPlaylists(req, res) {
    try {
      const tokens = await getValidTokens(req.session);
      if (!tokens) return res.status(401).json({ error: 'Spotify not connected' });

      const response = await axios.get('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      res.json({ playlists: response.data.items });
    } catch (err) {
      console.error('Spotify playlists error:', err.response?.data || err.message);
      res.status(500).json({ error: 'Failed to fetch Spotify playlists' });
    }
  }
}

module.exports = SpotifyController;

const axios        = require('axios');
const crypto       = require('crypto');
const User         = require('../models/User');

const CLIENT_ID     = process.env.TIDAL_CLIENT_ID;
const CLIENT_SECRET = process.env.TIDAL_CLIENT_SECRET;
const REDIRECT_URI  = process.env.TIDAL_REDIRECT_URI || 'http://127.0.0.1:3000/api/tidal/callback';

const AUTH_URL  = 'https://login.tidal.com/authorize';
const TOKEN_URL = 'https://auth.tidal.com/v1/oauth2/token';

function basicAuthHeader() {
  return `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`;
}

function tokenIsValid(tidal) {
  return tidal && tidal.access_token && tidal.expires_at > Date.now() + 60_000;
}

function generateCodeVerifier() {
  return crypto.randomBytes(64).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

async function refreshAccessToken(tokens) {
  const response = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id:     CLIENT_ID,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:  basicAuthHeader(),
      },
    }
  );
  const { access_token, expires_in, refresh_token } = response.data;
  tokens.access_token = access_token;
  tokens.expires_at   = Date.now() + expires_in * 1000;
  if (refresh_token) tokens.refresh_token = refresh_token;
}

async function getValidTokens(session) {
  if (!session.tidal && session.user) {
    const stored = await User.getTidalTokens(session.user.id);
    if (stored) session.tidal = stored;
  }
  if (!session.tidal) return null;
  if (!tokenIsValid(session.tidal)) {
    await refreshAccessToken(session.tidal);
    if (session.user) {
      await User.saveTidalTokens(session.user.id, session.tidal);
    }
  }
  return session.tidal;
}

class TidalController {

  // GET /api/tidal/login
  static login(req, res) {
    const verifier   = generateCodeVerifier();
    const challenge  = generateCodeChallenge(verifier);

    // Store verifier in session for use in callback
    req.session.tidalCodeVerifier = verifier;

    const params = new URLSearchParams({
      response_type:         'code',
      client_id:             CLIENT_ID,
      redirect_uri:          REDIRECT_URI,
      scope:                 'collection.read collection.write playlists.read playlists.write user.read',
      code_challenge:        challenge,
      code_challenge_method: 'S256',
    });

    res.redirect(`${AUTH_URL}?${params}`);
  }

  // GET /api/tidal/callback
  static async callback(req, res) {
    const { code, error } = req.query;

    if (error) return res.redirect('/profile?tidal_error=access_denied');
    if (!code)  return res.redirect('/profile?tidal_error=missing_code');

    const verifier = req.session.tidalCodeVerifier;
    if (!verifier) return res.redirect('/profile?tidal_error=missing_verifier');

    try {
      const tokenResponse = await axios.post(
        TOKEN_URL,
        new URLSearchParams({
          grant_type:    'authorization_code',
          code,
          redirect_uri:  REDIRECT_URI,
          client_id:     CLIENT_ID,
          code_verifier: verifier,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization:  basicAuthHeader(),
          },
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Fetch Tidal user profile
      const profileResponse = await axios.get('https://openapi.tidal.com/v2/users/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const profile      = profileResponse.data.data;
      const display_name = profile?.attributes?.username || profile?.id || 'Tidal User';
      const tidal_user_id = profile?.id;

      const tokens = {
        access_token,
        refresh_token,
        expires_at:    Date.now() + expires_in * 1000,
        display_name,
        tidal_user_id,
      };

      req.session.tidal = tokens;
      delete req.session.tidalCodeVerifier;

      if (req.session.user) {
        await User.saveTidalTokens(req.session.user.id, tokens);
      }

      res.redirect('/profile?tidal_connected=true');
    } catch (err) {
      console.error('Tidal callback error:', err.response?.data || err.message);
      res.redirect('/profile?tidal_error=token_exchange_failed');
    }
  }

  // GET /api/tidal/status
  static async status(req, res) {
    try {
      const tokens = await getValidTokens(req.session);
      if (!tokens) return res.json({ connected: false });
      res.json({ connected: true, display_name: tokens.display_name || null });
    } catch (err) {
      console.error('Tidal status error:', err.response?.data || err.message);
      res.json({ connected: false });
    }
  }

  // POST /api/tidal/disconnect
  static async disconnect(req, res) {
    delete req.session.tidal;
    if (req.session.user) {
      await User.clearTidalTokens(req.session.user.id);
    }
    res.json({ message: 'Tidal disconnected' });
  }
}

module.exports = { TidalController, getValidTokens };

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

  // POST /api/tidal/convert
  // Body: { spotifyPlaylistId, playlistName }
  static async convert(req, res) {
    const tidalTokens   = await getValidTokens(req.session);
    if (!tidalTokens) return res.status(401).json({ error: 'Tidal not connected' });

    const spotifyTokens = req.session.spotify;
    if (!spotifyTokens) return res.status(401).json({ error: 'Spotify not connected' });

    const { spotifyPlaylistId, playlistName } = req.body;
    if (!spotifyPlaylistId || !playlistName) {
      return res.status(400).json({ error: 'Missing spotifyPlaylistId or playlistName' });
    }

    const tidalAuth    = `Bearer ${tidalTokens.access_token}`;
    const spotifyAuth  = `Bearer ${spotifyTokens.access_token}`;
    const TIDAL_BASE   = 'https://openapi.tidal.com/v2';
    const COUNTRY      = 'US';

    try {
      // --- Step 1: Fetch all Spotify tracks with ISRCs ---
      let spotifyTracks = [];
      let nextUrl = `https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/items?limit=100`;

      while (nextUrl) {
        const r    = await axios.get(nextUrl, { headers: { Authorization: spotifyAuth } });
        const items = r.data.items || [];
        spotifyTracks = spotifyTracks.concat(items);
        nextUrl = r.data.next || null;
      }

      // Extract valid tracks with ISRCs
      const tracksWithISRC = spotifyTracks
        .map(item => item.track || item.item)
        .filter(t => t && t.external_ids?.isrc)
        .map(t => ({
          name:   t.name,
          artist: t.artists?.[0]?.name || '',
          isrc:   t.external_ids.isrc,
        }));

      // --- Step 2: Look up each track on Tidal (ISRC first, then name+artist fallback) ---
      const matched   = [];
      const unmatched = [];

      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

      for (const track of tracksWithISRC) {
        // Try ISRC first
        try {
          const r = await axios.get(`${TIDAL_BASE}/tracks`, {
            headers: { Authorization: tidalAuth },
            params:  { 'filter[isrc]': track.isrc, countryCode: COUNTRY },
          });
          const results = r.data?.data;
          if (results && results.length > 0) {
            matched.push({ tidalId: results[0].id, matchedBy: 'isrc', ...track });
            await delay(150);
            continue;
          }
        } catch (_) {}

        // Fallback: search by track name + artist, with progressively cleaned queries
        const cleanName = track.name
          .replace(/\s*\(feat\.?[^)]*\)/gi, '')
          .replace(/\s*\(ft\.?[^)]*\)/gi, '')
          .replace(/\s*\(with [^)]*\)/gi, '')
          .replace(/\s*- (Extended|Original|Remaster|Radio|Album|Explicit|Clean|Dirty)[^)$]*/gi, '')
          .replace(/\s*\[[^\]]*\]/g, '')
          .trim();

        const queries = [
          `${track.name} ${track.artist}`,
          ...(cleanName !== track.name ? [
            `${cleanName} ${track.artist}`,
            cleanName,
          ] : []),
          track.name,
          track.artist,
        ];

        let foundBySearch = false;
        for (const query of queries) {
          try {
            const r = await axios.get(`${TIDAL_BASE}/searchResults/${encodeURIComponent(query)}/relationships/tracks`, {
              headers: { Authorization: tidalAuth },
              params:  { countryCode: COUNTRY, limit: 5 },
            });
            const items = r.data?.data || [];
            if (items.length > 0) {
              matched.push({ tidalId: items[0].id, matchedBy: 'search', ...track });
              foundBySearch = true;
              break;
            }
          } catch (err) {
            console.error('Tidal search error for', query, err.response?.data || err.message);
          }
          await delay(150);
        }
        if (foundBySearch) { await delay(150); continue; }

        unmatched.push(track);
        await delay(150);
      }

      if (matched.length === 0) {
        return res.json({
          success:  false,
          message:  'No tracks could be matched on Tidal.',
          matched:  0,
          total:    tracksWithISRC.length,
          unmatched: unmatched.map(t => `${t.name} — ${t.artist}`),
        });
      }

      // --- Step 3: Create a new Tidal playlist (v2 API) ---
      const createRes = await axios.post(
        `${TIDAL_BASE}/playlists`,
        {
          data: {
            type:       'playlists',
            attributes: {
              name:        playlistName,
              description: 'Converted from Spotify by TidalConverter',
              privacy:     'PRIVATE',
            },
          },
        },
        {
          headers: {
            Authorization:  tidalAuth,
            'Content-Type': 'application/vnd.api+json',
          },
        }
      );

      const tidalPlaylistId = createRes.data?.data?.id;
      if (!tidalPlaylistId) throw new Error('Failed to create Tidal playlist');
      console.log('Created Tidal playlist:', tidalPlaylistId);

      // --- Step 4: Add matched tracks in batches of 50 (v2 API) ---
      const BATCH = 20;
      for (let i = 0; i < matched.length; i += BATCH) {
        const batch = matched.slice(i, i + BATCH);
        await axios.post(
          `${TIDAL_BASE}/playlists/${tidalPlaylistId}/relationships/items`,
          { data: batch.map(t => ({ id: String(t.tidalId), type: 'tracks' })) },
          {
            headers: {
              Authorization:  tidalAuth,
              'Content-Type': 'application/vnd.api+json',
            },
          }
        );
      }

      // Record conversion in DB
      if (req.session.user) {
        await User.recordConversion({
          userId:           req.session.user.id,
          name:             playlistName,
          spotifyPlaylistId,
          tidalPlaylistId,
        });
      }

      res.json({
        success:        true,
        matched:        matched.length,
        byIsrc:         matched.filter(t => t.matchedBy === 'isrc').length,
        bySearch:       matched.filter(t => t.matchedBy === 'search').length,
        total:          tracksWithISRC.length,
        tidalPlaylistId,
        unmatched:      unmatched.map(t => `${t.name} — ${t.artist}`),
      });

    } catch (err) {
      console.error('Tidal convert error:', err.response?.data || err.message);
      res.status(500).json({ error: 'Conversion failed', detail: err.response?.data || err.message });
    }
  }
}

module.exports = { TidalController, getValidTokens };

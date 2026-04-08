// Tidal Playlist Converter — Frontend utilities
document.addEventListener('DOMContentLoaded', () => {
  checkServerHealth();
});

async function checkServerHealth() {
  try {
    const res  = await fetch('/api/health');
    const data = await res.json();
    if (data.status !== 'OK') console.warn('Server health check returned:', data);
  } catch (err) {
    console.error('Server unreachable:', err);
  }
}

// Import playlist skeleton functionality

async function importPlaylist() {
    const input = document.getElementById("playlist-url");
    const url = input.value;

    if (checkURL(url) == false) {
        console.log('Invalid link: ', url);
        return;
    }

    const id = extractID(url);
    if (id == null) {
        console.log('No ID found: ', id);
        return;
    }

    console.log('Valid ID found: ', id);
    getPlaylist(id);
}

function checkURL(url) {
    const regex = /^https:\/\/open\.spotify\.com\/playlist\/|spotify:playlist:/i;
    return regex.test(url);
}

function extractID(url) {
    const regex = /playlist\/(.*?)\?si/i;
    return regex.exec(url)[1];
}

async function getAuthToken() {
    const clientID = null /* Temporary until I can resolve my issues */;
    const clientSecret = null /* Temporary until I can resolve my issues */;

    const response = await fetch('https://spotify.com', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
    });

    const data = await response.json();
    return data.access_token;
}

async function getPlaylist(id) {
    // Should be functional, but I'm running into issues regarding the .env variables and sending API requests.

    const authToken = getAuthToken();

    const response = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });
    const data = await response.json();

    return data.items.map(item => ({
        name: item.track.name,
        artist: item.track.artists[0].name
    }))
}

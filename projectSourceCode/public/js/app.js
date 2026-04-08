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

async function getPlaylist(id) {
    console.log(env.SPOTIFY_CLIENT_ID)
}

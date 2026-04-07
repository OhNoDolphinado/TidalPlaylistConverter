<<<<<<< HEAD
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
=======
// Tidal Playlist Converter - Frontend JavaScript
document.addEventListener('DOMContentLoaded', () => {
  console.log('App loaded');
  checkServerHealth();
});

async function checkServerHealth() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    console.log('Server status:', data);
  } catch (error) {
    console.error('Failed to reach server:', error);
  }
}

async function checkLogin() {
  const response = await fetch('/api/auth/session');
  const data = await response.json();

  const loggedOutDiv = document.getElementById('loggedOut');
  const loggedInDiv = document.getElementById('loggedIn');
  const welcomeMessage = document.getElementById('welcomeMessage');

  if (data.loggedIn) {
    console.log('User is logged in', data.user);
    loggedInDiv.style.display = 'block';
    loggedOutDiv.style.display = 'none';
    welcomeMessage.textContent = `Welcome, ${data.user.username}`;//Maybe put icon in top left
  } else {
    console.log('User is NOT logged in');
    loggedInDiv.style.display = 'none';
    loggedOutDiv.style.display = 'block';
  }
}
checkLogin();

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
>>>>>>> 3720929 (Progress made with importing a full playlist.)

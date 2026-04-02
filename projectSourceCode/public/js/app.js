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
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

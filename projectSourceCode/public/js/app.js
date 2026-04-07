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

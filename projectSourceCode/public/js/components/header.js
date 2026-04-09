const header = `
<nav class="navbar">
    <a href="/" class="navbar-brand">
      <span class="logo-icon">🎵</span>
      TidalConverter
    </a>
    <ul class="navbar-nav" id="main-nav">
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
      <li id="nav-login"><a href="/login" class="btn-nav-outline">Sign In</a></li>
      <li id="nav-register"><a href="/register" class="btn-nav">Get Started</a></li>
      <li id="nav-profile" class="hidden"><a href="/profile">Profile</a></li>
      <li id="nav-logout" class="hidden">
        <a href="#" onclick="handleLogout(event)" class="btn-nav-outline">Sign Out</a>
      </li>
    </ul>
  </nav>
`;

document.currentScript.insertAdjacentHTML('beforebegin', header);

const currentPath = window.location.pathname;

document.querySelectorAll('.navbar-nav a').forEach(link => {
  const linkPath = link.getAttribute('href');

  if (link.classList.contains('btn-nav')) {
    return;
  }

  if (linkPath === currentPath) {
    link.classList.add('active');
  }
});
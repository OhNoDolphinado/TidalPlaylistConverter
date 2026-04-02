const header = `
<header>
  <h1>🎵 Tidal Playlist Converter</h1>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/profile">Profile</a>
    <form action="/logout" method="post">
      <button type="submit">Logout</button>
    </form>
  </nav>
</header>
`;

document.currentScript.insertAdjacentHTML('beforebegin', header);
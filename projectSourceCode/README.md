# Tidal Playlist Converter

Convert and export your Tidal playlists to Spotify.

## Quick Start
- To simply use the application without running it locally, go to https://tidalplaylistconverter.onrender.com/
    1. Create an account
    2. Connect Spotify API (currently requires an email whitelist for access to API calls, contact a developer if needed)
    3. Connect Tidal API
    4. Go to "Playlists" tab
    5. Convert!
- To deploy it locally, follow the steps below. Know that you will have to change .env variables manually to reflect a local deploymenet.

## Contributors
- Drake Jones
- Alex Class
- Curtis Liu
- Ishaan Venkat

### Prerequisites
- Docker & Docker Compose

### Setup

1. Clone the repository
2. Navigate to project directory
3. Run the following command:

```bash
docker-compose up
```

The application will be available at `http://localhost:3000`

### Database

PostgreSQL runs on `localhost:5432`. Any SQL files in `init_data/` will be automatically executed on first startup.

## Project Structure

```
projectSourceCode/
├── src/
│   ├── config/          # Configuration (database, etc.)
│   ├── routes/          # API routes
│   ├── controllers/      # Business logic
│   ├── models/          # Database models
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
├── public/
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   ├── images/          # Images
│   └── *.html           # Static HTML files
├── init_data/           # Database initialization scripts
├── docker-compose.yaml  # Docker Compose configuration
├── package.json         # Node dependencies
└── .env                 # Environment variables
```

## Environment Variables

Check `.env` for database configuration. Default values should work with Docker Compose.

## API Endpoints

- `GET /` - Home page
- `GET /api/health` - Server status
- `GET /api/db-health` - Database connection status

## Testing

Tests run on Docker compose up command. Tests are stored in `test/server.spec.js`.

## Deployed application

https://tidalplaylistconverter.onrender.com/
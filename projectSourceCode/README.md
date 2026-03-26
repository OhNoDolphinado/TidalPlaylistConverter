# Tidal Playlist Converter

Convert and export your Tidal playlists to other platforms.

## Quick Start

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

Check `.env` for database configuration. Default values work with Docker Compose.

## API Endpoints

- `GET /` - Home page
- `GET /api/health` - Server status
- `GET /api/db-health` - Database connection status

# Raspi Media API

A modern REST API for scanning, cataloging, and streaming your local movie and TV series collection. Optimized for
Raspberry Pi and home servers, with flexible configuration and Docker support.

---

## ✅ Features

- **Automatic Media Scanning:** Detects movies and series (including season/episode structure) from NAS folders and
  fetches metadata from [TMDb](https://www.themoviedb.org/).
- **Series Metadata:** Complete series detection with episode relationships and metadata.
- **TMDB Enrichment:** Automatic enrichment with titles, descriptions, genres, languages, release years, ratings, and
  images.
- **Local Posters & Backdrops:** Stores images under `/data/posters/<series>` and `/data/backdrops/<series>`.
- **Genre Mapping:** Automatically translates TMDB genre IDs into readable names.
- **Streaming:** Stream movies and series episodes via HTTP.
- **Favorites & Watched:** Mark media as favorite or watched.
- **Playback Position:** Save and resume playback positions.
- **Search & Filter:** Search by title, description, or genre.
- **Statistics:** Quick overview of your collection.
- **Swagger API Docs:** Interactive API documentation at `/api/docs`.
- **Docker Ready:** Easy deployment with Docker on any platform.

---

## ⚙️ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/mariokreitz/raspi-media-api.git
cd raspi-media-api
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your settings:

```bash
cp .env.example .env
```

- **TMDB_API_KEY:** Get a free [TMDb API key](https://www.themoviedb.org/settings/api) (**required!**).
- **MEDIA_BASE_PATH, MOVIES_DIR, SERIES_DIR:** Adjust the paths to your media folders.

### 3. Start Locally

```bash
npm run dev
# or
npm start
```

The API will be available at [http://localhost:3000](http://localhost:3000).

---

## 📁 NAS Folder Structure

The scanner expects the following folder structure for series:

```
<MEDIA_BASE_PATH>/
├── Movies/
│   └── <movies>
└── Series/
    └── <series name>/
        └── Staffel 1/
            ├── E01.mp4
            ├── E02.mp4
            └── ...
        └── Staffel 2/
            └── ...
```

> **Note:** The folder names `Movies` and `Series` are configurable via the environment variables `MOVIES_DIR` and
`SERIES_DIR`.

---

## 📸 Local Image Storage

Posters and backdrops are automatically downloaded from TMDB and stored locally:

- **Posters:** `/data/posters/<series name>/poster.jpg`
- **Backdrops:** `/data/backdrops/<series name>/backdrop.jpg`
- **Episode images:** `/data/posters/<series name>/S1E1.jpg`

Images are organized by series or movie name and are accessible via the API.

---

## 🗃️ SQLite DB Schema

The application uses SQLite as a database with the following schema:

```sql
-- Table: media (episodes and movies)
id
INTEGER PRIMARY KEY AUTOINCREMENT
filename          TEXT
filepath          TEXT UNIQUE
filesize          INTEGER
title             TEXT
description       TEXT
poster            TEXT
year              TEXT
genre             TEXT
language          TEXT
rating            REAL
mediaType         TEXT
favorite          INTEGER DEFAULT 0
watched           INTEGER DEFAULT 0
playback_position INTEGER DEFAULT 0
last_played       TIMESTAMP
seriesId          INTEGER  -- Link to the series table

-- Table: series (series metadata)
id                INTEGER PRIMARY KEY AUTOINCREMENT
title             TEXT NOT NULL
original_name     TEXT
overview          TEXT
first_air_date    TEXT
poster_path       TEXT
backdrop_path     TEXT
genre             TEXT
original_language TEXT
origin_country    TEXT
popularity        REAL
vote_average      REAL
vote_count        INTEGER
mediaType         TEXT
```

---

## 🌐 API Documentation

- **Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### 🚀 Main Endpoints

| Method | Path                      | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | `/api/media`              | List all series including episodes |
| POST   | `/api/media/scan`         | Scan and update the catalog        |
| GET    | `/api/media/stream/:id`   | Stream a file                      |
| GET    | `/api/media/search?q=...` | Search by title/description        |
| PATCH  | `/api/media/:id/favorite` | Toggle favorite status             |
| PATCH  | `/api/media/:id/watch`    | Toggle watched status              |
| PUT    | `/api/media/:id/position` | Save playback position             |
| GET    | `/api/media/genres`       | All available genres               |
| GET    | `/api/media/stats`        | Collection statistics              |

### Example: Series API

```bash
curl http://localhost:3000/api/media
```

**Response:**

```json
{
  "series": [
    {
      "id": 1,
      "title": "The Office",
      "overview": "A mockumentary on a group of typical office workers...",
      "genre": "Comedy",
      "poster": "/data/posters/the_office/poster.jpg",
      "backdrop": "/data/backdrops/the_office/backdrop.jpg",
      "mediaType": "series",
      "episodes": [
        {
          "id": 101,
          "title": "Pilot",
          "filepath": "/Series/The Office/Staffel 1/E01.mp4",
          "poster": "/data/posters/the_office/S1E1.jpg",
          "year": "2005",
          "genre": "Comedy",
          "mediaType": "series",
          "seriesId": 1
        }
      ]
    }
  ],
  "pagination": {
    "total": 1,
    "totalPages": 1,
    "currentPage": 1,
    "limit": 20,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Example: Start Scan

```bash
curl -X POST http://localhost:3000/api/media/scan
```

---

## 💡 Development & Roadmap

### Development Tips

- Make sure `TMDB_API_KEY` is set correctly in your `.env` file.
- Use the Swagger UI for API testing and documentation.
- All persistent data (images, database) is stored under `/data`.
- On first start, a `POST /api/media/scan` will fully index your collection.

### Roadmap

- **Web UI:** User interface for browsing and streaming.
- **Improved Streaming:** Transcoding support for various devices.
- **Multi-User:** Support for multiple user profiles with individual favorites.
- **Enhanced Search:** Full-text search and advanced filters.
- **Automatic Updates:** Regular metadata updates.

---

## Docker

```bash
docker compose --profile base up
```

For Linux (with direct NAS mount):

```bash
docker compose --profile linux up
```

For Windows (with SMB/CIFS):

```bash
docker compose --profile windows up
```

> **Tip:** See [README.Docker.md](README.Docker.md) for all environment variables and volume options.

---

## Environment Variables

| Variable        | Description             | Example             |
|-----------------|-------------------------|---------------------|
| TMDB_API_KEY    | TMDb API key (required) | `abcdef123456`      |
| MEDIA_BASE_PATH | Path to media root      | `/mnt/nas/Homeflix` |
| MOVIES_DIR      | Movies subfolder        | `Movies`            |
| SERIES_DIR      | Series subfolder        | `Series`            |
| PORT            | API server port         | `3000`              |

---

## Contributing

Pull requests and issues are welcome! Please open an issue for bugs or feature requests.

---

## License

[MIT](LICENSE)

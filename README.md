# Raspi Media API

A modern REST API for scanning, cataloging, and streaming your local movie and TV series collection. Designed for
Raspberry Pi and home servers, with flexible configuration and Docker support.

---

## Features

- **Automatic Media Scanning:** Recursively scans your media folders and fetches metadata
  from [TMDb](https://www.themoviedb.org/).
- **Streaming:** Stream movies and series directly via HTTP.
- **Favorites & Watched:** Mark media as favorite or watched.
- **Playback Position:** Save and resume playback positions.
- **Genre & Search:** Filter and search your catalog.
- **Statistics:** Get quick stats about your collection.
- **Flexible Configuration:** All paths and settings via environment variables.
- **Docker Ready:** Runs easily on any platform with Docker.

---

## Quick Start

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

- Get a free [TMDb API key](https://www.themoviedb.org/settings/api).
- Adjust `MEDIA_BASE_PATH`, `MOVIES_DIR`, `SERIES_DIR` to your media folders.

### 3. Run Locally

```bash
npm run dev
# or
npm start
```

API will be available at [http://localhost:3000](http://localhost:3000).

---

## Docker

### Build & Run

```bash
docker compose --profile base up
```

#### For Linux (with direct NAS mount):

```bash
docker compose --profile linux up
```

#### For Windows (with SMB/CIFS):

```bash
docker compose --profile windows up
```

> **Tip:** See `docker-compose.yaml` for all environment variables and volume options.

---

## Environment Variables

| Variable        | Description                  | Example             |
|-----------------|------------------------------|---------------------|
| TMDB_API_KEY    | TMDb API key (required)      | `abcdef123456`      |
| MEDIA_BASE_PATH | Path to your media root      | `/mnt/nas/Homeflix` |
| MOVIES_DIR      | Movies subfolder             | `Movies`            |
| SERIES_DIR      | Series subfolder             | `Series`            |
| PORT            | API server port              | `3000`              |
| NAS_SERVER      | (Windows) NAS server address | `192.168.1.10`      |
| NAS_SHARE       | (Windows) NAS share name     | `media`             |
| NAS_USER        | (Windows) NAS username       | `admin`             |
| NAS_PASS        | (Windows) NAS password       | `password`          |

---

## API Documentation

- **Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Main Endpoints:**
    - `GET /api/media` — List all media
    - `POST /api/media/scan` — Scan and update catalog
    - `GET /api/media/stream/:id` — Stream a file
    - `PATCH /api/media/:id/favorite` — Toggle favorite
    - `PATCH /api/media/:id/watch` — Toggle watched
    - ...and more!

---

## Folder Structure

```
raspi-media-api/
├── src/
│   ├── controllers/
│   ├── config/
│   ├── routes/
│   ├── utils/
│   └── ...
├── data/
│   └── media_catalog.db
├── Dockerfile
├── docker-compose.yaml
├── .env.example
└── README.md
```

---

## Contributing

Pull requests and issues are welcome! Please open an issue for bugs or feature requests.

---

## License

[MIT](LICENSE)

---


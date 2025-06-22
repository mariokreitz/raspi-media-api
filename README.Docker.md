# Docker Guide for Raspi Media API

This guide explains how to build and run the Raspi Media API using Docker and Docker Compose.

---

## Quick Start

### Build & Run (Default)

```bash
docker compose --profile base up --build
```

The API will be available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Configure the application via a `.env` file or by passing variables directly. Key variables:

- `PORT` (default: 3000)
- `TMDB_API_KEY` (required)
- `MEDIA_BASE_PATH` (default: `/mnt/nas/Homeflix`)
- `MOVIES_DIR` (default: `Movies`)
- `SERIES_DIR` (default: `Series`)
- (Windows/NAS only) `NAS_SERVER`, `NAS_SHARE`, `NAS_USER`, `NAS_PASS`

See `.env.example` for a template.

---

## Volumes

Persistent data (e.g. posters, database) is stored in the `./data` directory, mounted into the container at `/app/data`.

For Linux, you can also mount your media directory directly:

```yaml
# docker-compose.yaml (linux profile)
volumes:
  - ./data:/app/data
  - /mnt/nas/Homeflix:/mnt/nas/Homeflix
```

---

## Docker Compose Profiles

The `docker-compose.yaml` provides different profiles for various environments:

- **base**: Standard configuration (local data only)
- **windows**: For Windows with SMB/NAS mount (requires NAS variables and privileged mode)
- **linux**: For Linux with direct host mount (bind-mounts your media path)

### Example: Windows (SMB/NAS)

```bash
docker compose --profile windows up --build
```

### Example: Linux (direct mount)

```bash
docker compose --profile linux up --build
```

---

## Deploying to the Cloud

1. Build your image for the correct platform (if needed):

   ```bash
   docker build --platform=linux/amd64 -t myapp .
   ```

2. Push to your registry:

   ```bash
   docker push myregistry.com/myapp
   ```

3. Deploy using your cloud provider's instructions.

See Docker's [getting started guide](https://docs.docker.com/go/get-started-sharing/) for more details.

---

## References

- [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)
- [Official Docker documentation](https://docs.docker.com/)

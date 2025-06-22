### Building and running your application

To build and start your application, run:
`docker compose up --build`.

Your application will be available at http://localhost:3000.

#### Environment variables

You can configure the application using environment variables, either via a `.env` file or directly in your compose
command. Important variables include:

- `PORT` (default: 3000)
- `TMDB_API_KEY`
- `MEDIA_BASE_PATH` (default: `/mnt/nas/Homeflix`)
- `MOVIES_DIR` (default: `Movies`)
- `SERIES_DIR` (default: `Series`)
- (for Windows/NAS) `NAS_SERVER`, `NAS_SHARE`, `NAS_USER`, `NAS_PASS`

#### Volumes

The application stores persistent data (e.g. posters, database) in the `./data` directory, which is mounted into the
container at `/app/data`.

#### Profiles

The `docker-compose.yaml` provides different profiles for various environments:

- `base`: Standard-Konfiguration (nutzt lokale Daten)
- `windows`: Für Windows mit SMB/NAS-Mount (setzt zusätzliche NAS-Variablen, benötigt privilegierten Modus)
- `linux`: Für Linux mit direktem Host-Mount (bind-mount auf MEDIA_BASE_PATH)

Example for Windows:

```
docker compose --profile windows up --build
```

Example for Linux:

```
docker compose --profile linux up --build
```

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References

* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)
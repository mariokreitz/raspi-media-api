#!/bin/sh
  set -e

  log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  }

  # Create directory structure
  log "Creating directory structure..."
  MEDIA_BASE_PATH="${MEDIA_BASE_PATH:-/mnt/nas/Homeflix}"
  MOVIES_DIR="${MOVIES_DIR:-Movies}"
  SERIES_DIR="${SERIES_DIR:-Series}"

  mkdir -p /mnt/nas

  # Establish NAS connection
  NAS_TYPE="${NAS_TYPE:-smb}"

  if [ "$NAS_TYPE" = "smb" ]; then
    log "Preparing SMB mount..."

    # Check for necessary packages
    if ! command -v mount.cifs >/dev/null; then
      log "Installing cifs-utils..."
      apk add --no-cache cifs-utils
    fi

    log "Checking network connectivity to ${NAS_SERVER}..."
    ping -c 2 ${NAS_SERVER} || log "WARNING: Server not reachable"

    log "Mounting SMB share..."
    mount -t cifs //${NAS_SERVER}/${NAS_SHARE} /mnt/nas \
      -o username=${NAS_USER},password=${NAS_PASS},iocharset=utf8 || \
      log "WARNING: Mount failed - trying to start application anyway"
  fi

  mkdir -p ${MEDIA_BASE_PATH}/${MOVIES_DIR}
  mkdir -p ${MEDIA_BASE_PATH}/${SERIES_DIR}

  log "Mount status:"
  mount | grep "/mnt/nas" || log "No mount visible"
  ls -la ${MEDIA_BASE_PATH} || log "Media directory not accessible"

  export PORT=${PORT:-3000}
  log "Starting server on port ${PORT}..."

  exec node src/app.js
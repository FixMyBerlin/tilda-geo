#!/bin/bash
# Updates the OSM file to the latest minute and starts processing with it.
# On the server in /srv; GitHub workflow "Refresh OSM Data" runs it.
set -euo pipefail
cd "$(dirname "$0")"

stop_if_processing_runs() {
  if [ -n "$(docker compose ps --status running --quiet processing)" ]; then
    echo "Processing is already running, try again when it is done." >&2
    exit 1
  fi
}

stop_if_processing_runs
docker compose run --rm -T pbf-update
# A nightly or deploy run may have started during the update.
stop_if_processing_runs
docker compose down processing
SKIP_DOWNLOAD=1 WAIT_FOR_FRESH_DATA=0 docker compose up -d processing
echo "Processing started, follow it with: docker logs -f processing"

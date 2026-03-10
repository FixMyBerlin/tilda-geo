#!/bin/bash
set -e

# Fix ownership of mounted volumes at runtime.
# The ./data bind mount is created by Docker as root, so we correct permissions
# for each subdirectory the processing user needs to write to.
# NOTE: /data/db is intentionally excluded — it is the Postgres data volume
# and must remain owned by the postgres user.
mkdir -p /data/downloads /data/filtered /data/hashes /data/processingTypes /data/pseudoTagsData
chown -R processing:processing /data/downloads /data/filtered /data/hashes /data/processingTypes /data/pseudoTagsData /cache_nginx_proxy

exec gosu processing "$@"

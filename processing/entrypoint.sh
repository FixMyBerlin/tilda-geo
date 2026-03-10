#!/bin/bash
set -e

# Fix ownership of mounted volumes at runtime.
# Docker creates named volumes and bind mounts initially as root.
# The processing user (uid 1001) needs write access to /data and /cache_nginx_proxy.
# NOTE: /data/db is NOT mounted in this container, so chown -R /data is safe.
chown -R processing:processing /data /cache_nginx_proxy

exec gosu processing "$@"

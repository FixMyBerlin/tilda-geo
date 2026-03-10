#!/bin/bash
set -e

# Fix ownership of mounted volumes at runtime.
# Named Docker volumes keep the ownership from when they were first created,
# so we need to correct permissions on every start.
chown -R processing:processing /data

exec gosu processing "$@"

#!/bin/bash
# Run from the repository root. See docs/docker-local-development.md
source ./.env
[ -f ./.env.local ] && source ./.env.local
stack_id="${DEV_ATTACH_STACK:-${DEV_STACK_ID:-}}"
if [ -z "$stack_id" ] && [ -n "${COMPOSE_DEV_CONTAINER_PREFIX:-}" ]; then
  stack_id="${COMPOSE_DEV_CONTAINER_PREFIX%_}"
fi
db_container="${stack_id:+${stack_id}_}db"
docker exec -ti "$db_container" psql -d "$DATABASE_NAME" -U "$DATABASE_USER"

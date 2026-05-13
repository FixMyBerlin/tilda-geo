#!/bin/bash
# This script is used to conviently access the psql shell of the database
# Run from the repository root so ./.env matches docker-compose.override.yml (COMPOSE_DEV_CONTAINER_PREFIX).
source ./.env
: "${COMPOSE_DEV_CONTAINER_PREFIX:=}"
db_container="${COMPOSE_DEV_CONTAINER_PREFIX}db"
docker exec -ti "$db_container" psql -d "$DATABASE_NAME" -U "$DATABASE_USER"

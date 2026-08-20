# TanStack Start (Vite + Nitro preset bun)
# oven/bun:1-debian installs the latest Bun 1.x whenever this image is built.
# Debian (not Alpine) is the right choice: apt can install gdal-bin and postgresql-client, and Prisma needs glibc.
FROM oven/bun:1-debian AS base

# Usage
#   - gdal-bin: ogr2ogr for exports.
#     Reminder: Debian 13 Trixie (stable) ships GDAL 3.10.3. `gdal vector edit` needs 3.11+ (not in Trixie).
#   - postgresql-client: pg_restore for data-schema Import (Debian metapackage; Trixie default is 17).
# Important for local dev:
#   staging and production use these packages in this image; local dev needs host copies.
#   See app/README.md#host-binaries-local-vs-server for details.
# Important for Postgres updates:
#   See data-schema/README.md#postgres-major-versions for details
RUN apt-get update && \
    apt-get install -y --no-install-recommends gdal-bin postgresql-client curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Run as non-root (same goal as 3a98065). oven/bun provides a pre-created `bun`
# user. Dropping privileges *here*, before the first write into /app, instead of
# after the build: every artifact below is then created owned by `bun` already,
# so no recursive chown is needed to hand the tree over at the end. That chown
# used to be by far the most expensive step in the build — ~10min of walking the
# tree plus ~3min re-exporting a full duplicate of node_modules and .output, on
# every single commit, because it sat after `bun run build` and could never hit
# the layer cache.
RUN mkdir -p /app && chown bun:bun /app
USER bun
WORKDIR /app

# Dependencies (layer cached unless package files change).
# Do not copy app/bunfig.toml here: it enables globalStore for local/dev only.
# That layout symlinks into /root/.bun, which USER bun cannot read at runtime.
COPY --chown=bun:bun app/package.json app/bun.lock ./
# Install without lifecycle scripts `postinstall`.
RUN bun install --frozen-lockfile --ignore-scripts

# App source (needed for prisma.config.ts and Vite build)
COPY --chown=bun:bun app /app

# Generate `@prisma/client` explicitly for this image build because `bun run build` imports `@prisma/client`, so the generated client must exist before build.
RUN bun run postinstall

# Build-time env for Vite client bundle (inlined at build)
ARG VITE_APP_ENV
ARG VITE_APP_ORIGIN
ARG VITE_TILES_URL
ENV VITE_APP_ENV=${VITE_APP_ENV}
ENV VITE_APP_ORIGIN=${VITE_APP_ORIGIN}
ENV VITE_TILES_URL=${VITE_TILES_URL}
RUN bun run build

ENV TZ=Europe/Berlin
EXPOSE 4000

# Production: run migrations then Nitro server (Bun). Runtime DATABASE_* from compose.
CMD ["/bin/sh", "-c", "bunx prisma migrate deploy && exec bun run .output/server/index.mjs"]

# TanStack Start (Vite + Nitro preset bun)
FROM oven/bun:1 AS base

# TODO: Validate which distro oven/bun is and which gdal is installed there.
# Debian 13 Trixie (stable) includes GDAL 3.10.3+ (supports gdal vector edit)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gdal-bin curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies (layer cached unless package files change)
COPY app/package.json app/bun.lock app/
RUN bun install --frozen-lockfile
RUN bun run postinstall || true

# App source (needed for prisma.config.ts and Vite build)
COPY app /app

# Prisma generate (prisma.config.ts needs DATABASE_* at load; dummy values only for generate)
RUN DATABASE_HOST=build DATABASE_USER=build DATABASE_PASSWORD=build DATABASE_NAME=build bunx prisma generate

# Build-time env for Vite client bundle (inlined at build)
ARG VITE_APP_ENV
ARG VITE_APP_ORIGIN
ENV VITE_APP_ENV=${VITE_APP_ENV}
ENV VITE_APP_ORIGIN=${VITE_APP_ORIGIN}
RUN bun run build

# Run as non-root (same goal as 3a98065). oven/bun provides a pre-created `bun` user; chown so it can read/write app files.
RUN chown -R bun:bun /app
USER bun

ENV TZ=Europe/Berlin
EXPOSE 4000

# Production: run migrations then Nitro server (Bun). Runtime DATABASE_* from compose.
CMD ["/bin/sh", "-c", "bunx prisma migrate deploy && exec bun run .output/server/index.mjs"]

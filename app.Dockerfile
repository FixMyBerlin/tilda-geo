# TanStack Start (Vite + Nitro preset node-server), run on Node + nub (replaces Bun)
FROM node:26-trixie-slim AS base

# nub: the drop-in for Bun (TypeScript runner + package manager) on stock Node.
RUN npm install -g --ignore-scripts=false @nubjs/nub

# Debian 13 Trixie (stable) includes GDAL 3.10.3+ (supports gdal vector edit)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gdal-bin curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies (layer cached unless package files change)
COPY app/package.json app/lock.yaml app/.npmrc ./
# Install without lifecycle scripts `postinstall`.
RUN nub install --frozen-lockfile --ignore-scripts

# App source (needed for prisma.config.ts and Vite build)
COPY app /app

# Generate `@prisma/client` explicitly for this image build because `nub run build` imports `@prisma/client`, so the generated client must exist before build.
RUN nub run postinstall

# Build-time env for Vite client bundle (inlined at build)
ARG VITE_APP_ENV
ARG VITE_APP_ORIGIN
ENV VITE_APP_ENV=${VITE_APP_ENV}
ENV VITE_APP_ORIGIN=${VITE_APP_ORIGIN}
RUN nub run build

# Run as non-root. The official node image provides a pre-created `node` user; chown so it can read/write app files.
RUN chown -R node:node /app
USER node

ENV TZ=Europe/Berlin
EXPOSE 4000

# Production: run migrations then the Nitro Node server. Runtime DATABASE_* from compose.
CMD ["/bin/sh", "-c", "nubx prisma migrate deploy && exec node .output/server/index.mjs"]

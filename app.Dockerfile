FROM node:24-trixie-slim AS base

# Debian 13 Trixie (stable) includes GDAL 3.10.3+ (supports gdal vector edit)
RUN apt-get update && \
    apt-get install -y gdal-bin && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY /app/package*.json /app/
COPY /app/patches /app/patches

RUN npm install-clean --legacy-peer-deps
RUN npm run postinstall

COPY /app /app

# Transfer ownership to the pre-existing non-root user 'node' (UID 1000) that
# comes with the node base image. See: https://www.docker.com/blog/understanding-the-docker-user-instruction/
RUN chown -R node:node /app
USER node

EXPOSE 4000

ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Europe/Berlin

ARG NEXT_PUBLIC_APP_ORIGIN
ARG NEXT_PUBLIC_APP_ENV

RUN npx blitz@2.2.4 prisma generate
RUN npx blitz@2.2.4 build

CMD ["/bin/sh", "-c", "npx blitz@2.2.4 prisma migrate deploy && npx blitz@2.2.4 start -p 4000"]

# From here on we are building the production image
FROM base AS production

# Switch back to root to install pm2 globally, then return to non-root user
USER root
RUN npm install --global pm2
USER node

# Docs: https://docs.docker.com/reference/build-checks/json-args-recommended/
CMD ["/bin/sh", "-c", "npx blitz@2.2.4 prisma migrate deploy && exec pm2-runtime node -- ./node_modules/next/dist/bin/next start -p 4000"]

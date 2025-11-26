FROM node:22-bookworm-slim AS base

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

EXPOSE 4000

ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Europe/Berlin

ARG NEXT_PUBLIC_APP_ORIGIN
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_OSM_API_URL

RUN npx blitz@2.2.2 prisma generate
RUN npx blitz@2.2.2 build

CMD ["/bin/sh", "-c", "npx blitz@2.2.2 prisma migrate deploy && npx blitz@2.2.2 start -p 4000"]

# From here on we are building the production image
FROM base AS production

RUN npm install --global pm2

# Docs: https://docs.docker.com/reference/build-checks/json-args-recommended/
CMD ["/bin/sh", "-c", "npx blitz@2.2.2 prisma migrate deploy && exec pm2-runtime node -- ./node_modules/next/dist/bin/next start -p 4000"]

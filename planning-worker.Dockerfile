FROM python:3.12-slim AS planning-worker

COPY --from=ghcr.io/astral-sh/uv:0.12.5 /uv /uvx /bin/

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Berlin
ENV PYTHONUNBUFFERED=1
# venv instead of system Python: byte-compile for faster first import,
# copy instead of hard-linking: the uv cache is a mount (see below), and links
# into it would not survive in the image layer.
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV UV_PYTHON_DOWNLOADS=never
LABEL maintainer="FixMyCity - https://fixmycity.de"

WORKDIR /planning-worker

# Geo wheels (geopandas/shapely/rasterio/pyproj) bundle GDAL/PROJ;
# only a C compiler/headers as fallback for possible source builds.
# libexpat1: GDAL (in the rasterio wheels) dlopens libexpat.so.1 at runtime,
# which the slim base lacks; needed to read the CIR DOP tiles (vegetation.py).
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl libexpat1 \
  && rm -rf /var/lib/apt/lists/*

# Lockfiles first: the dependency layer stays cached as long as
# pyproject.toml/uv.lock don't change (source code changes more often).
COPY planning-worker/pyproject.toml planning-worker/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-install-project

# Source code
COPY planning-worker/ /planning-worker/

ENV PATH="/planning-worker/.venv/bin:$PATH"

# DEM rasters are mounted later via the `planning_dem` volume,
# CIR DOP tiles (NDVI vegetation) via the `planning_cir` volume.
# World-writable so the non-root user set at runtime (user: UID:GID)
# can write into the freshly initialized named volumes.
RUN mkdir -p /dem /cir && chmod 0777 /dem /cir

CMD ["python", "worker.py"]

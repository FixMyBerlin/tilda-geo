FROM python:3.12-slim AS planning-worker

COPY --from=ghcr.io/astral-sh/uv:0.12.5 /uv /uvx /bin/

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Berlin
ENV PYTHONUNBUFFERED=1
# venv statt System-Python: byte-compilen fürs schnellere erste Import,
# hart verlinken statt kopieren spart Platz im Layer (Cache-Mount, s.u.).
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV UV_PYTHON_DOWNLOADS=never
LABEL maintainer="FixMyCity - https://fixmycity.de"

WORKDIR /planning-worker

# Geo-Wheels (geopandas/shapely/rasterio/pyproj) bringen GDAL/PROJ gebündelt mit;
# nur ein C-Compiler/headers als Fallback für evtl. Source-Builds.
# libexpat1: GDAL (in den rasterio-Wheels) dlopen't libexpat.so.1 zur Laufzeit,
# das im slim-Base fehlt – nötig fürs Lesen der CIR-DOP-Kacheln (vegetation.py).
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl libexpat1 \
  && rm -rf /var/lib/apt/lists/*

# Erst nur die Lockfiles: Dependency-Layer bleibt gecacht, solange sich
# pyproject.toml/uv.lock nicht ändern (Quellcode ändert sich häufiger).
COPY planning-worker/pyproject.toml planning-worker/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-install-project

# Quellcode
COPY planning-worker/ /planning-worker/

ENV PATH="/planning-worker/.venv/bin:$PATH"

# DEM-Raster werden später über das `planning_dem`-Volume gemountet.
# CIR-DOP-Kacheln (NDVI-Vegetation) über das `planning_cir`-Volume.
# World-writable, damit der zur Laufzeit gesetzte Nicht-Root-User (user: UID:GID)
# in die frisch initialisierten Named Volumes schreiben kann.
RUN mkdir -p /dem /cir && chmod 0777 /dem /cir

CMD ["python", "worker.py"]

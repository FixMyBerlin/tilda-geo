FROM python:3.12-slim AS planning-worker

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Berlin
ENV PYTHONUNBUFFERED=1
LABEL maintainer="FixMyCity - https://fixmycity.de"

WORKDIR /planning-worker

# Geo-Wheels (geopandas/shapely/rasterio/pyproj) bringen GDAL/PROJ gebündelt mit;
# nur ein C-Compiler/headers als Fallback für evtl. Source-Builds.
# libexpat1: GDAL (in den rasterio-Wheels) dlopen't libexpat.so.1 zur Laufzeit,
# das im slim-Base fehlt – nötig fürs Lesen der CIR-DOP-Kacheln (vegetation.py).
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl libexpat1 \
  && rm -rf /var/lib/apt/lists/*

COPY planning-worker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Quellcode
COPY planning-worker/ /planning-worker/

# DEM-Raster werden später über das `planning_dem`-Volume gemountet.
# CIR-DOP-Kacheln (NDVI-Vegetation) über das `planning_cir`-Volume.
# World-writable, damit der zur Laufzeit gesetzte Nicht-Root-User (user: UID:GID)
# in die frisch initialisierten Named Volumes schreiben kann.
RUN mkdir -p /dem /cir && chmod 0777 /dem /cir

CMD ["python", "worker.py"]

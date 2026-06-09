FROM python:3.12-slim AS planning-worker

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Berlin
ENV PYTHONUNBUFFERED=1
LABEL maintainer="FixMyCity - https://fixmycity.de"

WORKDIR /planning-worker

# Geo-Wheels (geopandas/shapely/rasterio/pyproj) bringen GDAL/PROJ gebündelt mit;
# nur ein C-Compiler/headers als Fallback für evtl. Source-Builds.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
  && rm -rf /var/lib/apt/lists/*

COPY planning-worker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Quellcode
COPY planning-worker/ /planning-worker/

# DEM-Raster werden später über das `planning_dem`-Volume gemountet.
RUN mkdir -p /dem

CMD ["python", "worker.py"]

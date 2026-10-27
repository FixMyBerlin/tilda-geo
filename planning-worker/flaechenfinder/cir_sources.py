"""CIR/RGBI tile sources for the vegetation computation.

Each source describes how tiles are cached, downloaded and read.
New sources can be added as another `CirSource` object in `KNOWN_SOURCES`
– no changes to vegetation.py needed.
"""
from __future__ import annotations

import os
import tempfile
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Callable

from shapely.geometry.base import BaseGeometry


@dataclass(frozen=True)
class CirSource:
    """Configuration of a CIR/RGBI tile source."""
    name: str
    crs: str             # EPSG code of the tile CRS
    tile_size_m: float   # tile edge length in meters
    pixel_size_m: float  # ground resolution in meters
    band_nir: int        # 1-based band index for NIR
    band_red: int        # 1-based band index for red
    # (easting_m, northing_m) → local cache file name (without directory)
    cache_filename_fn: Callable[[int, int], str]
    # (easting_m, northing_m, dest_path) → True on success
    download_fn: Callable[[int, int, str], bool]
    # Attribution required by the license (for MapLibre AttributionControl)
    attribution: str


# ── Helper ────────────────────────────────────────────────────────────────────

def _timeout_s() -> int:
    return int(os.environ.get("PLANNING_CIR_DOWNLOAD_TIMEOUT_S", "180"))


# ── Bayern DOP20 CIR (WMS, EPSG:25832, NIR=B1, Red=B2) ──────────────────────

def _bayern_download(easting_m: int, northing_m: int, dest: str) -> bool:
    wms_url = os.environ.get(
        "PLANNING_CIR_WMS_URL",
        "https://geoservices.bayern.de/pro/wms/dop/v1/dop20datenabgabe",
    )
    layer = os.environ.get("PLANNING_CIR_WMS_LAYER", "by_dop20cir_bayern")
    tile_m = 1000
    px = int(round(tile_m / 0.2))
    params = {
        "service": "wms", "version": "1.1.1", "request": "GetMap",
        "format": "image/tiff", "transparent": "true", "layers": layer,
        "srs": "EPSG:25832", "STYLES": "", "WIDTH": str(px), "HEIGHT": str(px),
        "BBOX": f"{easting_m},{northing_m},{easting_m + tile_m},{northing_m + tile_m}",
    }
    url = f"{wms_url}?{urllib.parse.urlencode(params)}"
    tmp_fd, tmp_path = tempfile.mkstemp(
        suffix=".tiff.part", dir=os.path.dirname(dest) or "."
    )
    os.close(tmp_fd)
    try:
        print(f"   ↓ loading CIR tile {easting_m}_{northing_m} …")
        with urllib.request.urlopen(url, timeout=_timeout_s()) as resp:
            ctype = resp.headers.get("Content-Type", "")
            if "tiff" not in ctype:
                raise ValueError(f"unexpected Content-Type {ctype!r}")
            with open(tmp_path, "wb") as f:
                while chunk := resp.read(1024 * 1024):
                    f.write(chunk)
        if os.path.getsize(tmp_path) == 0:
            raise ValueError("empty response")
        os.replace(tmp_path, dest)
        return True
    except Exception as e:
        print(f"   ⚠️  Bayern-WMS {easting_m}_{northing_m}: {e}")
        try:
            os.remove(tmp_path)
        except OSError:
            pass
        return False


SOURCE_BAYERN = CirSource(
    name="Bayern DOP20 CIR",
    crs="EPSG:25832",
    tile_size_m=1000.0,
    pixel_size_m=0.2,
    band_nir=1,
    band_red=2,
    cache_filename_fn=lambda e, n: f"{e}_{n}.tiff",
    download_fn=_bayern_download,
    attribution="© Bayerische Vermessungsverwaltung",
)


# ── Brandenburg/Berlin DOP20 CIR (WMS, EPSG:25833, NIR=B1, Red=B2) ────────────
#
# WMS: https://isk.geobasis-bb.de/mapproxy/dop20cir/service/wms
# Layer: bb_dop20cir  (CIR only, no full RGBI download needed)
# Tile grid: 1000 m, pixel 0.2 m (5000×5000 px).
# Band layout in the TIFF: NIR=B1, red=B2, green=B3.
# License: dl-de/by-2-0, attribution: "© GeoBasis-DE/LGB, dl-de/by-2-0"

def _bb_wms_download(easting_m: int, northing_m: int, dest: str) -> bool:
    wms_url = os.environ.get(
        "PLANNING_CIR_BB_WMS_URL",
        "https://isk.geobasis-bb.de/mapproxy/dop20cir/service/wms",
    )
    layer = os.environ.get("PLANNING_CIR_BB_WMS_LAYER", "bb_dop20cir")
    tile_m = 1000
    px = int(round(tile_m / 0.2))
    params = {
        "service": "WMS", "version": "1.1.1", "request": "GetMap",
        "format": "image/png", "transparent": "true", "layers": layer,
        "srs": "EPSG:25833", "STYLES": "", "WIDTH": str(px), "HEIGHT": str(px),
        "BBOX": f"{easting_m},{northing_m},{easting_m + tile_m},{northing_m + tile_m}",
    }
    url = f"{wms_url}?{urllib.parse.urlencode(params)}"
    tmp_fd, tmp_path = tempfile.mkstemp(
        suffix=".png.part", dir=os.path.dirname(dest) or "."
    )
    os.close(tmp_fd)
    try:
        print(f"   ↓ loading CIR tile BB {easting_m}_{northing_m} …")
        with urllib.request.urlopen(url, timeout=_timeout_s()) as resp:
            ctype = resp.headers.get("Content-Type", "")
            if "png" not in ctype:
                raise ValueError(f"unexpected Content-Type {ctype!r}")
            with open(tmp_path, "wb") as f:
                while chunk := resp.read(1024 * 1024):
                    f.write(chunk)
        if os.path.getsize(tmp_path) == 0:
            raise ValueError("empty response")
        os.replace(tmp_path, dest)
        return True
    except Exception as e:
        print(f"   ⚠️  BB-WMS {easting_m}_{northing_m}: {e}")
        try:
            os.remove(tmp_path)
        except OSError:
            pass
        return False


SOURCE_BB = CirSource(
    name="Brandenburg/Berlin DOP20 CIR",
    crs="EPSG:25833",
    tile_size_m=1000.0,
    pixel_size_m=0.2,
    band_nir=1,
    band_red=2,
    cache_filename_fn=lambda e, n: f"bb_{e}_{n}.png",
    download_fn=_bb_wms_download,
    attribution="© GeoBasis-DE/LGB, dl-de/by-2-0",
)


# ── Hessen DOP20 CIR (WMS, EPSG:25832, NIR=B1, Red=B2) ───────────────────────
#
# WMS: https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-images.ows
# Layer: he_dop20_cir  (DOP20 CIR false color, 0.2 m, free of charge/OGC "free-images")
# Tile grid: 500 m, pixel 0.2 m (2500×2500 px).
# Band layout in the TIFF: false-color RGB(+alpha) → NIR=B1 (red channel),
#   red=B2 (green channel), green=B3; the alpha band (B4) is unused.
# Like Bayern, Hessen uses EPSG:25832 (UTM32) and serves GeoTIFF.
# License: dl-de/zero-2-0 (open geodata of the HVBG).
#
# Tile size 500 m instead of 1000 m as for Bayern/BB: the MapServer behind this
# WMS hard-limits WIDTH/HEIGHT to 3000 px and answers larger requests with a
# ServiceException instead of an image ("Image size out of range").
# 1000 m at 0.2 m would be 5000 px – so far every tile failed and vegetation
# stayed empty across Hessen. 500 m gives 2500 px; resolution stays at 0.2 m,
# just 4 requests per km² instead of one.
_HESSEN_TILE_M = 500


def _hessen_download(easting_m: int, northing_m: int, dest: str) -> bool:
    wms_url = os.environ.get(
        "PLANNING_CIR_HE_WMS_URL",
        "https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-images.ows",
    )
    layer = os.environ.get("PLANNING_CIR_HE_WMS_LAYER", "he_dop20_cir")
    tile_m = _HESSEN_TILE_M
    px = int(round(tile_m / 0.2))
    params = {
        "service": "wms", "version": "1.1.1", "request": "GetMap",
        "format": "image/tiff", "transparent": "true", "layers": layer,
        "srs": "EPSG:25832", "STYLES": "", "WIDTH": str(px), "HEIGHT": str(px),
        "BBOX": f"{easting_m},{northing_m},{easting_m + tile_m},{northing_m + tile_m}",
    }
    url = f"{wms_url}?{urllib.parse.urlencode(params)}"
    tmp_fd, tmp_path = tempfile.mkstemp(
        suffix=".tiff.part", dir=os.path.dirname(dest) or "."
    )
    os.close(tmp_fd)
    try:
        print(f"   ↓ loading CIR tile HE {easting_m}_{northing_m} …")
        with urllib.request.urlopen(url, timeout=_timeout_s()) as resp:
            ctype = resp.headers.get("Content-Type", "")
            if "tiff" not in ctype:
                raise ValueError(f"unexpected Content-Type {ctype!r}")
            with open(tmp_path, "wb") as f:
                while chunk := resp.read(1024 * 1024):
                    f.write(chunk)
        if os.path.getsize(tmp_path) == 0:
            raise ValueError("empty response")
        os.replace(tmp_path, dest)
        return True
    except Exception as e:
        print(f"   ⚠️  Hessen-WMS {easting_m}_{northing_m}: {e}")
        try:
            os.remove(tmp_path)
        except OSError:
            pass
        return False


SOURCE_HESSEN = CirSource(
    name="Hessen DOP20 CIR",
    crs="EPSG:25832",
    tile_size_m=float(_HESSEN_TILE_M),
    pixel_size_m=0.2,
    band_nir=1,
    band_red=2,
    cache_filename_fn=lambda e, n: f"he_{e}_{n}.tiff",
    download_fn=_hessen_download,
    attribution="© Hessische Verwaltung für Bodenmanagement und Geoinformation (HVBG), dl-de/zero-2-0",
)


# Approximate geographic bounding box of Hessen (from WMS GetCapabilities,
# EX_GeographicBoundingBox of he_dop20_cir) for "auto" detection.
_HESSEN_BBOX_LONLAT = (7.6, 49.3, 10.3, 51.7)  # (west, south, east, north)


# ── Registry ──────────────────────────────────────────────────────────────────

KNOWN_SOURCES: dict[str, CirSource] = {
    "bayern": SOURCE_BAYERN,
    "bb": SOURCE_BB,
    "hessen": SOURCE_HESSEN,
}


def resolve_source(key: str, study_area_geom: BaseGeometry) -> CirSource | None:
    """Return the CirSource for `key`.

    "auto" picks by the study area centroid:
      1. inside the Hessen bounding box → Hessen (EPSG:25832, WMS)
      2. otherwise < 12°E → Bayern (EPSG:25832); ≥ 12°E → Brandenburg/Berlin (EPSG:25833).
    The Hessen box overlaps Bayern at the edge (Unterfranken); if in doubt, set the
    source explicitly via `cir_source` instead of "auto".
    Unknown keys return None (vegetation computation is skipped).
    """
    if key in KNOWN_SOURCES:
        return KNOWN_SOURCES[key]
    if key == "auto":
        try:
            c = study_area_geom.centroid
            lon, lat = c.x, c.y
            w, s, e, n = _HESSEN_BBOX_LONLAT
            if w <= lon <= e and s <= lat <= n:
                return SOURCE_HESSEN
            return SOURCE_BAYERN if lon < 12.0 else SOURCE_BB
        except Exception as exc:
            print(f"   ⚠️  Auto-detection of the CIR source failed: {exc}")
            return None
    print(f"   ⚠️  Unknown cir_source {key!r} – skipping vegetation computation")
    return None

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

from shapely.geometry import Polygon, box
from shapely.geometry.base import BaseGeometry
from shapely.ops import unary_union

from scoring.berlin_outline import BERLIN_OUTLINE_LONLAT


@dataclass(frozen=True)
class CirSource:
    """Configuration of a CIR/RGBI tile source."""
    key: str             # value of `cir_source` in the factor config; stored per vegetation row
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
    # NDVI above this counts as vegetation. Measured against OSM roofs and green
    # areas per source (see VEGETATION.md); it depends on season and image stretch.
    ndvi_min: float = 0.1


# ── Helper ────────────────────────────────────────────────────────────────────

def _timeout_s() -> int:
    return int(os.environ.get("SPACE_FINDER_CIR_DOWNLOAD_TIMEOUT_S", "180"))


_WMS_ATTEMPTS = 3


def _wms_download(
    label: str, wms_url: str, layer: str, srs: str, fmt: str, tile_m: int,
    easting_m: int, northing_m: int, dest: str, transparent: bool = True,
) -> bool:
    """GetMap for one tile at 0.2 m into `dest`. Retries aborted transfers (the BB
    and Berlin WMS often cut off a 50–100 MB tile mid-stream). False if the WMS
    sends no image (e.g. a ServiceException outside its coverage) or every
    attempt fails."""
    px = int(round(tile_m / 0.2))
    params = {
        "service": "WMS", "version": "1.1.1", "request": "GetMap",
        "format": fmt, "transparent": "true" if transparent else "false", "layers": layer,
        "srs": srs, "STYLES": "", "WIDTH": str(px), "HEIGHT": str(px),
        "BBOX": f"{easting_m},{northing_m},{easting_m + tile_m},{northing_m + tile_m}",
    }
    url = f"{wms_url}?{urllib.parse.urlencode(params)}"
    ext = fmt.split("/")[-1]
    print(f"   ↓ loading CIR tile {label} {easting_m}_{northing_m} …")
    for attempt in range(1, _WMS_ATTEMPTS + 1):
        tmp_fd, tmp_path = tempfile.mkstemp(
            suffix=f".{ext}.part", dir=os.path.dirname(dest) or "."
        )
        os.close(tmp_fd)
        try:
            with urllib.request.urlopen(url, timeout=_timeout_s()) as resp:
                ctype = resp.headers.get("Content-Type", "")
                if ext not in ctype:
                    # A ServiceException is an answer, not a transfer error: no retry.
                    print(
                        f"   ⚠️  {label}-WMS {easting_m}_{northing_m}: "
                        f"unexpected Content-Type {ctype!r}"
                    )
                    return False
                with open(tmp_path, "wb") as f:
                    while chunk := resp.read(1024 * 1024):
                        f.write(chunk)
            if os.path.getsize(tmp_path) == 0:
                raise ValueError("empty response")
            os.replace(tmp_path, dest)
            return True
        except Exception as e:
            print(
                f"   ⚠️  {label}-WMS {easting_m}_{northing_m} "
                f"(attempt {attempt}/{_WMS_ATTEMPTS}): {e}"
            )
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass
    return False


# ── Bayern DOP20 CIR (WMS, EPSG:25832, NIR=B1, Red=B2) ──────────────────────

def _bayern_download(easting_m: int, northing_m: int, dest: str) -> bool:
    return _wms_download(
        "Bayern",
        os.environ.get(
            "SPACE_FINDER_CIR_WMS_URL",
            "https://geoservices.bayern.de/pro/wms/dop/v1/dop20datenabgabe",
        ),
        os.environ.get("SPACE_FINDER_CIR_WMS_LAYER", "by_dop20cir_bayern"),
        "EPSG:25832", "image/tiff", 1000, easting_m, northing_m, dest,
    )


SOURCE_BAYERN = CirSource(
    key="bayern",
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
# Band layout in the PNG: NIR=B1, red=B2, green=B3.
# License: dl-de/by-2-0, attribution: "© GeoBasis-DE/LGB, dl-de/by-2-0"
#
# Outside Berlin the images are summer images (trees in leaf). The Berlin part
# is a spring flight without leaves, display-stretched so that roofs and asphalt
# sit at NDVI ~0.1; "auto" therefore uses SOURCE_BERLIN inside Berlin.

def _bb_wms_download(easting_m: int, northing_m: int, dest: str) -> bool:
    return _wms_download(
        "BB",
        os.environ.get(
            "SPACE_FINDER_CIR_BB_WMS_URL",
            "https://isk.geobasis-bb.de/mapproxy/dop20cir/service/wms",
        ),
        os.environ.get("SPACE_FINDER_CIR_BB_WMS_LAYER", "bb_dop20cir"),
        "EPSG:25833", "image/png", 1000, easting_m, northing_m, dest,
    )


SOURCE_BB = CirSource(
    key="bb",
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


# ── Berlin TrueDOP20 CIR, summer 2025 (WMS, EPSG:25833, NIR=B1, Red=B2) ──────
#
# WMS: https://gdi.berlin.de/services/wms/truedop_2025_sommer
# Layer: truedop_2025_sommer_cir  (flight 11–12 Aug 2025, trees in leaf, true ortho)
# Tile grid: 1000 m, pixel 0.2 m (5000×5000 px), same grid as the BB WMS.
# Band layout in the TIFF: NIR=B1, red=B2, green=B3.
# Covers Berlin only: everything outside Berlin comes back white (NDVI 0, never
# green), also whole tiles beyond the border.
# License: dl-de/zero-2-0 (no attribution required; named anyway).

def _berlin_download(easting_m: int, northing_m: int, dest: str) -> bool:
    return _wms_download(
        "Berlin",
        os.environ.get(
            "SPACE_FINDER_CIR_BE_WMS_URL",
            "https://gdi.berlin.de/services/wms/truedop_2025_sommer",
        ),
        os.environ.get("SPACE_FINDER_CIR_BE_WMS_LAYER", "truedop_2025_sommer_cir"),
        "EPSG:25833", "image/tiff", 1000, easting_m, northing_m, dest,
        # With transparent=true the server adds an alpha band (100 instead of
        # 75 MB per tile) and cuts some tiles off mid-stream on every attempt.
        transparent=False,
    )


SOURCE_BERLIN = CirSource(
    key="berlin",
    name="Berlin TrueDOP20 CIR Sommer 2025",
    crs="EPSG:25833",
    tile_size_m=1000.0,
    pixel_size_m=0.2,
    band_nir=1,
    band_red=2,
    # Year in the name: a later flight gets its own cache files.
    cache_filename_fn=lambda e, n: f"be25_{e}_{n}.tiff",
    download_fn=_berlin_download,
    attribution="Geoportal Berlin / TrueDOP20 Sommer 2025, dl-de/zero-2-0",
    # Measured on 7 Berlin tiles: 4.7 % of roof pixels and 87 % of park/lawn
    # pixels above 0.25; 0.2 lets through 7.6 % of roofs.
    ndvi_min=0.25,
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
    return _wms_download(
        "Hessen",
        os.environ.get(
            "SPACE_FINDER_CIR_HE_WMS_URL",
            "https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-images.ows",
        ),
        os.environ.get("SPACE_FINDER_CIR_HE_WMS_LAYER", "he_dop20_cir"),
        "EPSG:25832", "image/tiff", _HESSEN_TILE_M, easting_m, northing_m, dest,
    )


SOURCE_HESSEN = CirSource(
    key="hessen",
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


# ── Coverage for "auto" ────────────────────────────────────────────────────────
#
# Rough lon/lat rectangles (west, south, east, north) per state; Berlin uses its
# simplified outline. They are approximate at the state borders: a study area
# right at a border can still get a neighbouring source, or none. Set
# `cir_source` explicitly in that case.
# Bayern and Brandenburg/Berlin use two rectangles each, so that large parts of
# Baden-Württemberg (Stuttgart) and Sachsen-Anhalt (Magdeburg) are not counted.
#
# Checked in this order; the first match wins. Hessen comes first because its
# rectangle overlaps Bayern in Unterfranken (Aschaffenburg); that keeps the
# behaviour of the earlier Hessen-first rule. Berlin comes before Brandenburg,
# whose rectangles contain it.
def _boxes(*boxes: tuple[float, float, float, float]) -> BaseGeometry:
    return unary_union([box(*b) for b in boxes])


AUTO_COVERAGE_LONLAT: tuple[tuple[CirSource, BaseGeometry], ...] = (
    # From WMS GetCapabilities, EX_GeographicBoundingBox of he_dop20_cir.
    (SOURCE_HESSEN, _boxes((7.6, 49.3, 10.3, 51.7))),
    (SOURCE_BAYERN, _boxes(
        (8.95, 49.4, 13.85, 50.6),   # Franken (north)
        (9.9, 47.25, 13.85, 49.4),   # Schwaben, Oberbayern, Niederbayern, Oberpfalz
    )),
    (SOURCE_BERLIN, Polygon(BERLIN_OUTLINE_LONLAT)),
    (SOURCE_BB, _boxes(
        (11.25, 52.6, 14.8, 53.6),   # Prignitz, Uckermark, Berlin
        (12.2, 51.35, 14.8, 52.6),   # Fläming, Lausitz
    )),
)


# ── Registry ──────────────────────────────────────────────────────────────────

KNOWN_SOURCES: dict[str, CirSource] = {
    s.key: s for s in (SOURCE_BAYERN, SOURCE_BB, SOURCE_BERLIN, SOURCE_HESSEN)
}


def resolve_source(key: str, study_area_geom: BaseGeometry) -> CirSource | None:
    """Return the CirSource for `key`.

    An explicit key ("bayern", "bb", "berlin", "hessen") always returns that
    source, wherever the study area lies.
    "auto" returns the first source in `AUTO_COVERAGE_LONLAT` whose coverage
    contains the study area centroid, or None if no source covers it
    (e.g. Köln, Hamburg). None skips the vegetation computation.
    Unknown keys also return None.
    """
    if key in KNOWN_SOURCES:
        return KNOWN_SOURCES[key]
    if key == "auto":
        try:
            c = study_area_geom.centroid
        except Exception as exc:
            print(f"   ⚠️  Auto-detection of the CIR source failed: {exc}")
            return None
        for source, coverage in AUTO_COVERAGE_LONLAT:
            if coverage.covers(c):
                return source
        print(
            f"   ℹ️  No aerial imagery (CIR) covers this area "
            f"(centroid {c.x:.3f}, {c.y:.3f}) – skipping vegetation computation"
        )
        return None
    print(f"   ⚠️  Unknown cir_source {key!r} – skipping vegetation computation")
    return None

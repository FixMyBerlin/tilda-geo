"""On-demand vegetation area detection from CIR/RGBI tiles via NDVI.

Source-agnostic: band layout, CRS and download logic come from the
CirSource object (cir_sources.py). Currently supported: Bayern DOP20 CIR
(EPSG:25832, WMS, NIR=B1), Hessen DOP20 CIR (EPSG:25832, WMS, NIR=B1) and
Brandenburg/Berlin DOP20 CIR (EPSG:25833, WMS, NIR=B1).

Processing:
  1. Project study area → source CRS
  2. Determine tiles (grid size per source; cache check / download)
  3. NDVI = (NIR – red) / (NIR + red) per tile
  4. Binary mask > NDVI_MIN + morphological closing
  5. Vectorize, simplify, drop small areas
  6. Clip to study area
"""
from __future__ import annotations

import os

import numpy as np
import geopandas as gpd
from shapely.geometry import shape, Polygon
from shapely.geometry.base import BaseGeometry

from flaechenfinder.cir_sources import CirSource

# ── Algorithm parameters ──────────────────────────────────────────────────────

NDVI_MIN = 0.1          # Threshold: above = vegetation

# Morphological closing fills gaps ≤ ITER × pixel size.
MORPH_CLOSING_ITER = 3

SIMPLIFY_TOLERANZ_M = 0.5  # Geometry simplification in meters

MIN_LOCH_M2 = 20.0      # Interior holes smaller than this are filled.
MIN_FLAECHE_M2 = 5.0    # Polygons smaller than this are dropped.

CIR_DOWNLOAD_ENABLED = os.environ.get("PLANNING_CIR_DOWNLOAD", "1") not in ("0", "false", "")

# Number of concurrent tile downloads (I/O-bound, hence threads instead of processes).
CIR_DOWNLOAD_PARALLELISM = int(os.environ.get("PLANNING_CIR_DOWNLOAD_PARALLELISM", "4"))


# ── Internal helpers ──────────────────────────────────────────────────────────

def _ndvi_array(nir: np.ndarray, rot: np.ndarray) -> np.ndarray:
    denom = nir + rot
    return np.where(denom == 0, 0.0, (nir - rot) / denom)


def _entferne_kleine_loecher(geom: Polygon) -> Polygon:
    if not geom.interiors:
        return geom
    grosse_loecher = [r for r in geom.interiors if Polygon(r).area >= MIN_LOCH_M2]
    return Polygon(geom.exterior, grosse_loecher)


def _closing(maske: np.ndarray) -> np.ndarray:
    if MORPH_CLOSING_ITER <= 0:
        return maske
    try:
        from scipy.ndimage import binary_closing
        return binary_closing(maske, iterations=MORPH_CLOSING_ITER).astype(np.uint8)
    except ImportError:
        print("   ⚠️  scipy not available – closing skipped")
        return maske


def _expected_tiles(bounds_src, tile_size_m: float) -> list[tuple[int, int]]:
    """SW corners of all tiles covering the bbox (coordinates in source CRS meters)."""
    minx, miny, maxx, maxy = bounds_src
    ts = int(tile_size_m)
    e0 = int(minx // ts) * ts
    e1 = int(maxx // ts) * ts
    n0 = int(miny // ts) * ts
    n1 = int(maxy // ts) * ts
    return [
        (e, n)
        for e in range(e0, e1 + ts, ts)
        for n in range(n0, n1 + ts, ts)
    ]


def _ensure_tile(
    easting_m: int, northing_m: int, cir_dir: str, source: CirSource
) -> str | None:
    """Return the cache path; download the tile if needed and allowed."""
    pfad = os.path.join(cir_dir, source.cache_filename_fn(easting_m, northing_m))
    if os.path.exists(pfad):
        return pfad
    if CIR_DOWNLOAD_ENABLED and source.download_fn(easting_m, northing_m, pfad):
        return pfad
    return None


def _verarbeite_kachel(
    pfad: str, band_nir: int, band_red: int, tile_transform=None
) -> list[dict]:
    """Read a tile, compute NDVI and return polygon dicts (source CRS).

    `tile_transform` overrides the georeferencing stored in the raster –
    needed for non-georeferenced formats like PNG from WMS services.
    """
    import rasterio
    from rasterio.features import shapes

    ergebnisse = []
    # rasterio.open() emits a NotGeoreferencedWarning for PNG tiles
    # (Berlin/Brandenburg WMS) because PNG – unlike the Bayern GeoTIFF – carries
    # no embedded geotransform. This is harmless: the geotransform is rebuilt
    # from the tile grid coordinates as `tile_transform` (see
    # compute_vegetation_areas) and used explicitly below.
    with rasterio.open(pfad) as src:
        nir = src.read(band_nir).astype(np.float32)
        rot = src.read(band_red).astype(np.float32)
        transform = tile_transform if tile_transform is not None else src.transform

        ndvi = _ndvi_array(nir, rot)
        maske = (ndvi > NDVI_MIN).astype(np.uint8)
        maske = _closing(maske)

        for geom_dict, wert in shapes(maske, transform=transform):
            if wert != 1:
                continue
            geom = shape(geom_dict)
            if SIMPLIFY_TOLERANZ_M > 0:
                geom = geom.simplify(SIMPLIFY_TOLERANZ_M, preserve_topology=True)
            geom = _entferne_kleine_loecher(geom)
            if geom.area < MIN_FLAECHE_M2:
                continue

            minx, miny, maxx, maxy = geom.bounds
            t = transform
            col0 = max(0, int((minx - t.c) / t.a))
            col1 = min(nir.shape[1], int((maxx - t.c) / t.a) + 1)
            row0 = max(0, int((maxy - t.f) / t.e))
            row1 = min(nir.shape[0], int((miny - t.f) / t.e) + 1)
            ndvi_patch = ndvi[row0:row1, col0:col1]
            mask_patch = maske[row0:row1, col0:col1]
            ndvi_mean = (
                float(ndvi_patch[mask_patch == 1].mean())
                if mask_patch.any()
                else float(NDVI_MIN)
            )
            ergebnisse.append({"geometry": geom, "ndvi": round(ndvi_mean, 4)})

    return ergebnisse


def _empty_veg(crs: str) -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame({"ndvi": [], "flaeche_m2": []}, geometry=[], crs=crs)


# ── Public API ────────────────────────────────────────────────────────────────

def compute_vegetation_areas(
    study_area_geom: BaseGeometry,
    source: CirSource,
    cir_dir: str | None = None,
    ndvi_min: float = NDVI_MIN,
    progress_cb=None,
) -> gpd.GeoDataFrame:
    """Compute vegetation areas on demand for the study area.

    `study_area_geom` is in EPSG:4326. `source` determines the tile source, CRS
    and band layout. Returns a GeoDataFrame in `source.crs` with the columns
    `geometry`, `ndvi`, `flaeche_m2` – clipped to the study area.

    `progress_cb(fraction: float, label: str)` is optionally called with 0.0–1.0.
    """
    global NDVI_MIN
    NDVI_MIN = ndvi_min

    cir_dir = cir_dir or os.environ.get("PLANNING_CIR_DIR", "/cir")
    os.makedirs(cir_dir, exist_ok=True)

    def _report(frac, label):
        if progress_cb:
            try:
                progress_cb(max(0.0, min(1.0, frac)), label)
            except Exception:
                pass

    study_src = (
        gpd.GeoSeries([study_area_geom], crs="EPSG:4326").to_crs(source.crs).iloc[0]
    )
    erwartet = _expected_tiles(study_src.bounds, source.tile_size_m)
    total = len(erwartet) or 1

    # ── Phase 1: provide tiles (cache / download) ────────────────────────────
    # Downloads are I/O-bound (WMS requests) and therefore run in parallel
    # threads (default: 4, see PLANNING_CIR_DOWNLOAD_PARALLELISM).
    # Stores (pfad, easting_m, northing_m) for the later geotransform computation.
    from concurrent.futures import ThreadPoolExecutor, as_completed

    kacheln_by_tile: dict[tuple[int, int], str] = {}
    with ThreadPoolExecutor(max_workers=CIR_DOWNLOAD_PARALLELISM) as pool:
        future_to_tile = {
            pool.submit(_ensure_tile, e, n, cir_dir, source): (e, n) for e, n in erwartet
        }
        for i, future in enumerate(as_completed(future_to_tile), 1):
            e, n = future_to_tile[future]
            pfad = future.result()
            if pfad:
                kacheln_by_tile[(e, n)] = pfad
            print(f"   Tiles ready {i}/{total} ({i / total * 100:.0f} %)")
            _report(0.5 * i / total, f"Luftbild-Kacheln laden {i}/{total}")

    kacheln = [(kacheln_by_tile[t], t[0], t[1]) for t in erwartet if t in kacheln_by_tile]

    if not kacheln:
        print(
            f"   ⚠️  No CIR tiles available for the area "
            f"(source: {source.name}, cache: {cir_dir!r}, "
            f"download={'on' if CIR_DOWNLOAD_ENABLED else 'off'})."
        )
        return _empty_veg(source.crs)

    # ── Phase 2: compute NDVI per tile ───────────────────────────────────────
    from affine import Affine

    print(f"   {len(kacheln)} CIR tile(s) [{source.name}] – computing NDVI …")
    alle_geom = []
    alle_ndvi = []
    nk = len(kacheln)
    for j, (pfad, e, n) in enumerate(kacheln, 1):
        # Affine transform from tile coordinates: also covers non-georeferenced PNG.
        px = source.pixel_size_m
        tile_transform = Affine(px, 0, e, 0, -px, n + source.tile_size_m)
        try:
            polys = _verarbeite_kachel(pfad, source.band_nir, source.band_red, tile_transform)
            for p in polys:
                alle_geom.append(p["geometry"])
                alle_ndvi.append(p["ndvi"])
            print(
                f"   NDVI {j}/{nk} ({j / nk * 100:.0f} %) – "
                f"{os.path.basename(pfad)}: {len(polys)} polygons"
            )
        except Exception as e:
            print(f"   ⚠️  Tile {os.path.basename(pfad)} failed: {e}")
        _report(0.5 + 0.5 * j / nk, f"NDVI berechnen {j}/{nk}")

    if not alle_geom:
        return _empty_veg(source.crs)

    gdf = gpd.GeoDataFrame({"ndvi": alle_ndvi}, geometry=alle_geom, crs=source.crs)

    try:
        gdf = gpd.clip(gdf, study_src)
        gdf = gdf[~gdf.geometry.is_empty & gdf.geometry.notna()].copy()
    except Exception as e:
        print(f"   ⚠️  Clip to study area failed: {e}")

    if not len(gdf):
        return _empty_veg(source.crs)

    gdf["flaeche_m2"] = gdf.geometry.area.round(2)
    gdf = gdf[gdf["flaeche_m2"] >= MIN_FLAECHE_M2].reset_index(drop=True)

    print(
        f"   ✓ {len(gdf)} vegetation areas "
        f"({gdf['flaeche_m2'].sum() / 10_000:.1f} ha)"
    )
    return gdf

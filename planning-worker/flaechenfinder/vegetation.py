"""On-demand Vegetationsflächen-Erkennung aus CIR/RGBI-Kacheln via NDVI.

Quellenunabhängig: Bandbelegung, CRS und Download-Logik kommen aus dem
CirSource-Objekt (cir_sources.py). Derzeit unterstützt: Bayern DOP20 CIR
(EPSG:25832, WMS, NIR=B1), Hessen DOP20 CIR (EPSG:25832, WMS, NIR=B1) und
Brandenburg/Berlin DOP20 CIR (EPSG:25833, WMS, NIR=B1).

Verarbeitung:
  1. Studiengebiet → Quell-CRS projizieren
  2. 1-km-Kacheln bestimmen (Cache-Check / Download)
  3. NDVI = (NIR – Rot) / (NIR + Rot) je Kachel
  4. Binärmaske > NDVI_MIN + morphologisches Closing
  5. Vektorisieren, vereinfachen, Kleinflächen entfernen
  6. Auf Studiengebiet clippen
"""
from __future__ import annotations

import os

import numpy as np
import geopandas as gpd
from shapely.geometry import shape, Polygon
from shapely.geometry.base import BaseGeometry

from flaechenfinder.cir_sources import CirSource

# ── Algorithmus-Parameter ─────────────────────────────────────────────────────

NDVI_MIN = 0.1          # Schwellwert: darüber = Vegetation

# Morphologisches Closing schließt Lücken ≤ ITER × Pixelgröße.
MORPH_CLOSING_ITER = 3

SIMPLIFY_TOLERANZ_M = 0.5  # Geometrie-Vereinfachung in Metern

MIN_LOCH_M2 = 20.0      # Innenlöcher kleiner als dieser Wert werden geschlossen.
MIN_FLAECHE_M2 = 5.0    # Polygone kleiner als dieser Wert werden verworfen.

CIR_DOWNLOAD_ENABLED = os.environ.get("PLANNING_CIR_DOWNLOAD", "1") not in ("0", "false", "")


# ── Interne Hilfsfunktionen ───────────────────────────────────────────────────

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
        print("   ⚠️  scipy nicht verfügbar – Closing übersprungen")
        return maske


def _expected_tiles(bounds_src, tile_size_m: float) -> list[tuple[int, int]]:
    """SW-Ecken aller 1-km-Kacheln über der bbox (Koordinaten in Quell-CRS-Metern)."""
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
    """Gibt den Cache-Pfad zurück; lädt die Kachel nach, falls nötig und erlaubt."""
    pfad = os.path.join(cir_dir, source.cache_filename_fn(easting_m, northing_m))
    if os.path.exists(pfad):
        return pfad
    if CIR_DOWNLOAD_ENABLED and source.download_fn(easting_m, northing_m, pfad):
        return pfad
    return None


def _verarbeite_kachel(
    pfad: str, band_nir: int, band_red: int, tile_transform=None
) -> list[dict]:
    """Liest eine Kachel, berechnet NDVI und gibt Polygon-Dicts (Quell-CRS) zurück.

    `tile_transform` überschreibt die im Raster gespeicherte Georeferenzierung –
    nötig für nicht-georeferenzierte Formate wie PNG aus WMS-Diensten.
    """
    import rasterio
    from rasterio.features import shapes

    ergebnisse = []
    # rasterio.open() gibt für PNG-Kacheln (Berlin/Brandenburg-WMS) eine
    # NotGeoreferencedWarning aus, weil PNG – anders als das Bayern-GeoTIFF –
    # keinen eingebetteten Geotransform trägt. Das ist harmlos: der Geotransform
    # wird aus den Kachel-Rasterkoordinaten als `tile_transform` rekonstruiert
    # (siehe compute_vegetation_areas) und unten explizit verwendet.
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


# ── Öffentliche API ───────────────────────────────────────────────────────────

def compute_vegetation_areas(
    study_area_geom: BaseGeometry,
    source: CirSource,
    cir_dir: str | None = None,
    ndvi_min: float = NDVI_MIN,
    progress_cb=None,
) -> gpd.GeoDataFrame:
    """Berechnet Vegetationsflächen on-demand für das Studiengebiet.

    `study_area_geom` ist in EPSG:4326. `source` bestimmt Kachelquelle, CRS
    und Bandbelegung. Rückgabe ist ein GeoDataFrame in `source.crs` mit den
    Spalten `geometry`, `ndvi`, `flaeche_m2` – auf das Studiengebiet geclippt.

    `progress_cb(fraction: float, label: str)` wird optional mit 0.0–1.0 aufgerufen.
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

    # ── Phase 1: Kacheln bereitstellen (Cache / Download) ────────────────────
    # Speichert (pfad, easting_m, northing_m) für die spätere Geotransform-Berechnung.
    kacheln: list[tuple[str, int, int]] = []
    for i, (e, n) in enumerate(erwartet, 1):
        pfad = _ensure_tile(e, n, cir_dir, source)
        if pfad:
            kacheln.append((pfad, e, n))
        print(f"   Kacheln bereitgestellt {i}/{total} ({i / total * 100:.0f} %)")
        _report(0.5 * i / total, f"Luftbild-Kacheln laden {i}/{total}")

    if not kacheln:
        print(
            f"   ⚠️  Keine CIR-Kacheln für das Gebiet verfügbar "
            f"(Quelle: {source.name}, Cache: {cir_dir!r}, "
            f"Download={'an' if CIR_DOWNLOAD_ENABLED else 'aus'})."
        )
        return _empty_veg(source.crs)

    # ── Phase 2: NDVI je Kachel berechnen ────────────────────────────────────
    from affine import Affine

    print(f"   {len(kacheln)} CIR-Kachel(n) [{source.name}] – NDVI-Berechnung läuft …")
    alle_geom = []
    alle_ndvi = []
    nk = len(kacheln)
    for j, (pfad, e, n) in enumerate(kacheln, 1):
        # Affine-Transform aus Kachelkoordinaten: deckt auch nicht-georef. PNG ab.
        px = source.pixel_size_m
        tile_transform = Affine(px, 0, e, 0, -px, n + source.tile_size_m)
        try:
            polys = _verarbeite_kachel(pfad, source.band_nir, source.band_red, tile_transform)
            for p in polys:
                alle_geom.append(p["geometry"])
                alle_ndvi.append(p["ndvi"])
            print(
                f"   NDVI {j}/{nk} ({j / nk * 100:.0f} %) – "
                f"{os.path.basename(pfad)}: {len(polys)} Polygone"
            )
        except Exception as e:
            print(f"   ⚠️  Kachel {os.path.basename(pfad)} fehlgeschlagen: {e}")
        _report(0.5 + 0.5 * j / nk, f"NDVI berechnen {j}/{nk}")

    if not alle_geom:
        return _empty_veg(source.crs)

    gdf = gpd.GeoDataFrame({"ndvi": alle_ndvi}, geometry=alle_geom, crs=source.crs)

    try:
        gdf = gpd.clip(gdf, study_src)
        gdf = gdf[~gdf.geometry.is_empty & gdf.geometry.notna()].copy()
    except Exception as e:
        print(f"   ⚠️  Clip auf Studiengebiet fehlgeschlagen: {e}")

    if not len(gdf):
        return _empty_veg(source.crs)

    gdf["flaeche_m2"] = gdf.geometry.area.round(2)
    gdf = gdf[gdf["flaeche_m2"] >= MIN_FLAECHE_M2].reset_index(drop=True)

    print(
        f"   ✓ {len(gdf)} Vegetationsflächen "
        f"({gdf['flaeche_m2'].sum() / 10_000:.1f} ha)"
    )
    return gdf

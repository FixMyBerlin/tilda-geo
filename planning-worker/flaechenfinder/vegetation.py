"""On-demand Vegetationsflächen-Erkennung aus CIR-DOP-Kacheln via NDVI.

Portiert aus dem Standalone-Flächenfinder (vegetationsflaechen.py), aber
bbox-getrieben: statt eines festen Verzeichnis-Globs werden nur die 1-km-Kacheln
geladen, die das Studiengebiet überdecken. Damit läuft die Berechnung pro
Planungslauf, nicht flächendeckend.

Bandbelegung der dop-cir-TIFFs (EPSG:25832, uint8):
  Band 1 = NIR  (als Rot dargestellt)
  Band 2 = Rot
  Band 3 = Grün
  Band 4 = Alpha (wird ignoriert)

NDVI = (NIR - Rot) / (NIR + Rot)

Kachelraster: 1000 m, Dateiname `{easting}_{northing}.tiff` (untere linke Ecke,
EPSG:25832, auf 1000 m abgerundet). Fehlende Kacheln werden übersprungen.
"""
from __future__ import annotations

import os
import tempfile
import urllib.parse
import urllib.request

import numpy as np
import geopandas as gpd
from shapely.geometry import shape, Polygon
from shapely.geometry.base import BaseGeometry

# ── Konfiguration (Defaults wie im Standalone) ────────────────────────────────

# NDVI reicht von -1 bis +1:
#   < 0      → Wasser, Schnee, Gebäude
#   0.0–0.2  → Boden, Asphalt, spärliche Vegetation
#   0.2–0.4  → Wiese, Buschwerk   ← NDVI_MIN greift hier
#   0.4–0.6  → Laubwald, Ackerfrucht
#   > 0.6    → dichter Wald
NDVI_MIN = 0.1

# Morphologisches Closing: schließt Lücken ≤ ITER * Pixelgröße (hier 0.2 m).
MORPH_CLOSING_ITER = 3

# Geometrie-Vereinfachung in Metern.
SIMPLIFY_TOLERANZ_M = 0.5

# Innenlöcher kleiner als dieser Schwellenwert in m² werden geschlossen.
MIN_LOCH_M2 = 20.0

# Gesamt-Polygone kleiner als dieser Wert in m² werden verworfen.
MIN_FLAECHE_M2 = 5.0

# Band-Nummern (1-basiert)
BAND_NIR = 1
BAND_ROT = 2

# Kachelraster der Bayern-DOP20-CIR-Kacheln in Metern.
TILE_SIZE_M = 1000

# Bodenauflösung der DOP20-Kacheln (0,2 m → 5000 px je 1000 m).
PIXEL_SIZE_M = 0.2

CIR_CRS = "EPSG:25832"

# Bayern-WMS zur On-demand-Abgabe der CIR-DOP20-Kacheln (nur Bayern abgedeckt).
# Layer/URL wie in der offiziellen meta4-Datei (dop20cir.meta4). Per Env
# überschreibbar; Download via PLANNING_CIR_DOWNLOAD=0 abschaltbar (dann nur Cache).
CIR_WMS_URL = os.environ.get(
    "PLANNING_CIR_WMS_URL",
    "https://geoservices.bayern.de/pro/wms/dop/v1/dop20datenabgabe",
)
CIR_WMS_LAYER = os.environ.get("PLANNING_CIR_WMS_LAYER", "by_dop20cir_bayern")
CIR_DOWNLOAD_ENABLED = os.environ.get("PLANNING_CIR_DOWNLOAD", "1") not in ("0", "false", "")
CIR_DOWNLOAD_TIMEOUT_S = int(os.environ.get("PLANNING_CIR_DOWNLOAD_TIMEOUT_S", "180"))


def _tile_wms_url(easting: int, northing: int) -> str:
    """Baut die WMS-GetMap-URL für eine 1-km-Kachel (untere linke Ecke, EPSG:25832)."""
    px = int(round(TILE_SIZE_M / PIXEL_SIZE_M))
    params = {
        "service": "wms",
        "version": "1.1.1",
        "request": "GetMap",
        "format": "image/tiff",
        "transparent": "true",
        "layers": CIR_WMS_LAYER,
        "srs": "EPSG:25832",
        "STYLES": "",
        "WIDTH": str(px),
        "HEIGHT": str(px),
        "BBOX": f"{easting},{northing},{easting + TILE_SIZE_M},{northing + TILE_SIZE_M}",
    }
    return f"{CIR_WMS_URL}?{urllib.parse.urlencode(params)}"


def _download_tile(easting: int, northing: int, ziel: str) -> bool:
    """Lädt eine Kachel vom Bayern-WMS und schreibt sie atomar nach `ziel`.

    Gibt True bei Erfolg zurück. Fehler werden geloggt und führen zu False
    (das Gebiet wird dann ohne diese Kachel verarbeitet).
    """
    url = _tile_wms_url(easting, northing)
    tmp_fd, tmp_pfad = tempfile.mkstemp(suffix=".tiff.part", dir=os.path.dirname(ziel) or ".")
    os.close(tmp_fd)
    try:
        print(f"   ↓ lade CIR-Kachel {easting}_{northing} …")
        with urllib.request.urlopen(url, timeout=CIR_DOWNLOAD_TIMEOUT_S) as resp:
            ctype = resp.headers.get("Content-Type", "")
            if "tiff" not in ctype:
                raise ValueError(f"unerwarteter Content-Type {ctype!r}")
            with open(tmp_pfad, "wb") as f:
                while True:
                    chunk = resp.read(1024 * 1024)
                    if not chunk:
                        break
                    f.write(chunk)
        if os.path.getsize(tmp_pfad) == 0:
            raise ValueError("leere Antwort")
        os.replace(tmp_pfad, ziel)
        return True
    except Exception as e:
        print(f"   ⚠️  Download {easting}_{northing} fehlgeschlagen: {e}")
        if os.path.exists(tmp_pfad):
            try:
                os.remove(tmp_pfad)
            except OSError:
                pass
        return False


def _ndvi_array(nir: np.ndarray, rot: np.ndarray) -> np.ndarray:
    denom = nir + rot
    return np.where(denom == 0, 0.0, (nir - rot) / denom)


def _entferne_kleine_loecher(geom: Polygon) -> Polygon:
    """Entfernt Innenlöcher (Nicht-Vegetations-Inseln) unter MIN_LOCH_M2."""
    if not geom.interiors:
        return geom
    grosse_loecher = [r for r in geom.interiors if Polygon(r).area >= MIN_LOCH_M2]
    return Polygon(geom.exterior, grosse_loecher)


def _expected_tiles(bounds_25832) -> list[tuple[int, int]]:
    """Gitterkoordinaten (untere linke Ecke) aller 1-km-Kacheln über der bbox."""
    minx, miny, maxx, maxy = bounds_25832
    e0 = int(minx // TILE_SIZE_M) * TILE_SIZE_M
    e1 = int(maxx // TILE_SIZE_M) * TILE_SIZE_M
    n0 = int(miny // TILE_SIZE_M) * TILE_SIZE_M
    n1 = int(maxy // TILE_SIZE_M) * TILE_SIZE_M
    return [
        (e, n)
        for e in range(e0, e1 + TILE_SIZE_M, TILE_SIZE_M)
        for n in range(n0, n1 + TILE_SIZE_M, TILE_SIZE_M)
    ]


def _ensure_tile(easting: int, northing: int, cir_dir: str) -> str | None:
    """Pfad einer Kachel; nutzt Cache oder lädt sie (falls aktiviert) nach."""
    pfad = os.path.join(cir_dir, f"{easting}_{northing}.tiff")
    if os.path.exists(pfad):
        return pfad
    if CIR_DOWNLOAD_ENABLED and _download_tile(easting, northing, pfad):
        return pfad
    return None


def tiles_for_bbox(bounds_25832, cir_dir: str) -> list[str]:
    """Liefert vorhandene/nachgeladene CIR-Kachelpfade, die die bbox überdecken."""
    os.makedirs(cir_dir, exist_ok=True)
    pfade = [_ensure_tile(e, n, cir_dir) for e, n in _expected_tiles(bounds_25832)]
    return [p for p in pfade if p]


def _closing(maske: np.ndarray) -> np.ndarray:
    """Morphologisches Closing; nutzt scipy falls verfügbar, sonst unverändert."""
    if MORPH_CLOSING_ITER <= 0:
        return maske
    try:
        from scipy.ndimage import binary_closing
        return binary_closing(maske, iterations=MORPH_CLOSING_ITER).astype(np.uint8)
    except ImportError:
        print("   ⚠️  scipy nicht verfügbar – Closing übersprungen")
        return maske


def _verarbeite_kachel(pfad: str) -> list[dict]:
    """Liest eine Kachel, berechnet NDVI und gibt Polygon-Dicts (EPSG:25832) zurück."""
    import rasterio
    from rasterio.features import shapes

    ergebnisse = []
    with rasterio.open(pfad) as src:
        nir = src.read(BAND_NIR).astype(np.float32)
        rot = src.read(BAND_ROT).astype(np.float32)
        transform = src.transform

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

            # Mittleren NDVI über die Pixel der Bounding-Box berechnen.
            minx, miny, maxx, maxy = geom.bounds
            t = transform
            col0 = max(0, int((minx - t.c) / t.a))
            col1 = min(nir.shape[1], int((maxx - t.c) / t.a) + 1)
            # t.e ist negativ (y nimmt nach unten ab), daher maxy → kleine Zeile
            row0 = max(0, int((maxy - t.f) / t.e))
            row1 = min(nir.shape[0], int((miny - t.f) / t.e) + 1)

            ndvi_patch = ndvi[row0:row1, col0:col1]
            mask_patch = maske[row0:row1, col0:col1]
            ndvi_mean = float(ndvi_patch[mask_patch == 1].mean()) if mask_patch.any() else float(NDVI_MIN)

            ergebnisse.append({"geometry": geom, "ndvi": round(ndvi_mean, 4)})

    return ergebnisse


def _empty_veg() -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame({"ndvi": [], "flaeche_m2": []}, geometry=[], crs=CIR_CRS)


def compute_vegetation_areas(
    study_area_geom: BaseGeometry,
    cir_dir: str | None = None,
    ndvi_min: float = NDVI_MIN,
    progress_cb=None,
) -> gpd.GeoDataFrame:
    """Berechnet Vegetationsflächen on-demand für das Studiengebiet.

    `study_area_geom` ist in EPSG:4326. Rückgabe ist ein GeoDataFrame in
    EPSG:25832 mit den Spalten `geometry`, `ndvi`, `flaeche_m2` – auf das
    Studiengebiet geclippt. Fehlen CIR-Kacheln, ist das Ergebnis leer.

    `progress_cb(fraction: float, label: str)` wird – falls gesetzt – mit dem
    Fortschritt 0.0–1.0 aufgerufen (Download- + Verarbeitungsphase).
    """
    global NDVI_MIN  # erlaubt Override des Schwellwerts pro Lauf
    NDVI_MIN = ndvi_min

    cir_dir = cir_dir or os.environ.get("PLANNING_CIR_DIR", "/cir")
    os.makedirs(cir_dir, exist_ok=True)

    def _report(frac, label):
        if progress_cb:
            try:
                progress_cb(max(0.0, min(1.0, frac)), label)
            except Exception:
                pass

    # Studiengebiet nach EPSG:25832 projizieren, um die Kacheln zu bestimmen.
    study_25832 = (
        gpd.GeoSeries([study_area_geom], crs="EPSG:4326").to_crs(CIR_CRS).iloc[0]
    )
    erwartet = _expected_tiles(study_25832.bounds)
    total = len(erwartet) or 1

    # ── Phase 1: Kacheln bereitstellen (Cache/Download) – erste Hälfte ──────
    kacheln: list[str] = []
    for i, (e, n) in enumerate(erwartet, 1):
        pfad = _ensure_tile(e, n, cir_dir)
        if pfad:
            kacheln.append(pfad)
        print(f"   Kacheln bereitgestellt {i}/{total} ({i / total * 100:.0f} %)")
        _report(0.5 * i / total, f"Luftbild-Kacheln laden {i}/{total}")

    if not kacheln:
        print(
            f"   ⚠️  Keine CIR-Kacheln für das Gebiet verfügbar "
            f"(Cache {cir_dir!r}, Download={'an' if CIR_DOWNLOAD_ENABLED else 'aus'})."
        )
        return _empty_veg()

    # ── Phase 2: NDVI je Kachel berechnen – zweite Hälfte ──────────────────
    print(f"   {len(kacheln)} CIR-Kachel(n) – NDVI-Berechnung läuft …")
    alle_geom = []
    alle_ndvi = []
    nk = len(kacheln)
    for j, pfad in enumerate(kacheln, 1):
        try:
            polys = _verarbeite_kachel(pfad)
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
        return _empty_veg()

    gdf = gpd.GeoDataFrame({"ndvi": alle_ndvi}, geometry=alle_geom, crs=CIR_CRS)

    # Auf das Studiengebiet clippen, damit keine Polygone über die Boundary ragen.
    try:
        gdf = gpd.clip(gdf, study_25832)
        gdf = gdf[~gdf.geometry.is_empty & gdf.geometry.notna()].copy()
    except Exception as e:
        print(f"   ⚠️  Clip auf Studiengebiet fehlgeschlagen: {e}")

    if not len(gdf):
        return _empty_veg()

    gdf["flaeche_m2"] = gdf.geometry.area.round(2)
    gdf = gdf[gdf["flaeche_m2"] >= MIN_FLAECHE_M2].reset_index(drop=True)

    print(
        f"   ✓ {len(gdf)} Vegetationsflächen "
        f"({gdf['flaeche_m2'].sum() / 10_000:.1f} ha)"
    )
    return gdf

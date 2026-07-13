"""CIR/RGBI-Kachelquellen für die Vegetationsberechnung.

Jede Quelle beschreibt, wie Kacheln gecacht, heruntergeladen und gelesen werden.
Neue Quellen lassen sich durch ein weiteres `CirSource`-Objekt in `KNOWN_SOURCES`
ergänzen – Änderungen an vegetation.py sind dafür nicht nötig.
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
    """Konfiguration einer CIR/RGBI-Kachelquelle."""
    name: str
    crs: str             # EPSG-Code des Kachel-Koordinatensystems
    tile_size_m: float   # Kachel-Kantenlänge in Metern
    pixel_size_m: float  # Bodenauflösung in Metern
    band_nir: int        # 1-basierter Band-Index für NIR
    band_red: int        # 1-basierter Band-Index für Rot
    # (easting_m, northing_m) → lokaler Cache-Dateiname (ohne Verzeichnis)
    cache_filename_fn: Callable[[int, int], str]
    # (easting_m, northing_m, dest_pfad) → True bei Erfolg
    download_fn: Callable[[int, int, str], bool]
    # Pflicht-Quellenangabe gemäß Lizenz (für MapLibre AttributionControl)
    attribution: str


# ── Hilfsfunktion ─────────────────────────────────────────────────────────────

def _timeout_s() -> int:
    return int(os.environ.get("PLANNING_CIR_DOWNLOAD_TIMEOUT_S", "180"))


# ── Bayern DOP20 CIR (WMS, EPSG:25832, NIR=B1, Rot=B2) ──────────────────────

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
        print(f"   ↓ lade CIR-Kachel {easting_m}_{northing_m} …")
        with urllib.request.urlopen(url, timeout=_timeout_s()) as resp:
            ctype = resp.headers.get("Content-Type", "")
            if "tiff" not in ctype:
                raise ValueError(f"unerwarteter Content-Type {ctype!r}")
            with open(tmp_path, "wb") as f:
                while chunk := resp.read(1024 * 1024):
                    f.write(chunk)
        if os.path.getsize(tmp_path) == 0:
            raise ValueError("leere Antwort")
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


# ── Brandenburg/Berlin DOP20 CIR (WMS, EPSG:25833, NIR=B1, Rot=B2) ────────────
#
# WMS: https://isk.geobasis-bb.de/mapproxy/dop20cir/service/wms
# Layer: bb_dop20cir  (CIR-only, kein RGBI-Volldownload nötig)
# Kachelraster: 1000 m, Pixel 0,2 m (5000×5000 px).
# Bandbelegung im TIFF: NIR=B1, Rot=B2, Grün=B3.
# Lizenz: dl-de/by-2-0, Namensnennung: "© GeoBasis-DE/LGB, dl-de/by-2-0"

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
        print(f"   ↓ lade CIR-Kachel BB {easting_m}_{northing_m} …")
        with urllib.request.urlopen(url, timeout=_timeout_s()) as resp:
            ctype = resp.headers.get("Content-Type", "")
            if "png" not in ctype:
                raise ValueError(f"unerwarteter Content-Type {ctype!r}")
            with open(tmp_path, "wb") as f:
                while chunk := resp.read(1024 * 1024):
                    f.write(chunk)
        if os.path.getsize(tmp_path) == 0:
            raise ValueError("leere Antwort")
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


# ── Hessen DOP20 CIR (WMS, EPSG:25832, NIR=B1, Rot=B2) ───────────────────────
#
# WMS: https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-images.ows
# Layer: he_dop20_cir  (DOP20 CIR-False-Color, 0,2 m, kostenfrei/OGC-„free-images")
# Kachelraster: 1000 m, Pixel 0,2 m (5000×5000 px).
# Bandbelegung im TIFF: False-Color-RGB(+Alpha) → NIR=B1 (Rot-Kanal),
#   Rot=B2 (Grün-Kanal), Grün=B3; das Alpha-Band (B4) bleibt ungenutzt.
# Wie Bayern liegt Hessen in EPSG:25832 (UTM32) und liefert GeoTIFF.
# Lizenz: dl-de/zero-2-0 (freie Geodaten der HVBG).

def _hessen_download(easting_m: int, northing_m: int, dest: str) -> bool:
    wms_url = os.environ.get(
        "PLANNING_CIR_HE_WMS_URL",
        "https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-images.ows",
    )
    layer = os.environ.get("PLANNING_CIR_HE_WMS_LAYER", "he_dop20_cir")
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
        print(f"   ↓ lade CIR-Kachel HE {easting_m}_{northing_m} …")
        with urllib.request.urlopen(url, timeout=_timeout_s()) as resp:
            ctype = resp.headers.get("Content-Type", "")
            if "tiff" not in ctype:
                raise ValueError(f"unerwarteter Content-Type {ctype!r}")
            with open(tmp_path, "wb") as f:
                while chunk := resp.read(1024 * 1024):
                    f.write(chunk)
        if os.path.getsize(tmp_path) == 0:
            raise ValueError("leere Antwort")
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
    tile_size_m=1000.0,
    pixel_size_m=0.2,
    band_nir=1,
    band_red=2,
    cache_filename_fn=lambda e, n: f"he_{e}_{n}.tiff",
    download_fn=_hessen_download,
    attribution="© Hessische Verwaltung für Bodenmanagement und Geoinformation (HVBG), dl-de/zero-2-0",
)


# Ungefähre geografische Bounding-Box Hessens (aus dem WMS-GetCapabilities,
# EX_GeographicBoundingBox von he_dop20_cir) für die „auto"-Erkennung.
_HESSEN_BBOX_LONLAT = (7.6, 49.3, 10.3, 51.7)  # (west, süd, ost, nord)


# ── Registry ──────────────────────────────────────────────────────────────────

KNOWN_SOURCES: dict[str, CirSource] = {
    "bayern": SOURCE_BAYERN,
    "bb": SOURCE_BB,
    "hessen": SOURCE_HESSEN,
}


def resolve_source(key: str, study_area_geom: BaseGeometry) -> CirSource | None:
    """Gibt die CirSource für `key` zurück.

    „auto" erkennt anhand des Studiengebiet-Zentroiden:
      1. innerhalb der Hessen-Bounding-Box → Hessen (EPSG:25832, WMS)
      2. sonst < 12°E → Bayern (EPSG:25832); ≥ 12°E → Brandenburg/Berlin (EPSG:25833).
    Die Hessen-Box überlappt am Rand mit Bayern (Unterfranken); im Zweifel die
    Quelle explizit über `cir_source` setzen statt „auto".
    Unbekannte Schlüssel geben None zurück (Vegetationsberechnung wird übersprungen).
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
            print(f"   ⚠️  Auto-Erkennung der CIR-Quelle fehlgeschlagen: {exc}")
            return None
    print(f"   ⚠️  Unbekannte cir_source {key!r} – Vegetationsberechnung übersprungen")
    return None

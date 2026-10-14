import numpy as np
from typing import List, Tuple, Optional


class DEMAdapter:
    """
    Liefert Hangneigungen (°) für eine Liste von (lng, lat)-Punkten.

    Quellen (Priorität):
      1. dgm1   – DGM1 GeoTIFF via rasterio + np.gradient (Volume `planning_dem`)
      2. mapterhorn – PMTiles-Extrakt (Terrarium-Encoding) – Stub
      3. srtm   – konstanter Fallback (MVP ohne echtes DEM)
    """

    def __init__(self, source: str = "srtm", dgm1_path: Optional[str] = None):
        self.source = source
        self.dgm1_path = dgm1_path
        self._dgm1_ds = None
        self._mapterhorn_tile_cache: dict = {}

    def __del__(self):
        if self._dgm1_ds is not None:
            try:
                self._dgm1_ds.close()
            except Exception:
                pass

    def get_slopes(self, points: List[Tuple[float, float]]) -> List[float]:
        """Gibt Hangneigungen in Grad für [(lng, lat), ...] zurück."""
        if self.source == "dgm1" and self.dgm1_path:
            return self._slopes_from_dgm1(points)
        elif self.source == "mapterhorn":
            return self._slopes_from_mapterhorn(points)
        else:
            return self._slopes_srtm_fallback(points)

    def _slopes_from_dgm1(self, points):
        try:
            import rasterio
            from pyproj import Transformer

            if self._dgm1_ds is None:
                self._dgm1_ds = rasterio.open(self.dgm1_path)

            ds = self._dgm1_ds
            transformer = Transformer.from_crs("EPSG:4326", ds.crs.to_epsg(), always_xy=True)
            res_x = abs(ds.transform.a)
            res_y = abs(ds.transform.e)
            slopes = []

            for lng, lat in points:
                x, y = transformer.transform(lng, lat)
                row, col = ds.index(x, y)
                window = rasterio.windows.Window(col - 1, row - 1, 3, 3)
                try:
                    patch = ds.read(1, window=window).astype(float)
                    if patch.shape != (3, 3) or np.any(patch == ds.nodata):
                        slopes.append(0.0)
                        continue
                    dz_dx = (patch[1, 2] - patch[1, 0]) / (2 * res_x)
                    dz_dy = (patch[0, 1] - patch[2, 1]) / (2 * res_y)
                    slope_rad = np.arctan(np.sqrt(dz_dx**2 + dz_dy**2))
                    slopes.append(float(np.degrees(slope_rad)))
                except Exception:
                    slopes.append(0.0)

            return slopes

        except ImportError:
            print("   ⚠️  rasterio nicht verfügbar – Fallback auf SRTM")
            return self._slopes_srtm_fallback(points)

    # Gleiche Kachelquelle/-schema wie das Höhenprofil im Frontend
    # (app/.../terrainProfile/sampling/{terrarium,terrainSampler}.ts): Terrarium-
    # kodierte WebP-Kacheln von tiles.mapterhorn.com, weltweit, ~30m-Basisauflösung
    # (Copernicus GLO-30). Zoom 13 @ 512px ergibt ~6m/Pixel bei mittleren Breiten –
    # für die Score-Klassifizierung ausreichend, nicht baugenau.
    _MAPTERHORN_ZOOM = 13
    _MAPTERHORN_TILE_SIZE = 512
    _MAPTERHORN_TILES_ORIGIN = "https://tiles.mapterhorn.com"

    @classmethod
    def _mapterhorn_tile_pixel(cls, lng, lat, zoom, tile_size):
        import math

        lat_rad = math.radians(lat)
        scale = 2 ** zoom
        x = (lng + 180.0) / 360.0 * scale
        y = (1 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2 * scale
        tile_x = int(math.floor(x))
        tile_y = int(math.floor(y))
        px = min(tile_size - 1, max(0, (x - tile_x) * tile_size))
        py = min(tile_size - 1, max(0, (y - tile_y) * tile_size))
        return tile_x, tile_y, px, py

    def _load_mapterhorn_tile(self, tile_x, tile_y):
        """Lädt+decodiert eine Mapterhorn-Kachel zu einem Höhen-Array (Meter).
        Pro DEMAdapter-Instanz gecacht (ein Lauf trifft meist wenige Kacheln
        mehrfach), analog zum Tile-Cache im Frontend."""
        key = (tile_x, tile_y)
        if key in self._mapterhorn_tile_cache:
            return self._mapterhorn_tile_cache[key]

        import io
        import urllib.request
        from PIL import Image

        url = f"{self._MAPTERHORN_TILES_ORIGIN}/{self._MAPTERHORN_ZOOM}/{tile_x}/{tile_y}.webp"
        # Ohne User-Agent blockt der CDN mit 403 (Standard-urllib-UA wird gefiltert).
        req = urllib.request.Request(url, headers={"User-Agent": "tilda-geo-planning-worker"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
            img = Image.open(io.BytesIO(data)).convert("RGB")
            rgb = np.asarray(img, dtype=np.float64)
            elevation = rgb[:, :, 0] * 256 + rgb[:, :, 1] + rgb[:, :, 2] / 256 - 32768
        except Exception as exc:
            print(f"   ⚠️  Mapterhorn-Kachel {self._MAPTERHORN_ZOOM}/{tile_x}/{tile_y} nicht ladbar: {exc}")
            elevation = None

        self._mapterhorn_tile_cache[key] = elevation
        return elevation

    def _slopes_from_mapterhorn(self, points):
        import math

        try:
            from PIL import Image  # noqa: F401 – nur Verfügbarkeit prüfen
        except ImportError:
            print("   ⚠️  Pillow nicht verfügbar – Fallback auf SRTM")
            return self._slopes_srtm_fallback(points)

        tile_size = self._MAPTERHORN_TILE_SIZE
        zoom = self._MAPTERHORN_ZOOM
        # WebMercator-Pixelauflösung (m/px) bei gegebener Breite/Zoom, für 256px-
        # Kachelschema; auf die tatsächliche Kachelgröße skaliert.
        equator_res = 156543.03392804097

        slopes = []
        for lng, lat in points:
            tile_x, tile_y, px, py = self._mapterhorn_tile_pixel(lng, lat, zoom, tile_size)
            elevation = self._load_mapterhorn_tile(tile_x, tile_y)
            if elevation is None:
                slopes.append(0.0)
                continue

            x0 = min(tile_size - 1, max(0, round(px)))
            y0 = min(tile_size - 1, max(0, round(py)))
            x_minus, x_plus = max(0, x0 - 1), min(tile_size - 1, x0 + 1)
            y_minus, y_plus = max(0, y0 - 1), min(tile_size - 1, y0 + 1)
            if x_minus == x_plus or y_minus == y_plus:
                # Punkt liegt auf einer Kachelecke ohne beidseitigen Nachbarn
                slopes.append(0.0)
                continue

            res_m = equator_res * math.cos(math.radians(lat)) / (2 ** zoom) * (256 / tile_size)
            dz_dx = (elevation[y0, x_plus] - elevation[y0, x_minus]) / ((x_plus - x_minus) * res_m)
            dz_dy = (elevation[y_minus, x0] - elevation[y_plus, x0]) / ((y_plus - y_minus) * res_m)
            slope_rad = math.atan(math.hypot(dz_dx, dz_dy))
            slopes.append(float(math.degrees(slope_rad)))

        return slopes

    def _slopes_srtm_fallback(self, points):
        """
        MVP-Fallback: konstante Hangneigung 2.0° für alle Punkte. Der Slope-Faktor
        kann über `w_slope=0` im factorConfig faktisch deaktiviert werden. Echte
        DGM1-Raster werden später über das `planning_dem`-Volume nachgerüstet.
        """
        print("   ℹ️  DEM-Fallback aktiv: konstante Hangneigung 2.0°")
        return [2.0] * len(points)

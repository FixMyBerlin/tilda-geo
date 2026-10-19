import numpy as np
from typing import List, Tuple, Optional


class DEMAdapter:
    """
    Returns slopes (°) for a list of (lng, lat) points.

    Sources (priority):
      1. dgm1   – DGM1 GeoTIFF via rasterio + np.gradient (volume `planning_dem`)
      2. mapterhorn – PMTiles extract (Terrarium encoding) – stub
      3. srtm   – constant fallback (MVP without a real DEM)
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
        """Return slopes in degrees for [(lng, lat), ...]."""
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
            print("   ⚠️  rasterio not available – falling back to SRTM")
            return self._slopes_srtm_fallback(points)

    # Same tile source/scheme as the elevation profile in the frontend
    # (app/.../terrainProfile/sampling/{terrarium,terrainSampler}.ts): Terrarium-
    # encoded WebP tiles from tiles.mapterhorn.com, worldwide, ~30m base resolution
    # (Copernicus GLO-30). Zoom 13 @ 512px gives ~6m/pixel at mid latitudes –
    # sufficient for score classification, not construction-grade.
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
        """Load + decode a Mapterhorn tile into an elevation array (meters).
        Cached per DEMAdapter instance (a run usually hits a few tiles
        repeatedly), like the tile cache in the frontend."""
        key = (tile_x, tile_y)
        if key in self._mapterhorn_tile_cache:
            return self._mapterhorn_tile_cache[key]

        import io
        import urllib.request
        from PIL import Image

        url = f"{self._MAPTERHORN_TILES_ORIGIN}/{self._MAPTERHORN_ZOOM}/{tile_x}/{tile_y}.webp"
        # Without a User-Agent the CDN blocks with 403 (default urllib UA is filtered).
        req = urllib.request.Request(url, headers={"User-Agent": "tilda-geo-planning-worker"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
            img = Image.open(io.BytesIO(data)).convert("RGB")
            rgb = np.asarray(img, dtype=np.float64)
            elevation = rgb[:, :, 0] * 256 + rgb[:, :, 1] + rgb[:, :, 2] / 256 - 32768
        except Exception as exc:
            print(f"   ⚠️  Mapterhorn tile {self._MAPTERHORN_ZOOM}/{tile_x}/{tile_y} could not be loaded: {exc}")
            elevation = None

        self._mapterhorn_tile_cache[key] = elevation
        return elevation

    def _slopes_from_mapterhorn(self, points):
        import math

        try:
            from PIL import Image  # noqa: F401 – availability check only
        except ImportError:
            print("   ⚠️  Pillow not available – falling back to SRTM")
            return self._slopes_srtm_fallback(points)

        tile_size = self._MAPTERHORN_TILE_SIZE
        zoom = self._MAPTERHORN_ZOOM
        # Web Mercator pixel resolution (m/px) at the given latitude/zoom for the 256px
        # tile scheme; scaled to the actual tile size.
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
                # Point lies on a tile corner without neighbors on both sides
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
        MVP fallback: constant slope of 2.0° for all points. The slope factor
        can effectively be disabled via `w_slope=0` in factorConfig. Real
        DGM1 rasters are added later via the `planning_dem` volume.
        """
        print("   ℹ️  DEM fallback active: constant slope 2.0°")
        return [2.0] * len(points)

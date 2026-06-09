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

    def _slopes_from_mapterhorn(self, points):
        print("   ⚠️  Mapterhorn/PMTiles noch nicht implementiert – nutze SRTM-Fallback")
        return self._slopes_srtm_fallback(points)

    def _slopes_srtm_fallback(self, points):
        """
        MVP-Fallback: konstante Hangneigung 2.0° für alle Punkte. Der Slope-Faktor
        kann über `w_slope=0` im factorConfig faktisch deaktiviert werden. Echte
        DGM1-Raster werden später über das `planning_dem`-Volume nachgerüstet.
        """
        print("   ℹ️  DEM-Fallback aktiv: konstante Hangneigung 2.0°")
        return [2.0] * len(points)

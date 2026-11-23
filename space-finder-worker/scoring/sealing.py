"""Sealed ground share per hexagon ("Versiegelung").

Input is `public._sealing_surfaces` (processing topic `sealing`), one row per OSM
object with a `sealing_group`:

  A     sealed surface tag (asphalt, paving stones, …)            → counts fully
  A2    `surface=grass_paver`                                      → counts half
  B     area type that is almost always paved (square, pedestrian
        area, parking lot, footway/cycleway line without surface) → counts fully
  D     unsealed surface or open ground / green area tag          → deduction
  tree  `natural=tree` (point)                                     → tree pit

Precedence (an object's own `surface` decides, otherwise the smaller area wins):
  - A/A2/B polygon  minus D polygons that are smaller than it, minus all D lines
  - A/A2 line       nothing (its explicit surface wins over the area around it)
  - B line          minus the D polygons it lies mostly inside (> 50 % of its
                    area; a footway without surface inside a park is most likely
                    unpaved like the park), minus all D lines. A park or verge that
                    only touches a sidewalk does not remove it.
  - carriageway     nothing (a road through a park is still a road)

Per hexagon, then:

  U         = union of the full pieces (A, B, sealed carriageway)
  U2        = union of the half pieces (A2) minus U
  deduction = tree pits ∪ excluded carriageway
  share     = (area(U − deduction) + ½ · area(U2 − deduction)) / hexagon area

The green of the aerial image is not used: over a mapped surface it is almost
always a tree crown above paving, and it would make the result depend on the
image quality (leaf-off spring images in Berlin).

Everything works in EPSG:25832 (metres). The functions are pure so they can be
tested with synthetic geometries (test_sealing_share.py).
"""

from __future__ import annotations

import geopandas as gpd
import numpy as np
import pandas as pd
import shapely

METRIC_CRS = "EPSG:25832"

SEALING_GROUPS = ("A", "A2", "B", "D", "tree")

# Fallback when processing did not set a width (it normally does).
DEFAULT_LINE_WIDTH_M = 2.5
# A sidewalk tagged on a road is a duplicate when its axis runs this close to a
# separately mapped footway/cycleway/path.
SIDEWALK_DUPLICATE_DISTANCE_M = 4.0

# A B line (footway without surface) only counts as unpaved when more than this
# share of it lies inside a D polygon (park, green verge, cemetery, …).
B_LINE_INSIDE_SHARE = 0.5

# Radius of the unsealed tree pit around a mapped tree trunk.
TREE_PIT_RADIUS_M = 1.5

_POLYGON_TYPES = ("Polygon", "MultiPolygon")
_LINE_TYPES = ("LineString", "MultiLineString")


def _empty(crs: str = METRIC_CRS) -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame(geometry=[], crs=crs)


def _to_metric(gdf: gpd.GeoDataFrame | None) -> gpd.GeoDataFrame:
    if gdf is None or not len(gdf):
        return _empty()
    gdf = gdf[gdf.geometry.notna() & ~gdf.geometry.is_empty]
    if gdf.crs is not None and gdf.crs != METRIC_CRS:
        gdf = gdf.to_crs(METRIC_CRS)
    return gdf.rename_geometry("geometry") if gdf.geometry.name != "geometry" else gdf


def _areal(geoms):
    """Keeps only the areal part of overlay results (and repairs them).

    Differences and unions of touching polygons can leave degenerate line or
    point parts inside a GeometryCollection; GEOS then fails on the next overlay
    ("Unable to determine overlay result geometry dimension"). buffer(0) drops
    those parts and returns plain (Multi)Polygons.
    """
    return shapely.buffer(geoms, 0)


def _diff(a, b):
    return _areal(shapely.difference(_areal(a), _areal(b)))


def _union(a, b):
    return _areal(shapely.union(_areal(a), _areal(b)))


def _valid(geoms: np.ndarray) -> np.ndarray:
    """Repairs invalid polygons (self-intersections from OSM) so overlays don't fail."""
    bad = ~shapely.is_valid(geoms)
    if bad.any():
        geoms = geoms.copy()
        geoms[bad] = shapely.make_valid(geoms[bad])
    return geoms


def _drop_duplicate_road_sidewalks(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Drops sidewalks tagged on a road when the same sidewalk is also mapped as
    its own way (road still says `sidewalk=both` instead of `separate`).

    A tagged sidewalk counts as a duplicate when more than half of its shifted
    axis lies within SIDEWALK_DUPLICATE_DISTANCE_M of a separate footway,
    cycleway or path line.
    """
    if "offset_m" not in gdf or "highway" not in gdf:
        return gdf
    offset = pd.to_numeric(gdf["offset_m"], errors="coerce").to_numpy(dtype=float)
    is_line = gdf.geometry.geom_type.isin(_LINE_TYPES).to_numpy()
    tagged = is_line & np.isfinite(offset) & (offset != 0)
    separate = is_line & ~tagged & gdf["highway"].isin(("footway", "cycleway", "path")).to_numpy()
    if not tagged.any() or not separate.any():
        return gdf
    axes = shapely.offset_curve(gdf.geometry.to_numpy()[tagged], offset[tagged])
    tagged_gdf = gpd.GeoDataFrame({"_row": np.flatnonzero(tagged)}, geometry=axes, crs=gdf.crs)
    near = gpd.GeoDataFrame(
        geometry=shapely.buffer(gdf.geometry.to_numpy()[separate], SIDEWALK_DUPLICATE_DISTANCE_M),
        crs=gdf.crs,
    )
    pairs = gpd.sjoin(tagged_gdf, near, how="inner", predicate="intersects")
    if not len(pairs):
        return gdf
    near_union = pairs.groupby("_row")["index_right"].agg(
        lambda idx: shapely.union_all(near.geometry.to_numpy()[idx.to_numpy()])
    )
    axis_by_row = dict(zip(tagged_gdf["_row"], tagged_gdf.geometry))
    duplicate = [
        row for row, zone in near_union.items()
        if shapely.length(shapely.intersection(axis_by_row[row], zone))
        > 0.5 * shapely.length(axis_by_row[row])
    ]
    if duplicate:
        print(f"   ℹ️  {len(duplicate)} road-tagged sidewalks dropped (also mapped as own way)")
    return gdf.drop(gdf.index[duplicate]).reset_index(drop=True)


def prepare_surfaces(surfaces: gpd.GeoDataFrame | None) -> dict[str, gpd.GeoDataFrame]:
    """Splits the raw table rows into buffered layers (all EPSG:25832, polygons).

    Returns a dict with the keys `full`, `half`, `pits`. `full` and `half`
    already have the D deductions of their own precedence applied.
    """
    gdf = _to_metric(surfaces)
    if not len(gdf):
        return {k: _empty() for k in ("full", "half", "pits")}
    gdf = _drop_duplicate_road_sidewalks(gdf.reset_index(drop=True))

    gtype = gdf.geometry.geom_type
    is_poly = gtype.isin(_POLYGON_TYPES).to_numpy()
    is_line = gtype.isin(_LINE_TYPES).to_numpy()
    is_point = (gtype == "Point").to_numpy()
    group = gdf["sealing_group"].to_numpy()

    width = pd.to_numeric(gdf.get("width_m"), errors="coerce").to_numpy(dtype=float) if "width_m" in gdf else np.full(len(gdf), np.nan)
    width = np.where(np.isfinite(width) & (width > 0), width, DEFAULT_LINE_WIDTH_M)

    geoms = gdf.geometry.to_numpy()
    # Sidewalks tagged on a road come as the road line plus `offset_m` (> 0 left):
    # shift them next to the carriageway before buffering.
    offset = pd.to_numeric(gdf.get("offset_m"), errors="coerce").to_numpy(dtype=float) if "offset_m" in gdf else np.full(len(gdf), np.nan)
    shifted = is_line & np.isfinite(offset) & (offset != 0)
    if shifted.any():
        geoms = geoms.copy()
        geoms[shifted] = shapely.offset_curve(geoms[shifted], offset[shifted])
    shapes = geoms.copy()
    shapes[is_line] = shapely.buffer(geoms[is_line], width[is_line] / 2.0, cap_style="flat")
    shapes[is_poly] = _valid(geoms[is_poly])

    def layer(mask: np.ndarray) -> gpd.GeoDataFrame:
        return gpd.GeoDataFrame(geometry=shapes[mask], crs=METRIC_CRS).reset_index(drop=True)

    pits = gpd.GeoDataFrame(
        geometry=shapely.buffer(geoms[(group == "tree") & is_point], TREE_PIT_RADIUS_M),
        crs=METRIC_CRS,
    )

    d_poly = layer((group == "D") & is_poly)
    d_line = layer((group == "D") & is_line)

    positive = (np.isin(group, ("A", "A2", "B"))) & (is_poly | is_line)
    pos = gpd.GeoDataFrame(
        {
            "sealing_group": group[positive],
            "is_line": is_line[positive],
        },
        geometry=shapes[positive],
        crs=METRIC_CRS,
    ).reset_index(drop=True)
    pos = _apply_d_precedence(pos, d_poly, d_line)

    full = pos[pos["sealing_group"].isin(("A", "B"))][["geometry"]].reset_index(drop=True)
    half = pos[pos["sealing_group"] == "A2"][["geometry"]].reset_index(drop=True)
    return {"full": full, "half": half, "pits": pits}


def _apply_d_precedence(
    pos: gpd.GeoDataFrame, d_poly: gpd.GeoDataFrame, d_line: gpd.GeoDataFrame
) -> gpd.GeoDataFrame:
    """Subtracts the D pieces that beat each positive piece (see module docstring)."""
    if not len(pos) or (not len(d_poly) and not len(d_line)):
        return pos
    pos = pos.copy()
    pos["_area"] = pos.geometry.area
    # A/A2 lines carry their own explicit surface → nothing beats them.
    explicit_line = pos["is_line"] & pos["sealing_group"].isin(("A", "A2"))
    b_line = pos["is_line"] & (pos["sealing_group"] == "B")

    cutters: list[pd.DataFrame] = []
    if len(d_poly):
        d_poly = d_poly.assign(_d_area=d_poly.geometry.area)
        pairs = gpd.sjoin(pos, d_poly, how="inner", predicate="intersects")
        if len(pairs):
            pos_geom = pos.geometry.to_numpy()[pos.index.get_indexer(pairs.index)]
            d_geom = d_poly.geometry.to_numpy()[pairs["index_right"].to_numpy()]
            pos_area = pairs["_area"].to_numpy()
            inside = np.zeros(len(pairs), dtype=bool)
            is_b = b_line.loc[pairs.index].to_numpy()
            if is_b.any():
                overlap = shapely.area(shapely.intersection(_areal(pos_geom[is_b]), _areal(d_geom[is_b])))
                inside[is_b] = overlap > B_LINE_INSIDE_SHARE * pos_area[is_b]
            keep = inside | (
                ~pos["is_line"].loc[pairs.index].to_numpy()
                & (pairs["_d_area"].to_numpy() < pos_area)
            )
            pairs = pairs[keep]
            cutters.append(pd.DataFrame({
                "pos": pairs.index.to_numpy(),
                "geom": d_poly.geometry.to_numpy()[pairs["index_right"].to_numpy()],
            }))
    if len(d_line):
        pairs = gpd.sjoin(pos[~explicit_line], d_line, how="inner", predicate="intersects")
        if len(pairs):
            cutters.append(pd.DataFrame({
                "pos": pairs.index.to_numpy(),
                "geom": d_line.geometry.to_numpy()[pairs["index_right"].to_numpy()],
            }))
    if not cutters:
        return pos.drop(columns="_area")

    cut = pd.concat(cutters, ignore_index=True)
    cut_union = cut.groupby("pos")["geom"].agg(lambda g: shapely.union_all(g.to_numpy()))
    idx = cut_union.index.to_numpy()
    geoms = pos.geometry.to_numpy().copy()
    geoms[idx] = _diff(geoms[idx], cut_union.to_numpy())
    pos = pos.set_geometry(geoms)
    pos = pos[~pos.geometry.is_empty]
    return pos.drop(columns="_area")


def _union_per_hex(hexes: gpd.GeoDataFrame, layer: gpd.GeoDataFrame | None, n: int) -> np.ndarray:
    """Per hexagon (row position 0..n-1 in `hexes`), the union of `layer` clipped to it.

    Empty geometry where nothing overlaps. Clipping before the union keeps each
    union small (only the pieces inside one hexagon).
    """
    out = np.full(n, shapely.Polygon(), dtype=object)
    if layer is None or not len(layer):
        return out
    pairs = gpd.sjoin(hexes, layer[["geometry"]], how="inner", predicate="intersects")
    if not len(pairs):
        return out
    hid = pairs["_hid"].to_numpy()
    clipped = shapely.intersection(
        hexes.geometry.to_numpy()[hid], layer.geometry.to_numpy()[pairs["index_right"].to_numpy()]
    )
    # Neighbours that only touch the hexagon edge leave lines/points behind;
    # buffer(0) keeps the areal part only (and repairs it), so later overlays
    # never mix dimensions.
    clipped = shapely.buffer(clipped, 0)
    keep = shapely.area(clipped) > 0
    if not keep.any():
        return out
    df = pd.DataFrame({"hid": hid[keep], "geom": clipped[keep]})
    single = df.groupby("hid")["geom"].transform("size") == 1
    out[df.loc[single, "hid"].to_numpy()] = df.loc[single, "geom"].to_numpy()
    multi = df[~single]
    if len(multi):
        merged = multi.groupby("hid")["geom"].agg(lambda g: _areal(shapely.union_all(g.to_numpy())))
        out[merged.index.to_numpy()] = merged.to_numpy()
    return out


def sealing_bonus_factor(share_pct, saturation_pct: float):
    """0..1 share of the full sealed ground bonus: linear up to `saturation_pct`,
    full above it. NaN (no data) stays NaN. Works on scalars and pandas/numpy arrays."""
    saturation = max(1.0, float(saturation_pct))
    return np.clip(share_pct / saturation, 0.0, 1.0)


def compute_sealed_share(
    hex_geoms: gpd.GeoSeries,
    surfaces: gpd.GeoDataFrame | None,
    carriageways: gpd.GeoDataFrame | None = None,
    carriageways_sealed: bool = False,
) -> np.ndarray:
    """Sealed share (0..1) per hexagon, aligned with `hex_geoms` (EPSG:25832).

    `carriageways` are the buffered road surfaces; with
    `carriageways_sealed=True` they count as sealed ground ("Fahrbahn ausschließen"
    off), otherwise they are deducted.
    """
    n = len(hex_geoms)
    share = np.zeros(n)
    if n == 0:
        return share

    layers = prepare_surfaces(surfaces)
    cw = _to_metric(carriageways)[["geometry"]] if carriageways is not None else _empty()
    if len(cw):
        cw = cw.set_geometry(_valid(cw.geometry.to_numpy()))
    full_layer = layers["full"]
    if carriageways_sealed and len(cw):
        full_layer = pd.concat([full_layer, cw], ignore_index=True)
    if not len(full_layer) and not len(layers["half"]):
        return share

    hexes = gpd.GeoDataFrame(
        {"_hid": np.arange(n)}, geometry=hex_geoms.to_numpy(), crs=METRIC_CRS
    )
    full = _union_per_hex(hexes, full_layer, n)
    half = _union_per_hex(hexes, layers["half"], n)
    half = _diff(half, full)

    # Only hexagons with something sealed need the deductions.
    touched = ~(shapely.is_empty(full) & shapely.is_empty(half))
    sub = hexes[touched]
    m = len(sub)
    sub = sub.assign(_hid=np.arange(m))
    deduction = _union_per_hex(sub, layers["pits"], m)
    if not carriageways_sealed and len(cw):
        deduction = _union(deduction, _union_per_hex(sub, cw, m))

    full_t = _diff(full[touched], deduction)
    half_t = _diff(half[touched], deduction)
    hex_area = shapely.area(sub.geometry.to_numpy())
    share[touched] = (shapely.area(full_t) + 0.5 * shapely.area(half_t)) / hex_area
    return np.clip(share, 0.0, 1.0)

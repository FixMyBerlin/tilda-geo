from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class TargetConfig:
    name: str
    osm_tags: Dict
    max_dist_m: float
    optimal_dist_m: float
    weight_in_target: float  # Gewicht innerhalb des Ziel-Scores (0–1)


@dataclass
class UseCaseConfig:
    name: str
    targets: List[TargetConfig]
    weights: Dict[str, float]
    dem_source: str = "srtm"                 # "dgm1" | "mapterhorn" | "srtm"
    dgm1_path: Optional[str] = None
    tilda_path: Optional[str] = None

    # Vegetations-Faktor (NDVI). Richtung bestimmt das Vorzeichen des Teilscores:
    #   "negative" → mehr Grün = schlechter (Grünflächen schützen) [Default]
    #   "positive" → mehr Grün = besser (Bebauung auf Grün erwünscht)
    vegetation_direction: str = "negative"

    # Harte Ausschlussgrenzen
    max_cyclepath_dist_m: float = 150.0     # weiter weg → Score 0
    min_clearance_m: float = 2.0            # zu nah an Gebäude → Score 0
    min_surface_score: float = 30.0         # Untergrund-Score unter Schwelle → Score 0
    max_slope_deg: float = 8.0              # steiler → Score 0

    min_score_threshold: float = 60.0       # MCE-Schwelle für Potentialflächen


# ── Defaults / Validierung ────────────────────────────────────────────────────

DEFAULT_WEIGHTS = {
    "w_cyclepath": 0.20,
    "w_surface":   0.20,
    "w_target":    0.15,
    "w_slope":     0.20,
    "w_clearance": 0.10,
    "w_transit":   0.15,
    "w_vegetation": 0.0,   # neutral per Default → kein Verhaltensbruch bestehender Szenarien
}


def use_case_from_dict(cfg: dict) -> UseCaseConfig:
    """Baut eine UseCaseConfig aus dem `factorConfig`-JSON eines PlanningScenario.

    Erwartetes Schema (alle Felder außer `study_area` optional, mit Defaults):
      {
        "name": str,
        "weights": {w_cyclepath, w_surface, w_target, w_slope, w_clearance, w_transit},
        "dem_source": "srtm" | "dgm1" | "mapterhorn",
        "max_cyclepath_dist_m", "min_clearance_m", "min_surface_score",
        "max_slope_deg", "min_score_threshold": float,
        "targets": [ {name, osm_tags, max_dist_m, optimal_dist_m, weight_in_target} ],
      }
    `study_area` und `h3_resolution` werden vom Worker separat aus dem factorConfig gelesen.
    """
    weights = {**DEFAULT_WEIGHTS, **(cfg.get("weights") or {})}
    targets = [
        TargetConfig(
            name=t["name"],
            osm_tags=t.get("osm_tags", {}),
            max_dist_m=float(t.get("max_dist_m", 400)),
            optimal_dist_m=float(t.get("optimal_dist_m", 50)),
            weight_in_target=float(t.get("weight_in_target", 1.0)),
        )
        for t in (cfg.get("targets") or [])
    ]
    return UseCaseConfig(
        name=cfg.get("name", "Szenario"),
        targets=targets,
        weights=weights,
        dem_source=cfg.get("dem_source", "srtm"),
        dgm1_path=cfg.get("dgm1_path"),
        vegetation_direction=cfg.get("vegetation_direction", "negative"),
        max_cyclepath_dist_m=float(cfg.get("max_cyclepath_dist_m", 150.0)),
        min_clearance_m=float(cfg.get("min_clearance_m", 2.0)),
        min_surface_score=float(cfg.get("min_surface_score", 30.0)),
        max_slope_deg=float(cfg.get("max_slope_deg", 8.0)),
        min_score_threshold=float(cfg.get("min_score_threshold", 60.0)),
    )

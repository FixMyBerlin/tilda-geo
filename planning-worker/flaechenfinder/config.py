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

    # Vegetations-Faktor (NDVI). Richtung bestimmt das Vorzeichen des Effekts:
    #   "negative" → mehr Grün = Punktabzug (Grünflächen schützen) [Default]
    #   "positive" → mehr Grün = Punktbonus (Bebauung auf Grün erwünscht)
    # Der Effekt ist kein additiver Teilscore mehr, sondern ein stufenloser
    # Abzug/Bonus auf den Basis-Score (siehe scorer.py); der Gesamtscore wird
    # anschließend auf [0, 100] begrenzt.
    vegetation_direction: str = "negative"

    # Toleranzschwelle in % Bedeckung: darunter kein Vegetations-Effekt (kleine
    # Grünreste/Randpixel ignorieren), darüber linearer Anstieg bis 100 %.
    vegetation_penalty_threshold_pct: float = 20.0

    # Harte Ausschlussgrenzen
    max_cyclepath_dist_m: float = 150.0     # weiter weg → Score 0
    min_clearance_m: float = 2.0            # zu nah an Gebäude → Score 0
    min_surface_score: float = 30.0         # Untergrund-Score unter Schwelle → Score 0

    min_score_threshold: float = 60.0       # MCE-Schwelle für Potentialflächen

    # CIR/RGBI-Kachelquelle für die Vegetationsberechnung.
    # "auto" erkennt anhand des Studiengebiet-Zentroiden (12°E = UTM32/33-Grenze):
    #   Bayern → EPSG:25832 (WMS), Brandenburg/Berlin → EPSG:25833 (WMS).
    # Explizite Werte: "bayern" | "bb"
    cir_source: str = "auto"


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
        "min_score_threshold": float,
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
        vegetation_penalty_threshold_pct=float(
            cfg.get("vegetation_penalty_threshold_pct", 20.0)
        ),
        max_cyclepath_dist_m=float(cfg.get("max_cyclepath_dist_m", 150.0)),
        min_clearance_m=float(cfg.get("min_clearance_m", 2.0)),
        min_surface_score=float(cfg.get("min_surface_score", 30.0)),
        min_score_threshold=float(cfg.get("min_score_threshold", 60.0)),
        cir_source=cfg.get("cir_source", "auto"),
    )

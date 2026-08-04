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

    # Kreuzungs-Bonus: Radabstellanlagen lassen sich an Straßenecken gut
    # platzieren – ideal ~5–8 m von der Bordsteinecke entfernt (nicht in der
    # Kreuzungsmitte). Der Bonus ist ein stufenloser Modifier auf den Basis-Score
    # (analog Vegetation, siehe scorer.py); Stärke = weights["w_intersection"].
    #   d < ideal_min                → linearer Anstieg 0 → 1
    #   ideal_min ≤ d ≤ ideal_max    → voller Bonus (1.0)
    #   ideal_max < d ≤ radius       → linearer Abfall 1 → 0
    #   d > radius                   → 0
    intersection_radius_m: float = 20.0       # äußere Reichweite (UI-einstellbar)
    intersection_ideal_min_m: float = 5.0
    intersection_ideal_max_m: float = 8.0

    # Parken-Bonus: bestehende KFZ-Parkflächen (public.parkings/parkings_separate)
    # lassen sich gut in Radabstellanlagen umwidmen. Der Bonus ist ein stufenloser
    # Modifier auf den Basis-Score (analog Kreuzung, siehe scorer.py); Stärke =
    # weights["w_parken"]. Anders als bei der Kreuzung ist es ideal, DIREKT auf der
    # Parkfläche zu liegen:
    #   d = 0 (auf der Fläche)   → voller Bonus (1.0)
    #   0 < d ≤ radius           → linearer Abfall 1 → 0
    #   d > radius               → 0
    parken_radius_m: float = 15.0             # Reichweite des Bonus (UI-einstellbar)

    # Fußgängerzonen-Bonus: an Kreuzungen, wo eine der üblichen Straßenkategorien
    # auf eine Fußgängerzone (highway=pedestrian) trifft, besteht besonders hoher
    # Bedarf. Nutzt denselben Bordstein-Ecken-Mechanismus wie der Kreuzungs-Bonus
    # (gleiche ideal_min/ideal_max-Rampe), aber eigenes Gewicht
    # weights["w_fussgaengerzone"] und eigene äußere Reichweite. Modifier auf den
    # Basis-Score, zählt zur Bedarfsgruppe (siehe scorer.py).
    fussgaengerzone_radius_m: float = 20.0    # äußere Reichweite (UI-einstellbar)

    # Bestands-Radabstellanlagen: bestehende Fahrradabstellanlagen
    # (public."bicycleParking_points") senken den Bedarf in ihrem Umkreis. Der
    # Faktor ist ein negativer Modifier auf die BEDARFS-Gruppe (analog zum
    # Fußgängerzonen-Bonus, nur mit umgekehrtem Vorzeichen, siehe scorer.py);
    # Stärke = weights["w_bestand"] (max. Abzug in Punkten × 100). Die Reichweite
    # je Anlage hängt an ihrer Kapazität: Durchmesser = capacity/2 m (→ Radius
    # capacity/4). Fehlt das capacity-Tag, gilt dieser Default-Durchmesser.
    # Innerhalb des Einzugskreises voller Abzug, außen 0.
    bestand_default_diameter_m: float = 20.0  # Durchmesser ohne capacity (UI-einstellbar)

    # Harte Ausschlussgrenzen
    max_cyclepath_dist_m: float = 50.0      # weiter weg → Score 0
    min_surface_score: float = 30.0         # Untergrund-Score unter Schwelle → Score 0

    # Fahrbahnen ausschließen: Straßenflächen (public._parking_roads, gepuffert
    # um ihre erfasste/geschätzte Breite) hart aus der Bebauung ausschließen.
    # Reiner Ein/Aus-Schalter (kein Gewicht) — Default aus (non-breaking).
    exclude_carriageways: bool = False

    # Mindest-Score, ab dem ein Hexagon zu einer zusammenhängenden Kandidaten-
    # fläche zählt (Flächensuche). Cluster = benachbarte Hexagone mit
    # mce_gesamtscore >= dieser Schwelle; ihre Gesamtfläche steht in
    # scenario_hexagons.cluster_area_m2 (Client filtert danach auf Zielgröße).
    min_score_threshold: float = 60.0

    # CIR/RGBI-Kachelquelle für die Vegetationsberechnung.
    # "auto" erkennt anhand des Studiengebiet-Zentroiden: Hessen-Bounding-Box →
    #   Hessen (EPSG:25832), sonst 12°E-Grenze → Bayern (EPSG:25832) bzw.
    #   Brandenburg/Berlin (EPSG:25833) – alle drei via WMS.
    # Explizite Werte: "bayern" | "bb" | "hessen"
    cir_source: str = "auto"

    # Eigene Flächen (Nutzer-Upload): wie die hochgeladene Geometrie in den Score
    # eingeht. Die Geometrie selbst (factorConfig.user_geojson) liest der Worker
    # separat aus dem Config-Dict, analog study_area. Stärke = weights["w_eigendaten"].
    #   "bonus"           → weicher Zuschlag innerhalb des Puffers
    #   "penalty"         → weicher Abzug innerhalb des Puffers
    #   "exclude_inside"  → harter Ausschluss: Hexagon in der Geometrie → mce = 0
    #   "exclude_outside" → harter Ausschluss: Hexagon außerhalb → mce = 0 (Maske)
    user_geojson_mode: str = "bonus"


# ── Puffer für Eigendaten-Geometrien (fest) ───────────────────────────────────
# Punkte/Linien haben keine Fläche; sie werden vor dem Verschneiden gepuffert.
USER_POINT_BUFFER_M = 1.5
USER_LINE_BUFFER_M = 2.5


# ── Defaults / Validierung ────────────────────────────────────────────────────

# Zwei Arten von Gewichten (siehe scorer.py):
#   Kriterien (w_cyclepath/w_surface/w_target/w_slope/w_transit) gehen in den
#     gewichteten Durchschnitt der 0–100-Teilscores ein. Nur ihr Verhältnis
#     zueinander zählt – die Summe muss nichts Bestimmtes ergeben.
#   Modifier (alle übrigen) verschieben den fertigen Score um bis zu w × 100
#     Punkte; hier ist der absolute Wert die Aussage.
DEFAULT_WEIGHTS = {
    "w_cyclepath": 0.20,
    "w_surface":   0.20,
    "w_target":    0.15,
    "w_slope":     0.20,
    "w_transit":   0.15,
    "w_vegetation": 0.0,   # neutral per Default → kein Verhaltensbruch bestehender Szenarien
    "w_intersection": 0.1, # Kreuzungs-Bonus (max. Bonus in Punkten × 100)
    "w_parken": 0.1,       # Parken-Bonus (KFZ→Rad Umwidmung)
    "w_fussgaengerzone": 0.0,  # Fußgängerzonen-Bonus (neutral per Default → non-breaking)
    "w_bestand": 0.0,          # Bestandsanlagen-Bedarfssenkung (neutral per Default → non-breaking)
    "w_eigendaten": 0.0,       # Eigene Flächen (Nutzer-Upload); neutral per Default → non-breaking
}


def use_case_from_dict(cfg: dict) -> UseCaseConfig:
    """Baut eine UseCaseConfig aus dem `factorConfig`-JSON eines PlanningScenario.

    Erwartetes Schema (alle Felder außer `study_area` optional, mit Defaults):
      {
        "name": str,
        "weights": {w_cyclepath, w_surface, w_target, w_slope, w_transit},
        "dem_source": "srtm" | "dgm1" | "mapterhorn",
        "max_cyclepath_dist_m", "min_surface_score",
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
        max_cyclepath_dist_m=float(cfg.get("max_cyclepath_dist_m", 50.0)),
        min_surface_score=float(cfg.get("min_surface_score", 30.0)),
        cir_source=cfg.get("cir_source", "auto"),
        intersection_radius_m=float(cfg.get("intersection_radius_m", 20.0)),
        intersection_ideal_min_m=float(cfg.get("intersection_ideal_min_m", 5.0)),
        intersection_ideal_max_m=float(cfg.get("intersection_ideal_max_m", 8.0)),
        parken_radius_m=float(cfg.get("parken_radius_m", 15.0)),
        fussgaengerzone_radius_m=float(cfg.get("fussgaengerzone_radius_m", 20.0)),
        bestand_default_diameter_m=float(cfg.get("bestand_default_diameter_m", 20.0)),
        min_score_threshold=float(cfg.get("min_score_threshold", 60.0)),
        user_geojson_mode=cfg.get("user_geojson_mode", "bonus"),
        exclude_carriageways=bool(cfg.get("exclude_carriageways", False)),
    )

"""Planning-Worker: konsumiert PlanningJob-Zeilen und berechnet Flächenfinder-Läufe.

Lifecycle (siehe Architektur-Plan):
  QUEUED  → von der App angelegt + pg_notify('planning_jobs', jobId)
  RUNNING → hier via FOR UPDATE SKIP LOCKED beansprucht
  DONE    → Ergebnis in planning.* geschrieben, resultRunId gesetzt
  FAILED  → Exception abgefangen, errorMessage gesetzt

Wakeup über LISTEN/NOTIFY; 15s-Poll als Fallback für verpasste Notifies/Neustart.
Beim Start werden hängengebliebene RUNNING-Jobs requeued.
"""
from __future__ import annotations

import gc
import json
import select as _select
import sys
import traceback

import geopandas as gpd
import psycopg
from psycopg.types.json import Jsonb
from shapely.geometry import shape

import db
from flaechenfinder.cir_sources import resolve_source
from flaechenfinder.config import use_case_from_dict
from flaechenfinder.dem import DEMAdapter
from flaechenfinder.postgis_loader import PostgisLoader
from flaechenfinder.scorer import (
    SCORING_STEP_COUNT,
    SCORING_STEPS,
    aggregate_hexagons,
    run_flaechenfinder,
)
from flaechenfinder.carriageways import compute_carriageway_areas
from flaechenfinder.tilda import TildaLoader
from flaechenfinder.vegetation import compute_vegetation_areas
from results import write_results

CHANNEL = "planning_jobs"
POLL_SECONDS = 15


def _study_area_from_config(cfg: dict):
    geo = cfg.get("study_area")
    if geo is None:
        raise ValueError("factorConfig.study_area fehlt (GeoJSON-Geometrie erwartet)")
    if geo.get("type") == "FeatureCollection":
        geo = geo["features"][0]["geometry"]
    elif geo.get("type") == "Feature":
        geo = geo["geometry"]
    return shape(geo)


# Vegetationsflächen hängen nur vom Studiengebiet ab (NDVI aus CIR-Kacheln),
# nie von Gewichten/Schwellen. Ändert ein Nutzer nur einen Faktor und startet
# neu, ist das Ergebnis eines früheren Laufs mit identischem Studiengebiet
# bit-identisch – die (teure) Neuberechnung lässt sich dann überspringen.
_VEGETATION_REUSE_CANDIDATES = 5


def _find_reusable_vegetation(conn, engine, scenario_id: int, current_run_id: int, study_area):
    """Sucht unter den letzten Läufen desselben Szenarios einen mit identischem
    Studiengebiet, in dem Vegetation tatsächlich berechnet wurde, und lädt dessen
    `scenario_vegetation`-Zeilen. None = kein Treffer, muss neu berechnet werden."""
    with conn.cursor() as cur:
        cur.execute(
            """SELECT id, "factorConfigSnapshot" FROM prisma."PlanningRun"
               WHERE "scenarioId" = %s AND id != %s
               ORDER BY id DESC LIMIT %s""",
            (scenario_id, current_run_id, _VEGETATION_REUSE_CANDIDATES),
        )
        candidates = cur.fetchall()

    for prev_run_id, snapshot in candidates:
        if not ((snapshot.get("weights") or {}).get("w_vegetation", 0) or 0):
            continue  # Vegetation wurde in diesem Lauf gar nicht berechnet
        try:
            prev_study_area = _study_area_from_config(snapshot)
        except Exception:
            continue
        if not study_area.equals(prev_study_area):
            continue
        return _load_vegetation_rows(engine, prev_run_id)
    return None


def _load_vegetation_rows(engine, run_id: int) -> gpd.GeoDataFrame:
    gdf = gpd.read_postgis(
        'SELECT geom, ndvi, flaeche_m2 FROM planning.scenario_vegetation WHERE run_id = %(run_id)s',
        engine, geom_col="geom", params={"run_id": run_id},
    )
    if not len(gdf):
        return gpd.GeoDataFrame({"ndvi": [], "flaeche_m2": []}, geometry=[], crs="EPSG:3857")
    return gdf.rename_geometry("geometry")


def claim_job(conn: psycopg.Connection):
    """Beansprucht den ältesten QUEUED-Job atomar. Gibt (job_id, scenario_id) oder None."""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE prisma."PlanningJob"
            SET status = 'RUNNING', "startedAt" = now(), "updatedAt" = now()
            WHERE id = (
              SELECT id FROM prisma."PlanningJob"
              WHERE status = 'QUEUED'
              ORDER BY id
              FOR UPDATE SKIP LOCKED
              LIMIT 1
            )
            RETURNING id, "scenarioId";
            """
        )
        row = cur.fetchone()
    return row  # None oder (id, scenarioId)


def requeue_stale(conn: psycopg.Connection):
    with conn.cursor() as cur:
        cur.execute(
            """UPDATE prisma."PlanningJob" SET status='QUEUED', "startedAt"=NULL, "updatedAt"=now()
               WHERE status='RUNNING'"""
        )
        n = cur.rowcount
    if n:
        print(f"   ↺ {n} hängengebliebene RUNNING-Jobs requeued")


def _load_scenario_config(conn, scenario_id: int):
    with conn.cursor() as cur:
        cur.execute(
            'SELECT "factorConfig" FROM prisma."PlanningScenario" WHERE id = %s',
            (scenario_id,),
        )
        row = cur.fetchone()
    if not row:
        raise ValueError(f"Scenario {scenario_id} nicht gefunden")
    return row[0]


def _create_run(conn, scenario_id: int, snapshot: dict) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO prisma."PlanningRun" ("scenarioId", "factorConfigSnapshot", status, "createdAt")
               VALUES (%s, %s, 'PENDING', now()) RETURNING id""",
            (scenario_id, Jsonb(snapshot)),
        )
        return cur.fetchone()[0]


def set_progress(conn, job_id: int, pct: int, label: str = ""):
    """Schreibt den Fortschritt (0–100) des Jobs und loggt ihn. Autocommit →
    sofort für die App sichtbar. Fehlt die Spalte, wird still ignoriert."""
    pct = max(0, min(100, int(pct)))
    print(f"   ⏳ {pct}% – {label}")
    try:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE prisma."PlanningJob" SET progress=%s, "progressLabel"=%s, "updatedAt"=now() WHERE id=%s',
                (pct, label or None, job_id),
            )
    except Exception as e:
        print(f"   ⚠️  Fortschritt konnte nicht gespeichert werden: {e}")


def process_job(conn, engine, job_id: int, scenario_id: int):
    print(f"\n=== Job {job_id} (Scenario {scenario_id}) ===")
    set_progress(conn, job_id, 2, "Vorbereitung")
    cfg = _load_scenario_config(conn, scenario_id)
    run_id = _create_run(conn, scenario_id, cfg)

    study_area = _study_area_from_config(cfg)
    h3_res = int(cfg.get("h3_resolution", 13))

    use_case = use_case_from_dict(cfg)
    loader = PostgisLoader(engine)
    tilda_loader = TildaLoader(loader)
    dem_adapter = DEMAdapter(source=use_case.dem_source, dgm1_path=use_case.dgm1_path)

    # Schritt 1: Vegetationsflächen on-demand aus CIR/RGBI-Kacheln berechnen.
    # Die Quelle (Bayern / Hessen / BB – jeweils WMS) wird aus use_case.cir_source aufgelöst.
    # Fehlt die Datengrundlage oder liegt das Gebiet außerhalb bekannter Quellen,
    # läuft das restliche Scoring normal ohne Vegetationsdaten weiter – das
    # Frontend erkennt diesen Fall selbst (Gewicht w_vegetation=0) und zeigt
    # den Schritt dort als übersprungen an, statt sich auf den Fortschrittstext
    # zu verlassen. Fortschritt 5–70 % entfällt auf diese (meist längste) Phase.
    step1_label = f"1/{SCORING_STEP_COUNT} · {SCORING_STEPS[0]}"

    def _veg_progress(frac, label):
        set_progress(conn, job_id, 5 + frac * 65, f"{step1_label} – {label}")

    cir_source = None
    if not (use_case.weights.get("w_vegetation", 0) or 0):
        print("   ℹ️  w_vegetation=0 – Vegetationsberechnung übersprungen")
        vegetation = None
        set_progress(conn, job_id, 70, step1_label)
    else:
        cir_source = resolve_source(use_case.cir_source, study_area)
        if cir_source is None:
            print("   ℹ️  Keine CIR-Quelle für dieses Gebiet – Vegetation übersprungen")
            vegetation = None
            set_progress(conn, job_id, 70, step1_label)
        else:
            try:
                vegetation = _find_reusable_vegetation(conn, engine, scenario_id, run_id, study_area)
            except Exception as e:
                print(f"   ⚠️  Cache-Suche für Vegetation fehlgeschlagen: {e}")
                vegetation = None
            if vegetation is not None:
                print(f"   ♻️  Vegetation aus vorherigem Lauf wiederverwendet ({len(vegetation)} Flächen)")
                set_progress(conn, job_id, 70, step1_label)
            else:
                try:
                    vegetation = compute_vegetation_areas(
                        study_area, source=cir_source, progress_cb=_veg_progress
                    )
                except Exception as e:
                    print(f"   ⚠️  Vegetationsberechnung fehlgeschlagen: {e}")
                    vegetation = None
                set_progress(conn, job_id, 70, step1_label)

    # Fahrbahnen ausschließen (Checkbox, kein eigener Scoring-Step): Straßen
    # einmalig laden+puffern, damit dasselbe GeoDataFrame sowohl für den
    # harten Ausschluss (run_flaechenfinder) als auch für die Kartenanzeige
    # (scenario_carriageways) genutzt wird – analog zur Vegetation oben.
    carriageways = None
    if use_case.exclude_carriageways:
        try:
            carriageways = compute_carriageway_areas(study_area, tilda_loader)
        except Exception as e:
            print(f"   ⚠️  Fahrbahnen-Berechnung fehlgeschlagen: {e}")
            carriageways = None

    # Schritte 2–11 (Scoring in run_flaechenfinder) auf 72–90 % abbilden und
    # ihren Namen als progressLabel an die App weiterreichen. Format
    # "n/total · Name", damit das Frontend den aktuellen Schritt in der
    # Schrittliste hervorheben kann.
    def _scoring_progress(step, total, label):
        first, last = 2, total - 1  # Schritt 1 (Vegetation) und total (Speichern) laufen hier nicht
        set_progress(conn, job_id, 72 + (step - first) / (last - first) * 18, f"{step}/{total} · {label}")

    hex_proj = run_flaechenfinder(
        study_area_geom=study_area,
        use_case=use_case,
        dem_adapter=dem_adapter,
        tilda_loader=tilda_loader,
        h3_resolution=h3_res,
        osm_loader=loader,
        vegetation_gdf=vegetation,
        carriageway_gdf=carriageways,
        user_geojson=cfg.get("user_geojson"),
        progress_cb=_scoring_progress,
    )

    # Grobes Aggregat-Gitter für niedrige Zoomstufen (z < 16). Reine
    # Nachverarbeitung der bereits berechneten Scores – keine Spatial-Joins.
    hex_agg = aggregate_hexagons(hex_proj)

    set_progress(conn, job_id, 92, f"{SCORING_STEP_COUNT}/{SCORING_STEP_COUNT} · {SCORING_STEPS[-1]}")
    hex_count, veg_count, _carriageway_count = write_results(
        engine, conn, run_id, hex_proj, vegetation, carriageways, hex_agg=hex_agg
    )
    del hex_proj, hex_agg, vegetation, carriageways
    gc.collect()
    set_progress(conn, job_id, 100, "Fertig")

    run_status = "COMPLETE" if hex_count > 0 else "EMPTY"
    with conn.cursor() as cur:
        cur.execute(
            'UPDATE prisma."PlanningRun" SET status=%s, "hexCount"=%s, "vegCount"=%s, "cirAttribution"=%s WHERE id=%s',
            (run_status, hex_count, veg_count, cir_source.attribution if cir_source else None, run_id),
        )
        cur.execute(
            'UPDATE prisma."PlanningScenario" SET "currentRunId"=%s, "updatedAt"=now() WHERE id=%s',
            (run_id, scenario_id),
        )
        cur.execute(
            """UPDATE prisma."PlanningJob"
               SET status='DONE', "resultRunId"=%s, "finishedAt"=now(), "updatedAt"=now()
               WHERE id=%s""",
            (run_id, job_id),
        )
    print(f"=== Job {job_id} DONE (run_id={run_id}) ===")


def fail_job(conn, job_id: int, message: str):
    try:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE prisma."PlanningJob"
                   SET status='FAILED', "errorMessage"=%s, "finishedAt"=now(), "updatedAt"=now()
                   WHERE id=%s""",
                (message[:2000], job_id),
            )
    except Exception as e:
        print(f"   ⚠️  Konnte Job {job_id} nicht als FAILED markieren: {e}")


def drain(conn, engine):
    """Verarbeitet alle aktuell wartenden Jobs, bis keiner mehr da ist."""
    while True:
        row = claim_job(conn)
        if row is None:
            return
        job_id, scenario_id = row
        try:
            process_job(conn, engine, job_id, scenario_id)
        except Exception:
            tb = traceback.format_exc()
            print(f"   ✗ Job {job_id} fehlgeschlagen:\n{tb}", file=sys.stderr)
            fail_job(conn, job_id, tb)


def main():
    print("🛠️  Planning-Worker startet...")
    conn = db.connect()
    engine = db.make_engine()
    db.apply_schema(conn)
    requeue_stale(conn)

    conn.execute(f"LISTEN {CHANNEL}")
    print(f"   👂 LISTEN {CHANNEL} (Poll-Fallback {POLL_SECONDS}s)")

    drain(conn, engine)  # evtl. bereits wartende Jobs

    while True:
        # select() auf dem Connection-Socket: wacht bei pg_notify oder nach
        # POLL_SECONDS auf. Zuverlässiger als conn.notifies(timeout=…), das in
        # psycopg3 3.3.x intern in futex_do_wait hängt und weder NOTIFY noch
        # Timeout korrekt weitergibt.
        try:
            _select.select([conn.fileno()], [], [], POLL_SECONDS)
        except Exception:
            pass
        drain(conn, engine)


if __name__ == "__main__":
    main()

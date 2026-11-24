"""space-finder-worker: consumes SpaceFinderJob rows and computes Flächenfinder runs.

Lifecycle (see architecture plan):
  QUEUED  → created by the app + pg_notify('space_finder_jobs', jobId)
  RUNNING → claimed here via FOR UPDATE SKIP LOCKED
  DONE    → result written to space_finder.*, resultRunId set
  FAILED  → exception caught, errorMessage set

Wakeup via LISTEN/NOTIFY; 15s poll as fallback for missed notifies/restarts.
Stale RUNNING jobs are requeued on startup.
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
from scoring.carriageways import compute_carriageway_areas
from scoring.cir_sources import resolve_source
from scoring.config import use_case_from_dict
from scoring.dem import DEMAdapter
from scoring.postgis_loader import PostgisLoader
from scoring.scorer import (
    SCORING_STEP_COUNT,
    SCORING_STEPS,
    aggregate_hexagons,
    run_flaechenfinder,
)
from scoring.tilda import TildaLoader
from scoring.vegetation import compute_vegetation_areas
from merge_factor_config import merge_factor_config as _merge_factor_config
from results import write_results

CHANNEL = "space_finder_jobs"
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


# Vegetation areas depend only on the study area (NDVI from CIR tiles), never on
# weights/thresholds. If a user only changes a factor and reruns, the result of
# an earlier run with an identical study area is bit-identical, so the
# (expensive) recomputation can be skipped.
_VEGETATION_REUSE_CANDIDATES = 5


def vegetation_needed(weights: dict) -> bool:
    """The aerial-image vegetation phase only runs when vegetation is weighted
    (the sealing bonus works from OSM alone)."""
    return (weights.get("w_vegetation", 0) or 0) > 0


def _find_reusable_vegetation(
    conn, engine, variant_id: int, current_run_id: int, study_area, ndvi_min: float
):
    """Among the latest runs of the same variant, find one with an identical study
    area in which vegetation was actually computed with the same NDVI threshold,
    and load its `scenario_vegetation` rows. None = no match, must be recomputed.
    Rows from before the threshold was stored (NULL) never match, so a changed
    threshold takes effect on the next run.

    Runs without stored areas don't count as a match: 0 rows in practice means
    the computation failed back then (e.g. WMS outage). Reusing them would let a
    single failed run keep all later runs of the same variant empty forever."""
    with conn.cursor() as cur:
        cur.execute(
            """SELECT id, "factorConfigSnapshot" FROM prisma."SpaceFinderRun"
               WHERE "variantId" = %s AND id != %s
               ORDER BY id DESC LIMIT %s""",
            (variant_id, current_run_id, _VEGETATION_REUSE_CANDIDATES),
        )
        candidates = cur.fetchall()

    for prev_run_id, snapshot in candidates:
        if not vegetation_needed(snapshot.get("weights") or {}):
            continue  # vegetation was not computed in this run
        try:
            prev_study_area = _study_area_from_config(snapshot)
        except Exception:
            continue
        if not study_area.equals(prev_study_area):
            continue
        gdf = _load_vegetation_rows(engine, prev_run_id, ndvi_min)
        if not len(gdf):
            continue  # empty run = failed back then, don't reuse
        return gdf
    return None


def _load_vegetation_rows(engine, run_id: int, ndvi_min: float) -> gpd.GeoDataFrame:
    # `ndvi_min` is stored as real: compare with a tolerance, not with =.
    gdf = gpd.read_postgis(
        """SELECT geom, ndvi, flaeche_m2, ndvi_min FROM space_finder.scenario_vegetation
           WHERE run_id = %(run_id)s AND abs(ndvi_min - %(ndvi_min)s) < 1e-6""",
        engine, geom_col="geom", params={"run_id": run_id, "ndvi_min": ndvi_min},
    )
    if not len(gdf):
        return gpd.GeoDataFrame({"ndvi": [], "flaeche_m2": []}, geometry=[], crs="EPSG:3857")
    return gdf.rename_geometry("geometry")


def claim_job(conn: psycopg.Connection):
    """Atomically claim the oldest QUEUED job. Returns (job_id, variant_id) or None."""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE prisma."SpaceFinderJob"
            SET status = 'RUNNING', "startedAt" = now(), "updatedAt" = now()
            WHERE id = (
              SELECT id FROM prisma."SpaceFinderJob"
              WHERE status = 'QUEUED'
              ORDER BY id
              FOR UPDATE SKIP LOCKED
              LIMIT 1
            )
            RETURNING id, "variantId";
            """
        )
        row = cur.fetchone()
    return row  # None or (id, variantId)


def requeue_stale(conn: psycopg.Connection):
    with conn.cursor() as cur:
        cur.execute(
            """UPDATE prisma."SpaceFinderJob" SET status='QUEUED', "startedAt"=NULL, "updatedAt"=now()
               WHERE status='RUNNING'"""
        )
        n = cur.rowcount
    if n:
        print(f"   ↺ {n} stale RUNNING jobs requeued")


def _load_variant_config(conn, variant_id: int):
    """Load variant + Planungsgebiet and merge them into a flat factorConfig dict.

    The merge (`_merge_factor_config`) mirrors `mergeFactorConfig.ts`, so snapshot
    and scoring see the same saturation as the UI (census suggestion or 30).
    """
    with conn.cursor() as cur:
        cur.execute(
            """SELECT v."factorConfig", a."studyArea", a."userDatasets",
                      a."useCase", a."areaSizeM2", a."censusSaettigungEw", a."censusEwPerHa"
               FROM prisma."SpaceFinderVariant" v
               JOIN prisma."SpaceFinderArea" a ON a.id = v."areaId"
               WHERE v.id = %s""",
            (variant_id,),
        )
        row = cur.fetchone()
    if not row:
        raise ValueError(f"Variant {variant_id} nicht gefunden")
    (
        factor_config,
        study_area,
        user_datasets,
        use_case,
        area_size_m2,
        census_saettigung_ew,
        census_ew_per_ha,
    ) = row
    return _merge_factor_config(
        dict(factor_config),
        {
            "studyArea": study_area,
            "userDatasets": user_datasets,
            "useCase": use_case,
            "areaSizeM2": area_size_m2,
            "censusSaettigungEw": census_saettigung_ew,
            "censusEwPerHa": census_ew_per_ha,
        },
    )


def _create_run(conn, variant_id: int, snapshot: dict) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO prisma."SpaceFinderRun" ("variantId", "factorConfigSnapshot", status, "createdAt")
               VALUES (%s, %s, 'PENDING', now()) RETURNING id""",
            (variant_id, Jsonb(snapshot)),
        )
        return cur.fetchone()[0]


def set_progress(conn, job_id: int, pct: int, label: str = ""):
    """Write the job's progress (0–100) and log it. Autocommit → visible to the
    app immediately. A missing column is silently ignored."""
    pct = max(0, min(100, int(pct)))
    print(f"   ⏳ {pct}% – {label}")
    try:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE prisma."SpaceFinderJob" SET progress=%s, "progressLabel"=%s, "updatedAt"=now() WHERE id=%s',
                (pct, label or None, job_id),
            )
    except Exception as e:
        print(f"   ⚠️  Could not save progress: {e}")


def process_job(conn, engine, job_id: int, variant_id: int):
    print(f"\n=== Job {job_id} (Variant {variant_id}) ===")
    set_progress(conn, job_id, 1, "Vorbereitung")
    cfg = _load_variant_config(conn, variant_id)
    run_id = _create_run(conn, variant_id, cfg)

    study_area = _study_area_from_config(cfg)
    h3_res = int(cfg.get("h3_resolution", 13))

    use_case = use_case_from_dict(cfg)
    loader = PostgisLoader(engine)
    tilda_loader = TildaLoader(loader)
    dem_adapter = DEMAdapter(source=use_case.dem_source, dgm1_path=use_case.dgm1_path)

    # Step 1: compute vegetation areas on demand from CIR/RGBI tiles.
    # The source (Bavaria / Hesse / BB, each a WMS) is resolved from use_case.cir_source.
    # Without source data, or if the area lies outside known sources, the rest of
    # the scoring runs normally without vegetation data. The frontend detects
    # this itself (weight w_vegetation=0) and shows the step as skipped instead
    # of relying on the progress text.
    #
    # Progress budget: the vegetation phase is by far the longest but doesn't
    # always run (weight 0, no CIR source, cache hit). Only when it actually
    # computes does it get VEG_RANGE (5–70 %); otherwise the bar stays at
    # VEG_SKIPPED_PCT and the scoring steps get the whole budget from ~3 %,
    # instead of seemingly starting at 72 %.
    VEG_RANGE = (5, 70)
    VEG_SKIPPED_PCT = 2
    SCORING_END = 90
    step1_label = f"1/{SCORING_STEP_COUNT} · {SCORING_STEPS[0]}"

    def _veg_progress(frac, label):
        lo, hi = VEG_RANGE
        set_progress(conn, job_id, lo + frac * (hi - lo), f"{step1_label} – {label}")

    cir_source = None
    veg_phase_ran = False
    # Run-level notes about missing data sources ({"factor", "reason"}), stored on
    # the run (SpaceFinderRun.dataNotes) and shown in the app.
    data_notes: list[dict] = []
    if not vegetation_needed(use_case.weights):
        print("   ℹ️  w_vegetation=0 – vegetation computation skipped")
        vegetation = None
        set_progress(conn, job_id, VEG_SKIPPED_PCT, step1_label)
    else:
        cir_source = resolve_source(use_case.cir_source, study_area)
        if cir_source is None:
            # No aerial imagery covers the area ("auto" outside Bayern,
            # Brandenburg/Berlin, Hessen) or the key is unknown. The run goes on
            # without vegetation instead of reading "nothing green" from a WMS
            # that has no images there.
            print(
                f"   ℹ️  No CIR source for this area (cir_source={use_case.cir_source!r}) "
                "– vegetation skipped"
            )
            vegetation = None
            data_notes.append({"factor": "vegetation", "reason": "keine_luftbildquelle"})
            set_progress(
                conn, job_id, VEG_SKIPPED_PCT,
                f"{step1_label} – übersprungen, keine Luftbilder für dieses Gebiet",
            )
        else:
            try:
                vegetation = _find_reusable_vegetation(
                    conn, engine, variant_id, run_id, study_area, cir_source.ndvi_min
                )
            except Exception as e:
                print(f"   ⚠️  Vegetation cache lookup failed: {e}")
                vegetation = None
            if vegetation is not None:
                print(f"   ♻️  Reused vegetation from previous run ({len(vegetation)} areas)")
                set_progress(conn, job_id, VEG_SKIPPED_PCT, step1_label)
            else:
                # The long phase runs from here; the bar moves within VEG_RANGE,
                # even if it fails later (then it stays at the upper bound).
                veg_phase_ran = True
                try:
                    vegetation = compute_vegetation_areas(
                        study_area, source=cir_source, progress_cb=_veg_progress
                    )
                except Exception as e:
                    print(f"   ⚠️  Vegetation computation failed: {e}")
                    vegetation = None
                    data_notes.append({"factor": "vegetation", "reason": "luftbild_fehlgeschlagen"})
                set_progress(conn, job_id, VEG_RANGE[1], step1_label)

    # "Fahrbahnen ausschließen" (checkbox, not a scoring step of its own): load and
    # buffer roads once, so the same GeoDataFrame serves both the hard exclusion
    # (run_flaechenfinder) and the map display (scenario_carriageways), like
    # vegetation above.
    # The sealing bonus needs the same road surfaces also when they are not
    # excluded (then they count as sealed ground); the exclusion and the map
    # layer still only get them with the checkbox on.
    carriageways = None
    sealing_carriageways = None
    sealing_weighted = (use_case.weights.get("w_versiegelung", 0) or 0) > 0
    if use_case.exclude_carriageways or sealing_weighted:
        try:
            road_areas = compute_carriageway_areas(study_area, tilda_loader)
        except Exception as e:
            print(f"   ⚠️  Carriageway computation failed: {e}")
            road_areas = None
        if use_case.exclude_carriageways:
            carriageways = road_areas
        if sealing_weighted:
            sealing_carriageways = road_areas

    # Map steps 2–14 (scoring in run_flaechenfinder) onto the remaining budget up
    # to SCORING_END: 72–90 % if the vegetation phase ran, otherwise 3–90 %. Pass
    # the name to the app as progressLabel in the format "n/total · Name", so the
    # frontend can highlight the current step in the step list.
    scoring_start = VEG_RANGE[1] + 2 if veg_phase_ran else VEG_SKIPPED_PCT + 1

    def _scoring_progress(step, total, label):
        first, last = 2, total - 1  # step 1 (vegetation) and total (saving) don't run here
        frac = (step - first) / (last - first)
        set_progress(
            conn, job_id, scoring_start + frac * (SCORING_END - scoring_start), f"{step}/{total} · {label}"
        )

    hex_proj = run_flaechenfinder(
        study_area_geom=study_area,
        use_case=use_case,
        dem_adapter=dem_adapter,
        tilda_loader=tilda_loader,
        h3_resolution=h3_res,
        osm_loader=loader,
        vegetation_gdf=vegetation,
        carriageway_gdf=carriageways,
        sealing_carriageway_gdf=sealing_carriageways,
        user_datasets=cfg.get("user_datasets"),
        eigendaten_weights=cfg.get("eigendaten_weights"),
        progress_cb=_scoring_progress,
        data_notes=data_notes,
    )

    # Coarse aggregate grid for low zoom levels (z < 16). Pure post-processing
    # of the already computed scores, no spatial joins.
    hex_agg = aggregate_hexagons(hex_proj)

    set_progress(conn, job_id, 92, f"{SCORING_STEP_COUNT}/{SCORING_STEP_COUNT} · {SCORING_STEPS[-1]}")
    hex_count, veg_count, _carriageway_count = write_results(
        engine, conn, run_id, hex_proj, vegetation, carriageways, hex_agg=hex_agg
    )
    del hex_proj, hex_agg, vegetation, carriageways, sealing_carriageways
    gc.collect()
    set_progress(conn, job_id, 100, "Fertig")

    _save_data_notes(conn, run_id, data_notes)
    run_status = "COMPLETE" if hex_count > 0 else "EMPTY"
    with conn.cursor() as cur:
        cur.execute(
            'UPDATE prisma."SpaceFinderRun" SET status=%s, "hexCount"=%s, "vegCount"=%s, "cirAttribution"=%s WHERE id=%s',
            (run_status, hex_count, veg_count, cir_source.attribution if cir_source else None, run_id),
        )
        cur.execute(
            'UPDATE prisma."SpaceFinderVariant" SET "currentRunId"=%s, "updatedAt"=now() WHERE id=%s',
            (run_id, variant_id),
        )
        cur.execute(
            """UPDATE prisma."SpaceFinderJob"
               SET status='DONE', "resultRunId"=%s, "finishedAt"=now(), "updatedAt"=now()
               WHERE id=%s""",
            (run_id, job_id),
        )
    print(f"=== Job {job_id} DONE (run_id={run_id}) ===")


def _save_data_notes(conn, run_id: int, data_notes: list[dict]) -> None:
    """Stores the run's data notes (NULL when there are none). Kept separate so a
    database without the migrated column only loses the notes, not the run."""
    if data_notes:
        print(f"   ℹ️  Data notes: {data_notes}")
    try:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE prisma."SpaceFinderRun" SET "dataNotes"=%s WHERE id=%s',
                (Jsonb(data_notes) if data_notes else None, run_id),
            )
    except Exception as e:
        print(f"   ⚠️  Could not save data notes: {e}")


def fail_job(conn, job_id: int, message: str):
    try:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE prisma."SpaceFinderJob"
                   SET status='FAILED', "errorMessage"=%s, "finishedAt"=now(), "updatedAt"=now()
                   WHERE id=%s""",
                (message[:2000], job_id),
            )
    except Exception as e:
        print(f"   ⚠️  Could not mark job {job_id} as FAILED: {e}")


def drain(conn, engine):
    """Process all currently queued jobs until none are left."""
    while True:
        row = claim_job(conn)
        if row is None:
            return
        job_id, variant_id = row
        try:
            process_job(conn, engine, job_id, variant_id)
        except Exception:
            tb = traceback.format_exc()
            print(f"   ✗ Job {job_id} failed:\n{tb}", file=sys.stderr)
            fail_job(conn, job_id, tb)


def main():
    print("🛠️  space-finder-worker starting...")
    conn = db.connect()
    engine = db.make_engine()
    db.apply_schema(conn)
    requeue_stale(conn)

    conn.execute(f"LISTEN {CHANNEL}")
    print(f"   👂 LISTEN {CHANNEL} (poll fallback {POLL_SECONDS}s)")

    drain(conn, engine)  # jobs that may already be waiting

    while True:
        # select() on the connection socket: wakes up on pg_notify or after
        # POLL_SECONDS. More reliable than conn.notifies(timeout=…), which in
        # psycopg3 3.3.x hangs internally in futex_do_wait and passes on neither
        # NOTIFY nor the timeout correctly.
        try:
            _select.select([conn.fileno()], [], [], POLL_SECONDS)
        except Exception:
            pass
        drain(conn, engine)


if __name__ == "__main__":
    main()

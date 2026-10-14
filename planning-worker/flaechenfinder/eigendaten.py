"""Eigene Daten: mehrere hochgeladene Datensätze zu einem Score-Beitrag verrechnen.

Jeder Datensatz `{id, name, mode, geojson}` liefert je Hexagon eine Distanz zur (gepufferten)
Geometrie (NaN = kein Datensatz / keine Objekte). Der Modus des Datensatzes bestimmt die Wirkung:

  bonus / penalty   → voller Zu-/Abschlag innerhalb, 0 außerhalb; Stärke = eigendaten_weights[id] × 100
  exclude_inside    → Hexagon innerhalb → mce = 0
  exclude_outside   → Hexagon außerhalb → mce = 0 (Maske für erlaubte Zonen)

Mehrere Datensätze addieren ihre Zu-/Abschläge und verknüpfen ihre Ausschlüsse mit ODER.
Als reine Funktion ohne Geodaten-Abhängigkeiten getrennt vom Scorer, damit sie einzeln
testbar ist.
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd


def combine_eigendaten(
    datasets: list[dict],
    distances: dict[str, pd.Series],
    eigendaten_weights: dict | None,
    index: pd.Index,
):
    """Verrechnet alle Datensätze.

    Returns ``(score, delta, exclude, details)``:
      score   – Serie, Summe der weichen Effekte in Punkten (gerundet); NaN überall, wenn kein
                weicher Datensatz wirkt (Gewicht 0 / Ausschluss-Modus / keine Daten)
      delta   – Serie derselben Summe (0 statt NaN) zum Aufaddieren auf den Gesamtscore
      exclude – bool-Serie, True wo ein Ausschluss-Datensatz das Hexagon ausschließt
      details – Serie mit JSON-Text je betroffenem Hexagon (sonst None), z. B.
                ``[{"id":"a","p":12.5},{"id":"b","x":1}]`` (p = Punkte, x = ausgeschlossen)
    """
    weights = eigendaten_weights or {}
    delta = pd.Series(0.0, index=index)
    exclude = pd.Series(False, index=index)
    soft_active = False
    contributions: list[tuple[str, str, np.ndarray, np.ndarray]] = []

    for dataset in datasets:
        ds_id = dataset["id"]
        mode = dataset.get("mode", "bonus")
        dist = distances.get(ds_id)
        if dist is None or not dist.notna().any():
            continue
        inside = dist.notna() & (dist <= 0)

        if mode == "exclude_inside":
            hit = inside
        elif mode == "exclude_outside":
            hit = dist.notna() & ~inside
        elif mode in ("bonus", "penalty"):
            strength = weights.get(ds_id, 0) or 0
            if strength <= 0:
                continue
            sign = 1.0 if mode == "bonus" else -1.0
            effect = sign * strength * 100.0 * inside.astype(float)
            delta = delta + effect
            soft_active = True
            contributions.append((ds_id, "p", effect.to_numpy(), inside.to_numpy()))
            continue
        else:
            continue

        exclude = exclude | hit
        contributions.append((ds_id, "x", np.ones(len(index)), hit.to_numpy()))

    score = delta.round(1) if soft_active else pd.Series(np.nan, index=index)

    rows: list[list[dict] | None] = [None] * len(index)
    for ds_id, kind, values, mask in contributions:
        for i in np.flatnonzero(mask):
            entry = {"id": ds_id, kind: round(float(values[i]), 1) if kind == "p" else 1}
            if rows[i] is None:
                rows[i] = [entry]
            else:
                rows[i].append(entry)
    details = pd.Series(
        [json.dumps(row, separators=(",", ":")) if row else None for row in rows],
        index=index,
        dtype=object,
    )
    return score, delta, exclude, details

"""Eigene Daten: combine several uploaded datasets into one score contribution.

Each dataset `{id, name, mode, geojson}` yields a distance per hexagon to the (buffered)
geometry (NaN = no dataset / no objects). The dataset's mode determines the effect:

  bonus / penalty   → full bonus/penalty inside, 0 outside; strength = eigendaten_weights[id] × 100
  exclude_inside    → hexagon inside → mce = 0
  exclude_outside   → hexagon outside → mce = 0 (mask for allowed zones)

Multiple datasets add up their bonuses/penalties and combine their exclusions with OR.
Kept separate from the scorer as a pure function without geodata dependencies so it can be
tested on its own.
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
    """Combine all datasets.

    Returns ``(score, delta, exclude, details)``:
      score   – series, sum of the soft effects in points (rounded); NaN everywhere if no
                soft dataset applies (weight 0 / exclusion mode / no data)
      delta   – series of the same sum (0 instead of NaN) to add to the total score
      exclude – bool series, True where an exclusion dataset excludes the hexagon
      details – series with JSON text per affected hexagon (else None), e.g.
                ``[{"id":"a","p":12.5},{"id":"b","x":1}]`` (p = points, x = excluded)
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

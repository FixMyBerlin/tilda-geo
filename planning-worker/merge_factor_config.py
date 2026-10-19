"""Mirror of `app/src/server/planning/mergeFactorConfig.ts`.

Fallback 30 must match `UseCaseConfig.bewohnerbedarf_saettigung_ew` in
`flaechenfinder/config.py` and `FALLBACK_SAETTIGUNG_EW` in the TS file.
"""

# Mirror of FALLBACK_SAETTIGUNG_EW in mergeFactorConfig.ts / default in config.py.
FALLBACK_SAETTIGUNG_EW = 30


def merge_factor_config(variant_cfg: dict, area_row: dict) -> dict:
    """Merge variant JSON with area fields incl. census saturation.

    Same semantics as `mergeFactorConfig` (TS): if the variant lacks
    `bewohnerbedarf_saettigung_ew`, `censusSaettigungEw` applies, otherwise fallback 30.
    """
    suggestion = area_row.get("censusSaettigungEw")
    stored = variant_cfg.get("bewohnerbedarf_saettigung_ew")
    is_auto = stored is None and suggestion is not None
    if stored is not None:
        saettigung = stored
    elif suggestion is not None:
        saettigung = suggestion
    else:
        saettigung = FALLBACK_SAETTIGUNG_EW

    merged = dict(variant_cfg)
    merged["bewohnerbedarf_saettigung_ew"] = saettigung
    merged["bewohnerbedarf_saettigung_auto"] = is_auto
    merged["bewohnerbedarf_saettigung_auto_ew"] = suggestion
    merged["bewohnerbedarf_ew_pro_ha"] = area_row.get("censusEwPerHa")
    merged["study_area"] = area_row["studyArea"]
    merged["use_case"] = area_row["useCase"]
    merged["area_size_m2"] = area_row.get("areaSizeM2")
    # The area always wins: no dataset in the area = none in the merge.
    user_datasets = area_row.get("userDatasets") or []
    if user_datasets:
        merged["user_datasets"] = user_datasets
    else:
        merged.pop("user_datasets", None)
    return merged

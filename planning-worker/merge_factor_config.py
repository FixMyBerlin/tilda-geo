"""Spiegel von `app/src/server/planning/mergeFactorConfig.ts`.

Fallback 30 muss `UseCaseConfig.bewohnerbedarf_saettigung_ew` in
`flaechenfinder/config.py` und `FALLBACK_SAETTIGUNG_EW` in der TS-Datei entsprechen.
"""

# Spiegel von FALLBACK_SAETTIGUNG_EW in mergeFactorConfig.ts / Default in config.py.
FALLBACK_SAETTIGUNG_EW = 30


def merge_factor_config(variant_cfg: dict, area_row: dict) -> dict:
    """Merged Varianten-JSON mit Gebietsfeldern inkl. Zensus-Sättigung.

    Semantik 1:1 zu `mergeFactorConfig` (TS): fehlt `bewohnerbedarf_saettigung_ew`
    in der Variante, gilt `censusSaettigungEw`, sonst Fallback 30.
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
    if area_row.get("userGeojson") is not None:
        merged["user_geojson"] = area_row["userGeojson"]
    if area_row.get("userGeojsonMode") is not None:
        merged["user_geojson_mode"] = area_row["userGeojsonMode"]
    return merged

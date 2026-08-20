# `census_population_point`

Germany-wide census population at representation points (addresses / building centroids / grid midpoints).

This folder holds `spec.yaml` and a **symlink** to the GeoPackage — the file is not copied.

- Repo: https://github.com/FixMyBerlin/census-building-disaggregation
- Folder: `bevoelkerungsmodell/data/output/`
- File: `population_de.gpkg` (layer `population`)

How to regenerate the GPKG is in that repository’s README (`python -m bevoelkerungsmodell.run_de_population`).

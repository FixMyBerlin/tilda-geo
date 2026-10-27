"""Flächenfinder – multi-criteria evaluation for site assessment.

Integrated as a module into tilda-geo. Compared to the original standalone
flaechenfinder repo, the I/O ends were swapped:
  - Inputs: PostGIS (TILDA's `public` schema) instead of a local OSM PBF (see postgis_loader.py)
  - Outputs: PostGIS `planning` schema instead of GeoPackage (see ../results.py)

The core scoring logic (scorer.run_flaechenfinder) keeps its methodology; it
returns the computed GeoDataFrames instead of writing files.
"""

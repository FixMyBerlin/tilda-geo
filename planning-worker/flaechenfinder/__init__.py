"""Flächenfinder – Multi-Criteria-Evaluation für Potentialflächen.

Integriert als Modul in tilda-geo. Gegenüber dem ursprünglichen, eigenständigen
flaechenfinder-Repo wurden die I/O-Enden getauscht:
  - Inputs: PostGIS (tildas `public`-Schema) statt lokalem OSM-PBF (siehe postgis_loader.py)
  - Outputs: PostGIS `planning`-Schema statt GeoPackage (siehe ../results.py)

Die Kern-Scoring-Logik (scorer.run_flaechenfinder) ist unverändert in ihrer
Methodik; sie gibt die berechneten GeoDataFrames zurück, statt Dateien zu schreiben.
"""

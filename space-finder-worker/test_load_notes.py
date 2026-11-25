"""Every PostGIS loader turns a failed query or a missing table into an empty result
plus a run-level data note; a query that finds no rows adds no note. Runs without a
database: `read_postgis` and the table check are mocked."""

import unittest
from unittest import mock

import geopandas as gpd
import pandas as pd
from shapely.geometry import box

from scoring.postgis_loader import PostgisLoader

AREA = box(13.40, 52.50, 13.41, 52.51)


def _fails(*_args, **_kwargs):
    raise RuntimeError('column "category" does not exist')


def _no_rows(*_args, **_kwargs):
    return gpd.GeoDataFrame({"category": []}, geometry=[], crs="EPSG:4326").rename_geometry("geom")


def _run(loader_call, read_postgis, table_exists=True):
    """Runs one loader call and returns (result, notes)."""
    loader = PostgisLoader(engine=None)
    exists = pd.DataFrame({"ok": [table_exists]})
    with (
        mock.patch("scoring.postgis_loader.gpd.read_postgis", side_effect=read_postgis),
        mock.patch("scoring.postgis_loader.pd.read_sql", return_value=exists),
    ):
        result = loader_call(loader)
    return result, loader.data_notes


LOADERS = {
    "gebaeude": lambda l: l.load_buildings(AREA),
    "radwege": lambda l: l.load_cycleways(AREA),
    "kfz_parken": lambda l: l.load_car_parking(AREA),
    "versiegelung": lambda l: l.load_sealing_surfaces(AREA),
}


class LoadNotesTest(unittest.TestCase):
    def test_failed_query_notes_the_source(self):
        for source, call in LOADERS.items():
            with self.subTest(source=source):
                result, notes = _run(call, _fails, table_exists=True)
                self.assertEqual(notes, [{"factor": source, "reason": "abfrage_fehlgeschlagen"}])
                if source == "versiegelung":
                    self.assertIsNone(result)
                else:
                    self.assertEqual(len(result), 0)

    def test_missing_table_is_noted_as_such(self):
        for source, call in LOADERS.items():
            with self.subTest(source=source):
                _result, notes = _run(call, _fails, table_exists=False)
                self.assertEqual(notes, [{"factor": source, "reason": "tabelle_fehlt"}])

    def test_no_rows_adds_no_note(self):
        for source, call in LOADERS.items():
            with self.subTest(source=source):
                result, notes = _run(call, _no_rows)
                self.assertEqual(len(result), 0)
                self.assertEqual(notes, [])

    def test_same_source_is_noted_once(self):
        def both(loader):
            loader.load_buildings(AREA)
            loader.load_buildings(AREA)

        _result, notes = _run(both, _fails)
        self.assertEqual(notes, [{"factor": "gebaeude", "reason": "abfrage_fehlgeschlagen"}])

    def test_failed_table_check_counts_as_failed_query(self):
        loader = PostgisLoader(engine=None)
        with (
            mock.patch("scoring.postgis_loader.gpd.read_postgis", side_effect=_fails),
            mock.patch("scoring.postgis_loader.pd.read_sql", side_effect=RuntimeError("db down")),
        ):
            loader.load_buildings(AREA)
        self.assertEqual(loader.data_notes, [{"factor": "gebaeude", "reason": "abfrage_fehlgeschlagen"}])

    def test_tables_serving_several_factors_name_the_factor(self):
        cases = {
            "oepnv": lambda l: l.load_subway_entrances(AREA),
            "bikesharing": lambda l: l.load_bikesharing(AREA),
            "tempo30": lambda l: l.load_tempo30_roads(AREA),
        }
        for source, call in cases.items():
            with self.subTest(source=source):
                _result, notes = _run(call, _fails)
                self.assertEqual(notes, [{"factor": source, "reason": "abfrage_fehlgeschlagen"}])

    def test_notes_go_to_the_run_list_given_by_the_worker(self):
        run_notes = [{"factor": "vegetation", "reason": "keine_luftbildquelle"}]
        loader = PostgisLoader(engine=None, data_notes=run_notes)
        with (
            mock.patch("scoring.postgis_loader.gpd.read_postgis", side_effect=_fails),
            mock.patch("scoring.postgis_loader.pd.read_sql", return_value=pd.DataFrame({"ok": [True]})),
        ):
            loader.load_buildings(AREA)
        loader.add_data_note("fahrbahnen", "berechnung_fehlgeschlagen")
        loader.add_data_note("fahrbahnen", "berechnung_fehlgeschlagen")
        self.assertEqual(
            run_notes,
            [
                {"factor": "vegetation", "reason": "keine_luftbildquelle"},
                {"factor": "gebaeude", "reason": "abfrage_fehlgeschlagen"},
                {"factor": "fahrbahnen", "reason": "berechnung_fehlgeschlagen"},
            ],
        )


if __name__ == "__main__":
    unittest.main()

# Measure: how much of a dataset lies inside an area

QA, Statistik and Summieren ask the same question: **how much of X lies inside area A, split by a
tag?** They differ only in who supplies the areas.

|           | Areas                 | Runs        | Code                                                          |
| --------- | --------------------- | ----------- | ------------------------------------------------------------- |
| QA        | cells of a `QaConfig` | nightly     | `processing/qa/qa_functions.sql`, the `*_qa_*.sql` of a topic |
| Statistik | Bundesländer, Kreise  | nightly     | `processing/steps/afterthoughts/sql/aggregate_lengths.sql`    |
| Summieren | drawn by the user     | per request | `app/src/server/calculator/`                                  |

All three use the functions in
[`processing/measure/measure_functions.sql`](../processing/measure/measure_functions.sql).

## The rule

Every feature keeps its own geometry and carries amounts (numeric tags). An area gets the share of
the feature that lies inside it (`tilda_measure_share`):

| Feature | Share inside an area | Example                                                        |
| ------- | -------------------- | -------------------------------------------------------------- |
| Point   | all or nothing       | a bike stand with `capacity` 6                                 |
| Line    | by length            | a bikelane with `length` 240; a parking line with `capacity` 7 |
| Area    | by area              | a parking lot with `capacity` 120                              |

A caller sums `share × amount`. Nothing is converted into points.

Summieren does that in `tilda_measure_sum`: the amounts of one or more datasets inside the drawn
areas, grouped by tag values. The app only passes the dataset names, the areas and the tags.

## Datasets

`tilda_measure_<dataset>(extent)` returns the features of a dataset. It is the one place that says
which tables a dataset reads.

| Dataset           | Part → table                                                             | Amounts                                |
| ----------------- | ------------------------------------------------------------------------ | -------------------------------------- |
| `parking`         | `street` → `parkings` (lines), `off_street` → `off_street_parking_areas` | `capacity`, `area`                     |
| `bikelanes`       | `bikelanes` → `bikelanes`                                                | `length`, `length_directions` (meters) |
| `roads`           | `roads` → `roads`, `paths` → `roadsPathClasses`                          | `length`, `length_directions` (meters) |
| `bicycle_parking` | `points` → `bicycleParking_points` (without `kind=mobility_hub`)         | `capacity`, `objects`                  |

A new dataset is one more function. Callers add what is theirs: QA filters parking
by `operator_type` and moves bikelanes to their street side; Summieren groups by the tags of its
panel.

`objects` is one per feature (`1` on every row of `bicycle_parking`). A bicycle parking without
`capacity` in OSM has no stands to count: it adds to `objects` only, nothing is assumed for its
stands. Summieren shows how many objects have no value for a sum.

`length_directions` is the length per direction of travel: the `length` of a oneway (`oneway` is
`yes`, `implicit_yes` or `yes_dual_carriageway`), twice the `length` of every other line. Statistik
and Summieren sum this amount, so a street with both directions counts like two oneways. QA
compares the plain `length`.

## Whole things and fractions

Whether something is a parking space is decided once, when the feature is processed: every parking
line and every parking lot gets a whole-numbered `capacity`. Measuring never decides that again. It
only says how much of the feature is inside the area.

So a line with 7 spaces that lies 40 % inside an area adds 2.8 spaces. The spaces are assumed to
be spread evenly along the line (over the area for a lot). Consequences:

- Sums can be fractional. Compare unrounded, round only for display.
- Over areas that do not overlap, the shares of a feature add up to exactly its amount: nothing
  is lost or counted twice at a border.
- A feature exactly on a shared border is the one exception: a point there counts for both areas.

## Coordinates

The share is a ratio, so the tables' own EPSG:3857 is fine for it. QA works in EPSG:5243 because
it moves bikelanes sideways by meters before measuring.

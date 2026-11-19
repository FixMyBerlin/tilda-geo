# QA cells: street-based Voronoi vs. a regular grid

What a QA cell is, why it is shaped the way it is, and what it would take to generate our own.

## Contents

- [Why street-based cells](#why-street-based-cells)
- [Cells today: external input, taken as-is](#cells-today-external-input-taken-as-is)
- [Self-generated cells (later)](#self-generated-cells-later)

## Why street-based cells

Both QA datasets hang on the street network — parking spaces and bikelanes are attached to a road
side — which is also TILDA's primary data structure (`roads`, `bikelanes` with an `offset` from
the centerline, `parkings` per road side). A street-based cell (junction to junction, one side) is
a review unit a human understands ("this block side of Hauptstraße"), it contains whole features
instead of cutting them, and a change inside it is a change to one street section.

| Cell shape                          | Pro                                                                                                                                                                            | Con                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Street-based Voronoi (what we have) | Aligned with the data; meaningful review unit; features lie mostly inside one cell, so measuring them per cell is robust; already exists for Berlin with freeze/import tooling | Cell size follows the street network, so cells in parks and forests are huge; externally provided, so it cannot be regenerated for other regions; ids are tied to the provider |
| Regular grid (square/hex)           | Trivial to generate anywhere (`ST_SquareGrid` / `ST_HexagonGrid`; `h3-pg` is not available on our managed Postgres); uniform size                                              | No relation to streets; features straddle cells; a way split or a small geometry edit near a grid line moves length between cells for no real reason; poor review unit         |

Decision: street-based cells are the model. A regular grid is only a fallback if self-generating
street cells (below) proves too expensive.

A line that crosses a cell border counts in each cell with the share of its length that lies
inside ([Measure.md](Measure.md)), so a way split in OSM moves nothing between cells. On a regular
grid a small geometry edit near a grid line would still move length between cells.

## Cells today: external input, taken as-is

Cells are a **static, externally provided** dataset, imported via
[`add-db-data-table`](../.agents/skills/add-db-data-table/SKILL.md) into a `data.*` table
(today the eUVM street cells of Berlin: `data.euvm_qa_2026_cells_innenstadt` with 11,084 cells and
`data.euvm_qa_2026_cells_aussenstadt` with 23,571, built from the cells eUVM delivered in July 2025,
`data.euvm_qa_2025_cells`).
Processing takes them as-is: it does not split, merge, or repair cells. If cells in parks or
forests turn out too large for a bikelanes review, the fix is an improved input dataset from the
provider, not SQL on our side.

The cell table only needs `id` (stable text) and `geom` (valid MultiPolygon); `name` is optional.
**One table per cell set**: a config checks every cell of its `areaTable`, there is no column that
picks a subset. Two configs on different parts of a city (Innenstadt and Außenstadt, or two
networks) get two tables. Within one table the cells must not overlap; two tables may. Reference
**values** do not live in the cell table — they live in a separate long-format `data.*` reference
table per config, computed at freeze time (see
[QA-Documentation.md §6](QA-Documentation.md#6-reference-table) and the
[QA-Freeze.md](QA-Freeze.md)). A cell table can therefore be reused across
datasets. A reference table is keyed by cell id, so one reference can serve several cell
tables with the same ids (`data.euvm_qa_2026_reference` serves Innenstadt and Außenstadt).
The cell tables are built in the project folders, not here: eUVM parking in
[FMC/scripts `tilda-parkraum-euvm/tilda-qa/`](https://github.com/FixMyBerlin/scripts/tree/main/tilda-parkraum-euvm/tilda-qa) (clip to Berlin, straighten the borders, one
table each for Innenstadt and Außenstadt), infraVelo in
[infravelo-radnetz `tilda-qa/`](https://github.com/FixMyBerlin/infravelo-radnetz/tree/main/tilda-qa). Table names follow
`<owner>_qa_<date>_<cells|reference>[_<part>]`. See [QA-Freeze.md](QA-Freeze.md).

Cells along a network: the bikelanes QA of infraVelo on the Radvorrangnetz uses
`data.infravelo_qa_2026_cells_rvn`, one cell per network edge, the strip up to 25 m on each side,
split between neighbouring edges by the nearest edge. Only ways along the network count, not
parallel ways off it. A further network (REN+) or one district delivery gets its own table, e.g.
`data.infravelo_qa_2026_12_01_cells_ren_bezirk07`.

## Self-generated cells (later)

**Not built.** This is future work, listed here so the path is clear if another region or a
Germany-wide rollout needs its own street cells.

TILDA's parking topic already builds one linestring per street chain between graph vertices
(nodes with degree ≠ 2) for its own purposes — the same kind of seed geometry a street-based
Voronoi needs. Generalizing that to a shared "edges" step and building cells from it would take:

- **Network**: today's chain-building (on a branch not yet merged into this worktree) only covers
  roads with parking. Bikelanes would need the same chain logic run over `roads` + the path-class
  roads (cycleways, paths); the vertex-finding step this would build on already exists for the
  parking road network
  ([`processing/topics/parking/roads/1_find_intersections.sql`](../processing/topics/parking/roads/1_find_intersections.sql)).
  Per-side cells (as the eUVM cells have) come from splitting each edge's cell along the edge line.
- **Voronoi**: densify each edge every ~10 m, `ST_VoronoiPolygons` on the seeds, assign each
  polygon back to its seed's edge, `ST_Union` per edge (and per side), clip to the administrative
  boundary. Germany-wide this has to run in chunks (e.g. 10 km tiles with overlap) — `ST_VoronoiPolygons`
  over tens of millions of seeds does not run in one call.
- **Stability**: cell ids change whenever OSM gains or loses a junction. Cells would have to be
  frozen with the reference at each freeze, exactly like today's externally provided cells — self
  -generating them does not remove that step, it only removes the dependency on a provider.

Honest effort estimate: a processing project of its own, on the order of **1–2 weeks including
validation** — not something to fold into a customer delivery. If the chunked Voronoi turns out too
slow or unstable in practice, the documented fallback is `ST_HexagonGrid` (e.g. 150 m) per region:
same output contract (`id`, `geom`), same downstream code, a worse review unit (see the grid row
in the table above).

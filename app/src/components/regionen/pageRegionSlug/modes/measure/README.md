# Messen mode

Measure lengths and areas on the map at `/regionen/$regionSlug/messen`. Open to everyone, in
every region. Nothing is stored: the measurements live in the URL, so a measurement is shared
by its link.

Built like the Summieren mode (`../calculator/`); read that first.

## State

One URL param, `measure` (`measureModeParam.ts`):

| Field   | Content                                                                        |
| ------- | ------------------------------------------------------------------------------ |
| `lines` | The measured lines as one GeoJSON `LineString` / `MultiLineString`             |
| `areas` | The measured areas as one GeoJSON `Polygon` / `MultiPolygon`, like `sum.areas` |
| `bg`    | A background picked by hand while measuring                                    |

- Coordinates have 6 decimals (`MEASURE_PRECISION`, about 10 cm).
- Ids follow the position per kind (`line-0`, `area-0`), so a shape read back from the URL keeps
  its id.
- The shapes stay in the URL in other modes.

## Undo and redo

One history for all lines and areas together (`createDrawHistory()` in
`drawing/useMeasureDraw.ts`, buttons in the shared `ModeMapUndoRedo`): a step back undoes the
last change, whichever shape it was made on, including a deleted measurement. The steps are kept
in memory and are gone after a reload.

## Take-over with Summieren

`../modeSwitcherSearch.ts`: a switch from Summieren to Messen copies `sum.areas` to
`measure.areas` when Messen has no areas, and the other way round (rounded to the 5 decimals of
Summieren). It is a copy at the moment of the switch; lines are never copied.

## Aerial image

Measuring needs an aerial image, so the mode has its own background and leaves `bg` alone
(`hooks/useQueryState/useBackgroundParam.ts`):

1. `measure.bg`, when one was picked in the background selector while measuring.
2. Otherwise the best aerial for the map center (`utils/pickAerialBackground.ts`): among the
   backgrounds the region offers, local before worldwide, then recommended by the Editor Layer
   Index, newest, sharpest.
3. Without one in the region's list: a worldwide aerial (Maptiler, Mapbox, Esri).

The metadata (`category`, `best`, `endDate`, `bbox`) comes from `scripts/ELILayers/process.ts`
for the Editor Layer Index layers and is set by hand in `sourcesBackgroundsRasterTILDA.ts`.

## Loupe

`<DrawLoupe>` of `@osm-editor-kit/react-map-gl-draw` shows the corner that is being placed or
dragged, enlarged, with a crosshair on the point that is stored. It shows the same background as
the map and so requests its own tiles at a high zoom (the Maptiler and Mapbox tiles are billed).
Hidden below map zoom 15.

## Files

- `PageModeMeasure.tsx`: the panel (one row per measurement, totals, background line).
- `MeasurePanelActions.tsx`: "+ Linie", "+ Fläche", help.
- `MeasureMap.tsx`, `drawing/`: drawing surface, labels on the map, toolbar while drawing, loupe.
- `utils/measureMath.ts`: lengths, areas, German number formatting.

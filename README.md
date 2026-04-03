<div align="center">
  <img src="app/src/app/_components/layouts/assets/tilda-logo.png" height="80" />
  <h1 align="center"><a href="https://tilda-geo.de/">TILDA</a></h1>
</div>

# About

**TILDA** (previously _Radverkehrsatlas_) makes **bicycle infrastructure** and related data from [**OpenStreetMap** (OSM)](https://www.openstreetmap.org) easily accessible. The OSM data is processed and visualized in various map views.

**Core use cases:**

- Plan bicycle networks using POI and infrastructure data from OpenStreetMap, along with region-specific datasets (both private and public).
- Work with street-side parking data sourced from OpenStreetMap.
- Showcase data relevant for urban planning to support local planning efforts.

**Core features:**

- Display different data layers in a web GIS.
- Provide feedback to the OpenStreetMap community through OSM Notes.
- Collect internal notes and discuss them with regional stakeholders.
- Process OpenStreetMap data to normalize and sanitize it for easy use in the daily work of administrative staff.
- Gather feedback on potential mapping issues to improve OpenStreetMap data.

Please [contact FixMyCity GmbH to learn more](https://www.fixmycity.de/tilda).

# Development

This project has two main components:

- **[`app`](./app) Frontend and ORM** – The NextJS/BlitzJS app that handles the frontend, API, and exports.
- **[`processing`](./processing) OpenStreetMap Data Processing and Tileserver** – The osm2pgsql-based processing of OSM data, along with the Tileserver and caching.

Please follow the setup instructions in these subfolders to run the project.

For Docker (multiple local checkouts, compose files, deploy vs dev env), see [`docs/docker-local-development.md`](./docs/docker-local-development.md).

## License

This project is [licensed under the AGPL-3.0](./LICENSE.md).

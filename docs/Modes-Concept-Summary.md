# Region modes: concept summary

User-facing overview of TILDA region modes: why they exist, the shared UX, and what each mode is for. Tracking: [private-issues#3134 (comment)](https://github.com/FixMyBerlin/private-issues/issues/3134#issuecomment-5130056823). URL mechanics: [Modes-URL-State-Contract-And-Optimizations.md](./Modes-URL-State-Contract-And-Optimizations.md).

## Purpose

Explain the product shape of Hinweise, Qualitätssicherung, and Prüflisten for reviewers and future maintainers — not the implementation history.

## Why modes?

A region used to have one map page. Notes, quality assurance, the parking calculator, and similar tools were switched on inside that view. That layout does not scale.

Modes are extra pages per region that reuse the same central map and reconfigure the UI around it. They appear in the main navigation when the region has the underlying data (notes flags, QA configs, review lists). Members/admins can open Prüflisten before the first list exists, so they can create one.

| Mode               | URL                              |
| ------------------ | -------------------------------- |
| Map (default)      | `/regionen/<region>`             |
| Hinweise           | `/regionen/<region>/hinweise`    |
| Qualitätssicherung | `/regionen/<region>/qa`          |
| Prüflisten         | `/regionen/<region>/prueflisten` |

## Shared panel layout

Each mode page gets a right panel beside the map (`ModePanel`): heading, a collection selector (QA config / Prüfliste; read-only for Hinweise), a filter bar (search, chips/status, “only current map view” vs “all”), and a list of compact previews. On desktop the panel sits on the map’s right edge and is resizable.

The existing right inspector still shows the selected feature. Hovering a list row places a mode-accent ring on the map (edge-clamped when off-screen). Clicking the map or a row selects via the shared `f` param, scrolls the row into view, and opens details. Hover alone does not select.

Switching modes keeps map position and layer configuration. Mode-specific filters live in that mode’s URL object and come back when you return. Modes add state on top of the shared map; they do not each get a full map configuration.

| Feature            | On default map?                                                     | Dedicated mode?                           |
| ------------------ | ------------------------------------------------------------------- | ----------------------------------------- |
| Hinweise           | Inspector “new note” tools navigate into the mode; no note markers  | Yes. One list for the region’s notes kind |
| Qualitätssicherung | No                                                                  | Yes only                                  |
| Prüflisten         | No                                                                  | Yes only                                  |
| Calculator         | Yes. Drawing + totals on the map; “Summieren: …” in the category UI | No. Not a region mode                     |

## Hinweise (notes)

Lists the region’s one notes kind — OSM **or** TILDA internal notes, not both (`regionWriteSchema` rejects enabling both). Search, extent, and chip filters live in `notesMode`. There are no folders. Note pins render only in this mode. From the default-map inspector, “new note” tools still jump here (`osmNote` / `internalNote` compose params).

OSM notes are public; internal notes are member-only. Hinweise is member-only when the region has only internal notes.

## Qualitätssicherung (QA)

Dedicated `/qa` mode: pick a QA configuration, filter by status / users / search / extent, work through the area list; details stay in the inspector. QA layers and the old category/dialog entry points are gone from the default map. Bookmarks that still carried legacy QA query params are steered toward `/qa`.

## Prüflisten (review lists)

GeoJSON lists of candidates to check (points, lines, polygons, including Multi\*): pick a list, browse entries, set status, comment. Lists are stored in the database, can be assigned to several regions, and support upload/download. Users can draw new entries (point / line / polygon) and edit existing geometry; source is tracked as upload vs manual.

UI naming is **Prüfliste / Prüfeintrag**. Status/comments exist; a richer evaluation workflow is still placeholder-level by design. Admin surface: `/admin/review-lists`.

## Calculator (not a mode)

The summing tool (today: parking) stays on the default map. Drawing controls and totals mount with `<Calculator>` on `RegionMap`. “Summieren: …” subcategories stay in the category UI. There is no `/rechner` route and no Rechner entry in the mode switcher.

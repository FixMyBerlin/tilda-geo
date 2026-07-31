# Regional Masks

Regional masks dim the map outside a region's OSM relation boundary. They are **system-layer** `MapDatasetUpload` rows (slug `region-{regionSlug}`) served at `/api/uploads/region-{slug}.geojson`.

## Admin workflow (two steps)

Mask config in the DB (`Region.maskOsmRelationIds`, `Region.maskBufferKm`) and the map upload (`MapDatasetUpload` + S3 GeoJSON) are updated separately.

1. Open **Admin → Regionen → {region} bearbeiten**
2. In the **Maske** section, set **Maske aktiv**, **OSM Relation IDs**, and **Buffer (km)**
3. Click **Maske aktualisieren** — validates OSM IDs against the geo DB, transforms the geometry, uploads GeoJSON to S3, and upserts the `MapDatasetUpload` row. Mask config is persisted only after the update succeeds.

**Region speichern** does **not** apply mask field changes on existing regions. Use it for all other region settings; always use **Maske aktualisieren** for mask updates.

To disable a mask, set **Maske aktiv** to **Nein** and click **Maske aktualisieren** (removes config and upload).

### Failure recovery

| Situation                                              | What happened                                           | What to do                                   |
| ------------------------------------------------------ | ------------------------------------------------------- | -------------------------------------------- |
| Bad OSM ID on **Maske aktualisieren**                  | Inline error; DB config and map upload unchanged        | Fix IDs, click **Maske aktualisieren** again |
| Changed mask fields, clicked **Region speichern** only | Other region fields saved; mask config/upload unchanged | Click **Maske aktualisieren**                |
| Map shows old mask after config change                 | Upload not updated yet                                  | Click **Maske aktualisieren**                |

Invalid OSM tokens (e.g. `abc`) are rejected with an error instead of being dropped silently.

## Region delete

Deleting a region via admin also removes its mask `MapDatasetUpload` row and the S3 object (`region-{slug}/mask.geojson`).

## Implementation

| Piece                                   | Location                                                       |
| --------------------------------------- | -------------------------------------------------------------- |
| Transform (buffer + world-minus-region) | `app/src/server/regions/masks/transformRegionMask.server.ts`   |
| Layer styles                            | `app/src/server/regions/masks/regionMaskLayers.const.ts`       |
| Boundary fetch                          | `app/src/server/regions/masks/fetchBoundaryGeometry.server.ts` |
| S3 upload                               | `app/src/server/regions/masks/mapDatasetUploadsS3.server.ts`   |
| Orchestration                           | `app/src/server/regions/masks/generateRegionMask.server.ts`    |
| Admin server fn                         | `generateRegionMaskFn` in `regions.functions.ts`               |
| UI                                      | `RegionMaskForm.tsx` (sibling form on region edit page)        |

Mask parameters are stored on `Region.maskOsmRelationIds` and `Region.maskBufferKm` (default **10 km** when the mask is off); geometry and map packaging are `systemLayer` `MapDatasetUpload` rows updated by admin/server — not StaticDatasets script output.

## Dev seed

Dev-template regions with mask config (`dev-template-parkraum-city`, `dev-template-regional-network`) need **Maske aktualisieren** in admin after `bun run seed` so the map shows masks locally.

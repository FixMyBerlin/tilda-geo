/**
 * File extensions for static-dataset assets served at `GET /api/uploads/:slug`
 * (see `uploads.$slug`). URL builders import this so links match the handler.
 */
export const staticDatasetUploadFormats = ['pmtiles', 'geojson', 'csv'] as const

export type StaticDatasetUploadFormat = (typeof staticDatasetUploadFormats)[number]

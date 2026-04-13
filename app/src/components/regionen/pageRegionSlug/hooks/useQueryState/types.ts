type PointOrBbox =
  | {
      coordinates: [number, number]
    }
  | {
      coordinates: [number, number, number, number]
    }

export type UrlFeature = {
  id: number | string
  sourceId: string
} & PointOrBbox

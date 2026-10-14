import type { FileMapDataSubcategoryStyleLayer } from '../../../types'

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** A layer with just the style information; `wrapSourceLayers` adds source and id. */
export type StyleLayer = DistributiveOmit<
  FileMapDataSubcategoryStyleLayer,
  'source' | 'source-layer'
>

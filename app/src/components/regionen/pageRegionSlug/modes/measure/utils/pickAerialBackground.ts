import type { MapDataBackgroundSource } from '@/components/regionen/pageRegionSlug/mapData/types'

type Source = Pick<
  MapDataBackgroundSource<string>,
  'id' | 'category' | 'best' | 'endDate' | 'bbox' | 'maxzoom'
>

/**
 * Worldwide aerial images that every region may fall back to while measuring, best first.
 * They are used when the region's own backgrounds have no aerial image for the place.
 */
const fallbackAerialBackgroundIds = ['maptiler-satellite', 'mapbox-satellite', 'esri']

const covers = (source: Source, [lng, lat]: [number, number]) => {
  if (!source.bbox) return true
  const [west, south, east, north] = source.bbox
  return lng >= west && lng <= east && lat >= south && lat <= north
}

// Local images (with a coverage) beat worldwide ones: they are the orthophotos of the state
// or city, sharper and better placed than satellite mosaics. Then the one the index
// recommends, the newest (`2025-09` sorts after `2025`), the sharpest.
const compareRank = (a: Source, b: Source) =>
  Number(Boolean(b.bbox)) - Number(Boolean(a.bbox)) ||
  Number(Boolean(b.best)) - Number(Boolean(a.best)) ||
  (b.endDate ?? '').localeCompare(a.endDate ?? '') ||
  (b.maxzoom ?? 0) - (a.maxzoom ?? 0)

/**
 * The aerial image the Messen mode shows by itself at `center`.
 *
 * 1. The best aerial among the backgrounds the region offers (`allowedIds`) whose coverage box
 *    contains the place; see `compareRank`. The box is larger than the real coverage, so a
 *    region should not list an aerial that has no imagery inside the region.
 * 2. Without one: a worldwide aerial (`fallbackAerialBackgroundIds`), also when the region
 *    does not list it. Measuring needs an image.
 */
export const pickAerialBackground = <TSource extends Source>({
  sources,
  allowedIds,
  center,
}: {
  sources: TSource[]
  allowedIds: string[]
  center: [number, number]
}) => {
  const allowed = sources
    .filter(
      (source) =>
        source.category === 'photo' && allowedIds.includes(source.id) && covers(source, center),
    )
    .sort(compareRank)
  return (
    allowed[0] ??
    fallbackAerialBackgroundIds
      .map((id) => sources.find((source) => source.id === id))
      .find((source) => source !== undefined)
  )
}

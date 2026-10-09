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

// Larger is better. Local images (with a coverage) beat worldwide ones: they are the
// orthophotos of the state or city, sharper and better placed than satellite mosaics.
const rank = (source: Source) =>
  [
    source.bbox ? 1 : 0,
    source.best ? 1 : 0,
    Number.parseInt(source.endDate ?? '0', 10) || 0,
    source.maxzoom ?? 0,
  ] as const

const compareRank = (a: Source, b: Source) => {
  const rankA = rank(a)
  const rankB = rank(b)
  for (const [index, value] of rankA.entries()) {
    const other = rankB[index] ?? 0
    if (value !== other) return other - value
  }
  return 0
}

/**
 * The aerial image the Messen mode shows by itself at `center`.
 *
 * 1. The best aerial among the backgrounds the region offers (`allowedIds`): local before
 *    worldwide, then the one the Editor Layer Index recommends, the newest, the sharpest.
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
  if (allowed[0]) return allowed[0]

  for (const id of fallbackAerialBackgroundIds) {
    const source = sources.find((candidate) => candidate.id === id)
    if (source) return source
  }
  return undefined
}

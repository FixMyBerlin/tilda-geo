import type { BackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/backgroundParam.const'
import { useRegionLoaderData } from '@/components/regionen/pageRegionSlug/hooks/useRegionLoaderData'
import { sourcesBackgroundsRaster } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import type { MapDataBackgroundSource } from '@/components/regionen/pageRegionSlug/mapData/types'
import { getAppBaseUrl } from '@/components/shared/utils/getAppBaseUrl'

/**
 * The background maps this viewer can select in the region: the private sources (members only,
 * delivered by the region loader, tiles served by our proxy route) followed by the region's
 * selection from the code catalog.
 */
export const useRegionBackgrounds = () => {
  const { region, privateBackgrounds } = useRegionLoaderData()

  const privateSources = privateBackgrounds.map(
    ({ id, name, attributionHtml, minzoom, maxzoom, tileSize, tilesPath }) => ({
      id,
      name,
      attributionHtml,
      // MapLibre needs absolute tile URLs.
      tilesUrl: getAppBaseUrl(tilesPath),
      minzoom: minzoom ?? undefined,
      maxzoom: maxzoom ?? undefined,
      tileSize,
    }),
  )

  const catalogSources = sourcesBackgroundsRaster.filter((source) =>
    region.backgroundSources.includes(source.id),
  )

  return [...privateSources, ...catalogSources] satisfies MapDataBackgroundSource<BackgroundParam>[]
}

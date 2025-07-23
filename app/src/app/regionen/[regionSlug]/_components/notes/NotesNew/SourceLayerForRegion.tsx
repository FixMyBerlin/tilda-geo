import { useStaticRegion } from '@/src/app/regionen/[regionSlug]/_components/regionUtils/useStaticRegion'
import { RegionSlug } from '@/src/data/regions.const'
import { SourceLayerBikelanes } from './SourceLayerBikelanes'
import { SourceLayerInfravelo } from './SourceLayerInfravelo'
import { SourceLayerRegionBbSg } from './SourceLayerRegionBbSg'

// This is a temporary solution until we know more about which data
// to show for the different "new note" maps.
const sourcePerRegion: Record<RegionSlug & 'default', React.ReactNode> = {
  'bb-sg': <SourceLayerRegionBbSg />,
  infravelo: <SourceLayerInfravelo />,
}

export const SourceLayerForRegion = () => {
  const region = useStaticRegion()

  if (!region) return null
  if (region.slug in sourcePerRegion) {
    return sourcePerRegion[region.slug]
  }

  // Fallback
  return <SourceLayerBikelanes />
}

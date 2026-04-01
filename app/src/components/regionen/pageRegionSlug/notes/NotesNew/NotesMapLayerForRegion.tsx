import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import type { RegionSlug } from '@/data/regions.const'
import { NotesMapLayerBikelanes } from './NotesMapLayerBikelanes'
import { NotesMapLayerRegionBbSg } from './NotesMapLayerRegionBbSg'
import { NotesMapLayerRegionInfravelo } from './NotesMapLayerRegionInfravelo'

// This is a temporary solution until we know more about which data
// to show for the different "new note" maps.
const sourcePerRegion: Record<RegionSlug & 'default', React.ReactNode> = {
  'bb-sg': <NotesMapLayerRegionBbSg />,
  infravelo: <NotesMapLayerRegionInfravelo />,
}

export const NotesMapLayerForRegion = () => {
  const region = useStaticRegion()

  if (!region) return null
  if (region.slug in sourcePerRegion) {
    return sourcePerRegion[region.slug]
  }

  // Fallback
  return <NotesMapLayerBikelanes />
}

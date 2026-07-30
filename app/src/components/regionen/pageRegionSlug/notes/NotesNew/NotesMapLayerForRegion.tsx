import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { NotesMapLayerBikelanes } from './NotesMapLayerBikelanes'
import { NotesMapLayerRegionBbSg } from './NotesMapLayerRegionBbSg'
import { NotesMapLayerRegionInfravelo } from './NotesMapLayerRegionInfravelo'

// This is a temporary solution until we know more about which data
// to show for the different "new note" maps.
const sourcePerRegion: Record<string, React.ReactNode> = {
  'bb-sg': <NotesMapLayerRegionBbSg />,
  infravelo: <NotesMapLayerRegionInfravelo />,
}

export const NotesMapLayerForRegion = () => {
  const region = useRegion()

  if (!region) return null
  if (region.slug in sourcePerRegion) {
    return sourcePerRegion[region.slug]
  }

  // Fallback
  return <NotesMapLayerBikelanes />
}

import { useInitialSizeMeasurement } from '@/components/regionen/pageRegionSlug/hooks/mapState/useInitialSizeMeasurement'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useBreakpoint } from '../utils/useBreakpoint'
import { Categories } from './Categories/Categories'
import { MobileLayerSheet } from './MobileLayerSheet'
import { QaConfigCategories } from './QaConfigs/QaConfigCategories'
import { StaticDatasetCategories } from './StaticDatasets/StaticDatasetCategories'

export const SidebarLayerControls = () => {
  const isSmBreakpointOrAbove = useBreakpoint('sm')
  const { updateSidebarSize } = useMapActions()
  // One-time measurement for initial map-fit visible area (see useInitialSizeMeasurement).
  // Only attached on desktop: on mobile the controls live in a transient bottom
  // sheet that overlays the map rather than reserving layout space.
  const ref = useInitialSizeMeasurement<HTMLDivElement>(updateSidebarSize)

  if (!isSmBreakpointOrAbove) {
    return <MobileLayerSheet />
  }

  return (
    <section
      ref={ref}
      className="absolute top-0 left-0 z-20 max-h-full w-65 overflow-x-visible overflow-y-auto bg-white py-px text-pretty shadow-md"
    >
      <Categories />
      <StaticDatasetCategories />
      <QaConfigCategories />
    </section>
  )
}

import { useInitialSizeMeasurement } from '@/components/regionen/pageRegionSlug/hooks/mapState/useInitialSizeMeasurement'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { Categories } from './Categories/Categories'
import { QaConfigCategories } from './QaConfigs/QaConfigCategories'
import { StaticDatasetCategories } from './StaticDatasets/StaticDatasetCategories'

export const SidebarLayerControls = () => {
  const isSmBreakpointOrAbove = useBreakpoint('sm')
  const { updateSidebarSize } = useMapActions()
  // One-time measurement for initial map-fit visible area (see useInitialSizeMeasurement).
  // Only attached on desktop: on mobile the controls live in the MobileMapHeader
  // (layer bottom sheet) which overlays the map rather than reserving layout space.
  const ref = useInitialSizeMeasurement<HTMLDivElement>(updateSidebarSize)

  // On mobile the layer controls are rendered via MobileMapHeader → MobileLayerButton.
  if (!isSmBreakpointOrAbove) {
    return null
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

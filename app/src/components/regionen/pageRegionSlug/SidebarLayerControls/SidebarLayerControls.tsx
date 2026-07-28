import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useElementSize } from '@/components/shared/hooks/useElementSize'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { Categories } from './Categories/Categories'
import { QaConfigCategories } from './QaConfigs/QaConfigCategories'
import { StaticDatasetCategories } from './StaticDatasets/StaticDatasetCategories'

export const SidebarLayerControls = () => {
  const isSmBreakpointOrAbove = useBreakpoint('sm')
  const { updateSidebarSize } = useMapActions()
  const ref = useElementSize(updateSidebarSize)

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

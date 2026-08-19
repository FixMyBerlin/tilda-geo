import { useState } from 'react'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { Categories } from '../SidebarLayerControls/Categories/Categories'
import { LayerControlsOpenButton } from '../SidebarLayerControls/LayerControlsOpenButton'
import { QaConfigCategories } from '../SidebarLayerControls/QaConfigs/QaConfigCategories'
import { StaticDatasetCategories } from '../SidebarLayerControls/StaticDatasets/StaticDatasetCategories'
import { MobileBottomSheet } from './MobileBottomSheet'

/**
 * Mobile layer control: the primary bottom-right map button (in the bottom
 * controls cluster) that opens a bottom sheet holding the category controls.
 * Larger than the other controls. Renders nothing on desktop (returns null
 * instead of CSS-hiding) — desktop uses the sidebar — so neither the button nor
 * its bottom sheet are in the DOM there.
 */
export const MobileLayerButton = () => {
  const isDesktop = useBreakpoint('sm')
  const [open, setOpen] = useState(false)
  if (isDesktop) return null

  return (
    <>
      <LayerControlsOpenButton expanded={open} onClick={() => setOpen(true)} />

      <MobileBottomSheet open={open} onClose={() => setOpen(false)} title="Kategorien">
        <Categories />
        <StaticDatasetCategories />
        <QaConfigCategories />
      </MobileBottomSheet>
    </>
  )
}

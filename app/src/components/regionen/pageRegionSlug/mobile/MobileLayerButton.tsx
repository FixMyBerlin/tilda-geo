import { Square3Stack3DIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { Categories } from '../SidebarLayerControls/Categories/Categories'
import { QaConfigCategories } from '../SidebarLayerControls/QaConfigs/QaConfigCategories'
import { StaticDatasetCategories } from '../SidebarLayerControls/StaticDatasets/StaticDatasetCategories'
import { useBreakpoint } from '../utils/useBreakpoint'
import { MobileBottomSheet } from './MobileBottomSheet'
import {
  mobileControlButtonActiveClassName,
  mobileControlButtonClassName,
} from './mobileControlButton.const'

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Kategorien"
        aria-expanded={open}
        className={twMerge(
          mobileControlButtonClassName,
          'size-13',
          open && mobileControlButtonActiveClassName,
        )}
      >
        <Square3Stack3DIcon className="size-8" aria-hidden="true" />
      </button>

      <MobileBottomSheet open={open} onClose={() => setOpen(false)} title="Kategorien">
        <Categories />
        <StaticDatasetCategories />
        <QaConfigCategories />
      </MobileBottomSheet>
    </>
  )
}

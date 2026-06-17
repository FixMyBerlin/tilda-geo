import { Square3Stack3DIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { Categories } from '../SidebarLayerControls/Categories/Categories'
import { QaConfigCategories } from '../SidebarLayerControls/QaConfigs/QaConfigCategories'
import { StaticDatasetCategories } from '../SidebarLayerControls/StaticDatasets/StaticDatasetCategories'
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
        {/* Bigger (size-8) to fill the larger button, but strokeWidth thinned to ~match the
            size-6 control icons' line weight (1.5 × 24/32 ≈ 1.125). */}
        <Square3Stack3DIcon className="size-8" strokeWidth={1.125} aria-hidden="true" />
      </button>

      <MobileBottomSheet open={open} onClose={() => setOpen(false)} title="Kategorien">
        <Categories />
        <StaticDatasetCategories />
        <QaConfigCategories />
      </MobileBottomSheet>
    </>
  )
}

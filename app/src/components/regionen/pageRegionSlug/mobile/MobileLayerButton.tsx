import { Square3Stack3DIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { Categories } from '../SidebarLayerControls/Categories/Categories'
import { QaConfigCategories } from '../SidebarLayerControls/QaConfigs/QaConfigCategories'
import { StaticDatasetCategories } from '../SidebarLayerControls/StaticDatasets/StaticDatasetCategories'
import { MobileBottomSheet } from './MobileBottomSheet'
import { mobileControlButtonClassName } from './mobileControlButton.const'

/**
 * Mobile layer control: an icon button (placed in the MobileMapHeader) that
 * opens a bottom sheet holding the category controls.
 */
export const MobileLayerButton = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Kategorien"
        className={twJoin(mobileControlButtonClassName, 'size-10')}
      >
        <Square3Stack3DIcon className="size-6" aria-hidden="true" />
      </button>

      <MobileBottomSheet open={open} onClose={() => setOpen(false)} title="Kategorien">
        <Categories />
        <StaticDatasetCategories />
        <QaConfigCategories />
      </MobileBottomSheet>
    </>
  )
}

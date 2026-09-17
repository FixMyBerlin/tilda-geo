import { BookOpenIcon } from '@heroicons/react/24/outline'
import { IconModal } from '@/components/shared/Modal/IconModal'
import {
  mapControlIconClassName,
  mobileMapIconButtonClassName,
} from '../mobile/mobileControlButton.const'
import { useRegionSlug } from '../regionUtils/useRegionSlug'
import type { RegionModalAccess } from './regionModalAccess'
import { RegionModalDocLinksSection } from './RegionModalDocLinksSection'

type Props = {
  modalAccess: RegionModalAccess
}

export const DocumentationModal = ({ modalAccess }: Props) => {
  const regionSlug = useRegionSlug()

  return (
    <section className="contents">
      <IconModal
        title="Dokumentation"
        titleIcon="docs"
        triggerStyle={mobileMapIconButtonClassName}
        triggerIcon={<BookOpenIcon className={mapControlIconClassName} />}
      >
        <RegionModalDocLinksSection regionSlug={regionSlug} datasets={modalAccess.all} />
      </IconModal>
    </section>
  )
}

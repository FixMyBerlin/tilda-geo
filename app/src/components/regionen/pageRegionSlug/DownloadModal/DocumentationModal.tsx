import { BookOpenIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { IconModal } from '@/components/shared/Modal/IconModal'
import { mobileControlButtonClassName } from '../mobile/mobileControlButton.const'
import { useRegionSlug } from '../regionUtils/useRegionSlug'
import type { RegionModalAccess } from './regionModalAccess'
import { RegionModalDocLinksSection } from './RegionModalDocLinksSection'

// Only rendered when showDocumentationButton — mutually exclusive with dataset lists in download modal.
const documentationTriggerClassName = twMerge(mobileControlButtonClassName, 'size-10')

type Props = {
  modalAccess: RegionModalAccess
}

export const DocumentationModal = ({ modalAccess }: Props) => {
  const regionSlug = useRegionSlug()

  return (
    <section>
      <IconModal
        title="Dokumentation"
        titleIcon="docs"
        triggerStyle={documentationTriggerClassName}
        triggerIcon={<BookOpenIcon className="size-6" />}
      >
        <RegionModalDocLinksSection regionSlug={regionSlug} datasets={modalAccess.all} />
      </IconModal>
    </section>
  )
}

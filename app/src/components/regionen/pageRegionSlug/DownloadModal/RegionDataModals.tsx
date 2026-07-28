import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { DocumentationModal } from './DocumentationModal'
import { DownloadModal } from './DownloadModal'
import { useRegionModalAccess } from './useRegionModalAccess'

// Download button is always visible. Documentation button only when the download modal
// has no dataset doc links (login/export info only) — never alongside a download list.
export const RegionDataModals = () => {
  const modalAccess = useRegionModalAccess()
  const hasPermissions = useHasPermissions()

  return (
    <div className="flex items-start gap-2">
      <DownloadModal modalAccess={modalAccess} hasPermissions={hasPermissions} />
      {modalAccess.showDocumentationButton ? (
        <DocumentationModal modalAccess={modalAccess} />
      ) : null}
    </div>
  )
}

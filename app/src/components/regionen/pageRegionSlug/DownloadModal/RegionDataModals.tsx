import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { DocumentationModal } from './DocumentationModal'
import { DownloadModal } from './DownloadModal'
import { useRegionModalAccess } from './useRegionModalAccess'

// Download button is always visible. Documentation button only when the download modal
// has no dataset doc links (login/export info only) — never alongside a download list.
// Fragment so the parent row (mobile header) or column (desktop map stack) owns layout.
export const RegionDataModals = () => {
  const modalAccess = useRegionModalAccess()
  const hasPermissions = useHasPermissions()

  return (
    <>
      <DownloadModal modalAccess={modalAccess} hasPermissions={hasPermissions} />
      {modalAccess.showDocumentationButton ? (
        <DocumentationModal modalAccess={modalAccess} />
      ) : null}
    </>
  )
}

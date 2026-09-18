import { getRouteApi } from '@tanstack/react-router'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminRegionFilter } from '@/components/admin/AdminRegionFilter'
import { ReviewListsTable } from './pageReviewLists/ReviewListsTable'

const routeApi = getRouteApi('/admin/review-lists/')

export function PageReviewLists() {
  const { lists } = routeApi.useLoaderData()
  const { regionSlug } = routeApi.useSearch()

  return (
    <>
      <AdminPageHeader
        title="Prüflisten"
        intro="Neue Prüflisten werden in der Region im Modus Prüflisten angelegt. Das können Mitglieder und Admins tun."
      />

      <div className="mb-6">
        <AdminRegionFilter />
      </div>

      {lists.length === 0 ? (
        <AdminEmptyState>
          {regionSlug ? 'Keine Prüflisten für diese Region.' : 'Noch keine Prüflisten vorhanden.'}
        </AdminEmptyState>
      ) : (
        <ReviewListsTable lists={lists} />
      )}
    </>
  )
}

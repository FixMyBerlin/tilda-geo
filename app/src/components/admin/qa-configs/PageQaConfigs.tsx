import { getRouteApi } from '@tanstack/react-router'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminRegionFilter } from '@/components/admin/AdminRegionFilter'
import { Link } from '@/components/shared/links/Link'
import { QaConfigsTable } from './pageQaConfigs/QaConfigsTable'

const routeApi = getRouteApi('/admin/qa-configs/')

export function PageQaConfigs() {
  const { qaConfigs } = routeApi.useLoaderData()
  const { regionSlug } = routeApi.useSearch()

  return (
    <>
      <AdminPageHeader
        title="QA-Konfigurationen"
        action={
          <Link to="/admin/qa-configs/new" button>
            Neue QA-Konfiguration
          </Link>
        }
        intro="Statistiken, CSV-Export und verwaiste Bewertungen stehen auf der Bearbeiten-Seite einer Konfiguration."
      />

      <div className="mb-6">
        <AdminRegionFilter />
      </div>

      {qaConfigs.length === 0 ? (
        <AdminEmptyState>
          {regionSlug
            ? 'Keine QA-Konfigurationen für diese Region.'
            : 'Noch keine QA-Konfigurationen vorhanden.'}
        </AdminEmptyState>
      ) : (
        <QaConfigsTable qaConfigs={qaConfigs} />
      )}
    </>
  )
}

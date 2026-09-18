import { getRouteApi } from '@tanstack/react-router'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminIntro } from '@/components/admin/AdminIntro'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminFirstPageLink, AdminPagination } from '@/components/admin/AdminPagination'
import { AdminRegionFilter } from '@/components/admin/AdminRegionFilter'
import { AuditLogTable } from '@/components/admin/audit-log/AuditLogTable'
import { FilterRow } from '@/components/shared/FilterRow/FilterRow'
import type { FilterRowItem } from '@/components/shared/FilterRow/types'
import { Link } from '@/components/shared/links/Link'
import { linkStyles } from '@/components/shared/links/styles'
import { AUDIT_CHANGE_SOURCES } from '@/server/audit/auditChangeSources.const'
import type { AuditChangeSource } from '@/server/audit/auditChangeSources.const'

const routeApi = getRouteApi('/admin/audit-log')

// Models worth filtering by in the admin UI (subset of the audited models that admins actually edit).
const MODEL_FILTERS = [
  'Region',
  'RegionContract',
  'MapDatasetUpload',
  'MapDatasetCategory',
  'QaConfig',
]
const CHANGE_SOURCE_FILTERS = AUDIT_CHANGE_SOURCES

const modelFilterItems = [
  { id: '', label: 'Alle' },
  ...MODEL_FILTERS.map((model) => ({ id: model, label: model })),
] satisfies FilterRowItem[]

const changeSourceFilterItems = [
  { id: '', label: 'Alle' },
  ...CHANGE_SOURCE_FILTERS.map((source) => ({ id: source, label: source })),
] satisfies FilterRowItem[]

const intro = (
  <AdminIntro>
    <p>
      Änderungen an wichtigen Admin-Daten werden automatisch protokolliert. <strong>User</strong>{' '}
      und <strong>Quelle</strong> sind nur gesetzt, wenn die Änderung über einen bekannten Pfad lief
      (Admin-UI, Mitglieder-UI, API/MCP-Token) — sonst erscheinen sie als „—“, die Änderung selbst
      ist trotzdem erfasst.
    </p>
    <ul>
      <li>
        <code>ADMIN_FORM</code> — Admin in der Admin-Oberfläche
      </li>
      <li>
        <code>MEMBER_FORM</code> — Mitglied in der Regions-Oberfläche (z.&nbsp;B. Notizen, QA)
      </li>
      <li>
        <code>API</code> — REST-API oder MCP; zugeschrieben dem Token-Inhaber (
        <Link to="/admin/api-tokens" classNameOverwrite={linkStyles}>
          API-Tokens
        </Link>
        )
      </li>
      <li>
        <code>MIGRATION</code> — Seeds oder Datenübernahmen
      </li>
    </ul>
  </AdminIntro>
)

export function PageAuditLog() {
  const loaderData = routeApi.useLoaderData()
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const fixedModel = search.model
  const fixedRecordId = search.recordId
  const regionRecordScope = search.model === 'Region' && search.recordId !== undefined
  const hasActiveFilter = !!(search.model || search.changeSource || search.recordId !== undefined)
  const emptyLabel = hasActiveFilter
    ? 'Keine Einträge für diesen Filter.'
    : search.regionSlug
      ? 'Keine Einträge für diese Region.'
      : 'Noch keine Einträge vorhanden.'

  return (
    <>
      <AdminPageHeader title="Änderungsverlauf" intro={intro} />

      <div className="mb-6 space-y-3">
        <div className="space-y-1">
          <AdminRegionFilter />
          {search.regionSlug ? (
            <p className="text-sm text-gray-500">
              Region inkl. zugehöriger Zuordnungen (Kategorien, Hintergründe, Exporte, Navigation)
            </p>
          ) : null}
        </div>
        <FilterRow
          items={modelFilterItems}
          activeId={search.model ?? ''}
          to="/admin/audit-log"
          label="Modell"
          buildSearch={(model) => ({
            ...search,
            model: model || undefined,
            page: undefined,
          })}
          ariaLabel="Modell"
        />
        <FilterRow
          items={changeSourceFilterItems}
          activeId={search.changeSource ?? ''}
          to="/admin/audit-log"
          label="Quelle"
          buildSearch={(changeSource) => ({
            ...search,
            changeSource: (changeSource || undefined) as AuditChangeSource | undefined,
            page: undefined,
          })}
          ariaLabel="Quelle"
        />
        {fixedRecordId !== undefined ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
            <span>
              Datensatz-ID: <code className="text-gray-900">{fixedRecordId}</code>
            </span>
            <button
              type="button"
              className={linkStyles}
              onClick={() =>
                navigate({
                  search: { ...search, recordId: undefined, page: undefined },
                })
              }
            >
              Filter aufheben
            </button>
            {regionRecordScope ? (
              <span className="text-gray-500">
                · inkl. zugehöriger Zuordnungen (Kategorien, Hintergründe, Exporte, Navigation)
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {loaderData.rows.length === 0 ? (
        <AdminEmptyState action={search.page > 1 ? <AdminFirstPageLink /> : undefined}>
          {emptyLabel}
        </AdminEmptyState>
      ) : (
        <AuditLogTable
          rows={loaderData.rows}
          fixedModel={fixedModel}
          fixedRecordId={fixedRecordId}
          footer={<AdminPagination pagination={loaderData} />}
        />
      )}
    </>
  )
}

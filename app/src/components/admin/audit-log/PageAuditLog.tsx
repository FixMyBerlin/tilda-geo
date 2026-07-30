import { getRouteApi } from '@tanstack/react-router'
import { AuditLogListRow } from '@/components/admin/audit-log/AuditLogListRow'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { FilterRow } from '@/components/shared/FilterRow/FilterRow'
import type { FilterRowItem } from '@/components/shared/FilterRow/types'
import { Link } from '@/components/shared/links/Link'
import { PaginationControls } from '@/components/shared/pagination/PaginationControls'
import { useAdminTablePagination } from '@/components/shared/pagination/useAdminTablePagination'
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

export function PageAuditLog() {
  const loaderData = routeApi.useLoaderData()
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const { page, goToPage, result } = useAdminTablePagination(search, navigate, loaderData)

  const fixedModel = search.model
  const fixedRecordId = search.recordId
  const regionRecordScope = search.model === 'Region' && search.recordId !== undefined

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/audit-log', name: 'Änderungsverlauf' }]} />
      </HeaderWrapper>

      <div className="mb-6 max-w-prose space-y-3 text-sm text-gray-600">
        <p>
          Änderungen an wichtigen Admin-Daten werden automatisch protokolliert.{' '}
          <strong>User</strong> und <strong>Quelle</strong> sind nur gesetzt, wenn die Änderung über
          einen bekannten Pfad lief (Admin-UI, Mitglieder-UI, API/MCP-Token) — sonst erscheinen sie
          als „—“, die Änderung selbst ist trotzdem erfasst.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <code>ADMIN_FORM</code> — Admin in der Admin-Oberfläche
          </li>
          <li>
            <code>MEMBER_FORM</code> — Mitglied in der Regions-Oberfläche (z.&nbsp;B. Notizen, QA)
          </li>
          <li>
            <code>API</code> — REST-API oder MCP; zugeschrieben dem Token-Inhaber (
            <Link to="/admin/api-tokens">API-Tokens</Link>)
          </li>
          <li>
            <code>MIGRATION</code> — Seeds oder Datenübernahmen
          </li>
        </ul>
      </div>

      <div className="mb-4">
        <FilterRow
          items={modelFilterItems}
          activeId={search.model ?? ''}
          to="/admin/audit-log"
          label="Modell"
          buildSearch={(model) => ({
            ...search,
            model: model || undefined,
            skip: undefined,
          })}
          ariaLabel="Modell"
        />
      </div>

      <div className="mb-4">
        <FilterRow
          items={changeSourceFilterItems}
          activeId={search.changeSource ?? ''}
          to="/admin/audit-log"
          label="Quelle"
          buildSearch={(changeSource) => ({
            ...search,
            changeSource: (changeSource || undefined) as AuditChangeSource | undefined,
            skip: undefined,
          })}
          ariaLabel="Quelle"
        />
      </div>

      {fixedRecordId !== undefined ? (
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
          <span>
            Datensatz-ID: <code className="text-gray-900">{fixedRecordId}</code>
          </span>
          <button
            type="button"
            className="text-sm text-indigo-600 hover:text-indigo-500"
            onClick={() =>
              navigate({
                search: { ...search, recordId: undefined, skip: undefined },
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

      {loaderData.rows.length === 0 ? (
        <p className="text-gray-500">Keine Einträge.</p>
      ) : (
        <div className="space-y-4">
          <ul className="divide-y divide-gray-200 rounded-lg ring-1 ring-gray-900/5">
            {loaderData.rows.map((row) => (
              <AuditLogListRow
                key={row.id}
                row={row}
                fixedModel={fixedModel}
                fixedRecordId={fixedRecordId}
              />
            ))}
          </ul>
          <PaginationControls page={page} result={result} onPageChange={goToPage} />
        </div>
      )}
    </>
  )
}

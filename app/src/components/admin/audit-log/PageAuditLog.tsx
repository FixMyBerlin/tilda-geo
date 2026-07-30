import { getRouteApi } from '@tanstack/react-router'
import { AdminConsoleDumpButton } from '@/components/admin/AdminConsoleDumpButton'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AuditActionPill, auditChangeSourceColor } from '@/components/admin/audit-log/auditLogPills'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { FilterRow } from '@/components/shared/FilterRow/FilterRow'
import type { FilterRowItem } from '@/components/shared/FilterRow/types'
import { PaginationControls } from '@/components/shared/pagination/PaginationControls'
import { useAdminTablePagination } from '@/components/shared/pagination/useAdminTablePagination'
import { Pill } from '@/components/shared/text/Pill'
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

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/audit-log', name: 'Änderungsverlauf' }]} />
      </HeaderWrapper>

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

      <div className="mb-6">
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

      <div className={adminTableClasses.paginatedShell}>
        <AdminTable
          header={[
            'Zeitpunkt',
            'Modell',
            'ID',
            'Aktion',
            'Quelle',
            'User',
            { id: 'audit-diff', label: '' },
          ]}
        >
          {loaderData.rows.map((row) => (
            <tr key={row.id}>
              <td className={adminTableClasses.td}>{formatDateTimeBerlin(row.createdAt)}</td>
              <td className={adminTableClasses.td}>{row.model}</td>
              <td className={adminTableClasses.td}>
                <span className="block max-w-[45px] truncate" title={row.recordId}>
                  {row.recordId}
                </span>
              </td>
              <td className={adminTableClasses.td}>
                <AuditActionPill action={row.action} />
              </td>
              <td className={adminTableClasses.td}>
                {row.changeSource ? (
                  <Pill color={auditChangeSourceColor(row.changeSource)}>{row.changeSource}</Pill>
                ) : (
                  '—'
                )}
              </td>
              <td className={adminTableClasses.td}>{row.userId ?? '—'}</td>
              <td className={adminTableClasses.td}>
                <AdminConsoleDumpButton
                  name={`audit-${row.id}`}
                  data={{
                    changedFields: row.changedFields,
                    oldData: row.oldData,
                    newData: row.newData,
                  }}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
        <PaginationControls page={page} result={result} onPageChange={goToPage} />
      </div>
    </>
  )
}

import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { DataSchemaImportStatusPill } from '@/components/admin/data-schema/DataSchemaImportStatusPill'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { Link } from '@/components/shared/links/Link'
import { buttonStyles, buttonStylesSecondary } from '@/components/shared/links/styles'
import { Markdown } from '@/components/shared/text/Markdown'
import { Pill } from '@/components/shared/text/Pill'
import {
  importDataSchemaTableFn,
  publishDataSchemaTableFn,
} from '@/server/dataSchema/dataSchema.functions'

const routeApi = getRouteApi('/admin/data-schema')

const sectionClassName = twMerge(
  'rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-gray-900/5 sm:p-6',
)

const smallButtonClassName = twMerge(buttonStyles, 'px-3 py-1.5 text-sm')
const smallSecondaryButtonClassName = twMerge(buttonStylesSecondary, 'px-3 py-1.5 text-sm')

type DataSchemaAction =
  | { key: `import:${string}`; kind: 'import'; table: string; snapshotId?: undefined }
  | { key: `import-snap:${string}`; kind: 'import'; table: string; snapshotId: string }
  | { key: `publish:${string}`; kind: 'publish'; table: string; snapshot: boolean }

export function PageDataSchema() {
  const { datasets, listError } = routeApi.useLoaderData()
  const router = useRouter()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [snapshotByTable, setSnapshotByTable] = useState<Record<string, boolean>>({})
  const [selectedSnapshotByTable, setSelectedSnapshotByTable] = useState<Record<string, string>>({})

  const { mutate, isPending, variables } = useMutation({
    mutationFn: async (action: DataSchemaAction) => {
      if (action.kind === 'import') {
        return importDataSchemaTableFn({
          data: { table: action.table, snapshotId: action.snapshotId ?? null },
        })
      }
      return publishDataSchemaTableFn({
        data: { table: action.table, snapshot: action.snapshot },
      })
    },
    onSuccess: async (result) => {
      setError(null)
      setFeedback(
        result.warning ? `Aktion abgeschlossen. ${result.warning}` : 'Aktion abgeschlossen.',
      )
      await router.invalidate()
    },
    onError: (e) => {
      setFeedback(null)
      setError(e instanceof Error ? e.message : String(e))
    },
  })

  const pendingKey = isPending && variables ? variables.key : null

  function runAction(action: DataSchemaAction, confirmMessage: string) {
    if (!window.confirm(confirmMessage)) return
    setFeedback(null)
    setError(null)
    mutate(action)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/data-schema', name: 'Data-Schema' }]} />
      </HeaderWrapper>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-gray-900">Data-Schema</h2>
        <p className="mt-2 text-sm text-gray-600">
          Pro Tabelle <strong>Import</strong> klicken, um <code className="text-xs">data.*</code>{' '}
          durch den S3-Dump (<code className="text-xs">data.dump</code>) zu ersetzen. Karten-Layer
          aus Processing sehen die Daten erst nach einem Rebuild der{' '}
          <code className="text-xs">public.*</code>-Tabellen — siehe{' '}
          <Link to="/admin/processing">Processing</Link>.
        </p>
        {listError ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            S3-Liste konnte nicht geladen werden: {listError}
          </p>
        ) : null}
        {feedback ? (
          <p className="mt-3 text-sm text-green-800" role="status">
            {feedback}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className={twMerge(sectionClassName, 'mt-8 overflow-x-auto')}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Tabellen</h2>
        {datasets.length === 0 ? (
          <p className="text-sm text-gray-600">Keine Tabellen unter data-schema/ in S3 gefunden.</p>
        ) : (
          <AdminTable
            header={[
              'Tabelle',
              'Veröffentlicht am',
              'Zeilen (S3)',
              'Zeilen (diese Umgebung)',
              'Aktionen',
              'Verlauf',
            ]}
          >
            {datasets.map((dataset) => {
              const selectedSnapshot =
                selectedSnapshotByTable[dataset.table] ?? dataset.snapshotIds[0] ?? ''
              const alsoSnapshot = snapshotByTable[dataset.table] ?? false
              return (
                <tr key={dataset.table}>
                  <th scope="row" className={adminTableClasses.thRow}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm">{dataset.table}</span>
                      {dataset.error ? <Pill color="red">Manifest-Fehler</Pill> : null}
                    </div>
                    {dataset.error ? (
                      <p className="mt-1 max-w-xs text-xs font-normal text-red-700">
                        {dataset.error}
                      </p>
                    ) : null}
                    {dataset.spec?.provider ? (
                      <p className="mt-1 text-xs font-normal text-gray-600">
                        {dataset.spec.provider}
                      </p>
                    ) : null}
                    {dataset.spec?.file ? (
                      <p className="mt-1 font-mono text-xs font-normal text-gray-500">
                        {dataset.spec.file}
                      </p>
                    ) : null}
                    {dataset.spec?.consumedBy ? (
                      <p className="mt-1 font-mono text-xs font-normal text-gray-500">
                        {dataset.spec.consumedBy}
                      </p>
                    ) : null}
                    {dataset.spec?.documentation ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-normal text-gray-700">
                          Quelle aktualisieren
                        </summary>
                        <div className="mt-2 max-w-md text-left font-normal">
                          <Markdown markdown={dataset.spec.documentation} headingStyle="compact" />
                        </div>
                      </details>
                    ) : null}
                  </th>
                  <td className={adminTableClasses.td}>
                    {dataset.manifest?.publishedAt
                      ? formatDateTimeBerlin(dataset.manifest.publishedAt)
                      : '—'}
                  </td>
                  <td className={adminTableClasses.td}>
                    {dataset.manifest ? dataset.manifest.rowCount.toLocaleString('de-DE') : '—'}
                  </td>
                  <td className={adminTableClasses.td}>
                    {dataset.liveRowCount === null
                      ? 'nicht vorhanden'
                      : dataset.liveRowCount.toLocaleString('de-DE')}
                  </td>
                  <td className={adminTableClasses.td}>
                    <div className="flex min-w-56 flex-col gap-2">
                      <button
                        type="button"
                        disabled={pendingKey !== null || !dataset.manifest}
                        className={smallButtonClassName}
                        onClick={() =>
                          runAction(
                            {
                              key: `import:${dataset.table}`,
                              kind: 'import',
                              table: dataset.table,
                            },
                            `Tabelle data.${dataset.table} mit data.dump überschreiben?`,
                          )
                        }
                      >
                        {pendingKey === `import:${dataset.table}` ? 'Import…' : 'Import'}
                      </button>

                      {dataset.snapshotIds.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="rounded border border-gray-300 px-2 py-1 text-sm"
                            value={selectedSnapshot}
                            onChange={(e) =>
                              setSelectedSnapshotByTable((prev) => ({
                                ...prev,
                                [dataset.table]: e.target.value,
                              }))
                            }
                          >
                            {dataset.snapshotIds.map((id) => (
                              <option key={id} value={id}>
                                {id}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={pendingKey !== null || !selectedSnapshot}
                            className={smallSecondaryButtonClassName}
                            onClick={() =>
                              runAction(
                                {
                                  key: `import-snap:${dataset.table}`,
                                  kind: 'import',
                                  table: dataset.table,
                                  snapshotId: selectedSnapshot,
                                },
                                `Tabelle data.${dataset.table} mit Snapshot ${selectedSnapshot} überschreiben?`,
                              )
                            }
                          >
                            {pendingKey === `import-snap:${dataset.table}`
                              ? 'Import…'
                              : 'Snapshot importieren'}
                          </button>
                        </div>
                      ) : null}

                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={alsoSnapshot}
                          onChange={(e) =>
                            setSnapshotByTable((prev) => ({
                              ...prev,
                              [dataset.table]: e.target.checked,
                            }))
                          }
                        />
                        zusätzlich bisherigen Dump sichern
                      </label>
                      <button
                        type="button"
                        disabled={pendingKey !== null || dataset.liveRowCount === null}
                        className={smallSecondaryButtonClassName}
                        onClick={() =>
                          runAction(
                            {
                              key: `publish:${dataset.table}`,
                              kind: 'publish',
                              table: dataset.table,
                              snapshot: alsoSnapshot,
                            },
                            alsoSnapshot
                              ? `data.${dataset.table} nach S3 veröffentlichen und den bisherigen Dump als Snapshot behalten?`
                              : `data.${dataset.table} aus dieser Umgebung nach S3 veröffentlichen (data.dump überschreiben)?`,
                          )
                        }
                      >
                        {pendingKey === `publish:${dataset.table}`
                          ? 'Veröffentlichen…'
                          : 'Aus dieser Umgebung veröffentlichen'}
                      </button>
                    </div>
                  </td>
                  <td className={adminTableClasses.td}>
                    {dataset.recentImports.length === 0 ? (
                      <span className="text-xs text-gray-500">Keine Importe</span>
                    ) : (
                      <details>
                        <summary className="cursor-pointer text-sm text-gray-700">
                          {dataset.recentImports.length} Einträge
                        </summary>
                        <ul className="mt-2 space-y-2">
                          {dataset.recentImports.map((row) => (
                            <li key={row.id} className="text-xs text-gray-700">
                              <div className="flex flex-wrap items-center gap-2">
                                <DataSchemaImportStatusPill status={row.status} />
                                <span>{formatDateTimeBerlin(row.createdAt)}</span>
                                {row.durationMs != null ? (
                                  <span>{(row.durationMs / 1000).toFixed(1)}s</span>
                                ) : null}
                                {row.snapshotId ? (
                                  <span className="font-mono">{row.snapshotId}</span>
                                ) : (
                                  <span>aktuell</span>
                                )}
                              </div>
                              {row.errorText ? (
                                <pre className="mt-1 max-h-24 max-w-xs overflow-auto rounded bg-red-50 p-1 text-[11px] whitespace-pre-wrap text-red-800">
                                  {row.errorText}
                                </pre>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </td>
                </tr>
              )
            })}
          </AdminTable>
        )}
      </section>
    </div>
  )
}

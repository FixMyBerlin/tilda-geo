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
import { Pill } from '@/components/shared/text/Pill'

const routeApi = getRouteApi('/admin/data-schema')

const sectionClassName = twMerge(
  'rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-gray-900/5 sm:p-6',
)

const smallButtonClassName = twMerge(buttonStyles, 'px-3 py-1.5 text-sm')
const smallSecondaryButtonClassName = twMerge(buttonStylesSecondary, 'px-3 py-1.5 text-sm')

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await response.json().catch(() => null)) as {
    ok?: boolean
    message?: string
    warning?: string
    results?: Array<{
      table: string
      ok: boolean
      skipped?: boolean
      reason?: string
      rowCount?: number
      durationMs?: number
      error?: string
      warning?: string
    }>
  } | null
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || `HTTP ${response.status}`)
  }
  return data
}

function formatImportAllFeedback(data: Awaited<ReturnType<typeof postJson>>) {
  if (!data?.results || !Array.isArray(data.results)) {
    return data?.message || 'Aktion abgeschlossen.'
  }
  const lines = data.results.map((r) => {
    if (r.skipped) return `${r.table}: übersprungen (${r.reason ?? 'skipped'})`
    if (!r.ok) return `${r.table}: fehlgeschlagen — ${r.error ?? 'Fehler'}`
    return `${r.table}: OK${r.rowCount != null ? ` (${r.rowCount.toLocaleString('de-DE')} Zeilen)` : ''}${r.warning ? ` — ${r.warning}` : ''}`
  })
  return [data.message || 'Import-All abgeschlossen.', ...lines].join('\n')
}

export function PageDataSchema() {
  const { datasets, listError } = routeApi.useLoaderData()
  const router = useRouter()
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [includeLarge, setIncludeLarge] = useState(false)
  const [snapshotByTable, setSnapshotByTable] = useState<Record<string, boolean>>({})
  const [selectedSnapshotByTable, setSelectedSnapshotByTable] = useState<Record<string, string>>({})

  async function runAction(key: string, confirmMessage: string, action: () => Promise<unknown>) {
    if (!window.confirm(confirmMessage)) return
    setFeedback(null)
    setError(null)
    setPendingKey(key)
    try {
      const result = await action()
      const data = result as Awaited<ReturnType<typeof postJson>>
      if (key === 'import-all') {
        setFeedback(formatImportAllFeedback(data))
      } else if (data?.warning) {
        setFeedback(`Aktion abgeschlossen. ${data.warning}`)
      } else {
        setFeedback('Aktion abgeschlossen.')
      }
      await router.invalidate()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setPendingKey(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/data-schema', name: 'Data-Schema' }]} />
      </HeaderWrapper>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-gray-900">Data-Schema Import</h2>
        <p className="mt-2 text-sm text-gray-600">
          Tabellen unter <code className="text-xs">data.*</code> werden aus S3-Dumps (
          <code className="text-xs">data-schema/…/latest/</code>) in diese Umgebung importiert.
          Karten-Layer aus Processing sehen die Daten erst nach einem Rebuild der{' '}
          <code className="text-xs">public.*</code>-Tabellen — siehe{' '}
          <Link to="/admin/processing">Processing</Link>.
        </p>
        <p className="mt-2 text-xs text-amber-800">
          Hinweis: Stirbt der Prozess mitten im Import (z.&nbsp;B. Container-Neustart), kann eine
          Aside-Tabelle mit Suffix <code className="text-xs">__old</code> und ein Status RUNNING
          zurückbleiben — vor dem nächsten Import prüfen und manuell bereinigen.
        </p>
        {listError ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            S3-Liste konnte nicht geladen werden: {listError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeLarge}
              onChange={(e) => setIncludeLarge(e.target.checked)}
            />
            Auch große Tabellen (<code className="text-xs">large: true</code>) importieren
          </label>
          <button
            type="button"
            disabled={pendingKey !== null}
            className={smallButtonClassName}
            onClick={() =>
              void runAction(
                'import-all',
                includeLarge
                  ? 'Alle Data-Schema-Tabellen inkl. großer Tabellen in dieser Umgebung überschreiben?'
                  : 'Alle Data-Schema-Tabellen (ohne large) in dieser Umgebung überschreiben? Große Tabellen werden übersprungen.',
                () => postJson('/api/admin/data-schema/import-all', { includeLarge }),
              )
            }
          >
            {pendingKey === 'import-all' ? 'Import läuft…' : 'Alle importieren'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Standard: Tabellen mit <code>large: true</code> werden bei „Alle importieren“
          übersprungen.
        </p>

        {feedback ? (
          <pre className="mt-3 text-sm whitespace-pre-wrap text-green-800" role="status">
            {feedback}
          </pre>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className={twMerge(sectionClassName, 'mt-8 overflow-x-auto')}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Datensätze</h2>
        {datasets.length === 0 ? (
          <p className="text-sm text-gray-600">Keine Tabellen unter data-schema/ in S3 gefunden.</p>
        ) : (
          <AdminTable
            header={[
              'Tabelle',
              'Veröffentlicht am',
              'Zeilen (S3)',
              'Zeilen (diese Umgebung)',
              'Größe',
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
                      {dataset.manifest?.large ? <Pill color="yellow">large</Pill> : null}
                      {dataset.error ? <Pill color="red">Manifest-Fehler</Pill> : null}
                    </div>
                    {dataset.error ? (
                      <p className="mt-1 max-w-xs text-xs font-normal text-red-700">
                        {dataset.error}
                      </p>
                    ) : null}
                    {dataset.manifest?.publishedFrom ? (
                      <p className="mt-1 text-xs font-normal text-gray-500">
                        von {dataset.manifest.publishedFrom}
                      </p>
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
                    {dataset.manifest ? formatBytes(dataset.manifest.bytes) : '—'}
                  </td>
                  <td className={adminTableClasses.td}>
                    <div className="flex min-w-56 flex-col gap-2">
                      <button
                        type="button"
                        disabled={pendingKey !== null || !dataset.manifest}
                        className={smallButtonClassName}
                        onClick={() =>
                          void runAction(
                            `import:${dataset.table}`,
                            `Tabelle data.${dataset.table} mit latest-Dump überschreiben?`,
                            () =>
                              postJson('/api/admin/data-schema/import', {
                                table: dataset.table,
                              }),
                          )
                        }
                      >
                        {pendingKey === `import:${dataset.table}` ? 'Import…' : 'Import (latest)'}
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
                              void runAction(
                                `import-snap:${dataset.table}`,
                                `Tabelle data.${dataset.table} mit Snapshot ${selectedSnapshot} überschreiben?`,
                                () =>
                                  postJson('/api/admin/data-schema/import', {
                                    table: dataset.table,
                                    snapshotId: selectedSnapshot,
                                  }),
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
                        zusätzlich Snapshot
                      </label>
                      <button
                        type="button"
                        disabled={pendingKey !== null || dataset.liveRowCount === null}
                        className={smallSecondaryButtonClassName}
                        onClick={() =>
                          void runAction(
                            `publish:${dataset.table}`,
                            alsoSnapshot
                              ? `data.${dataset.table} aus dieser Umgebung nach S3 veröffentlichen (latest + Snapshot)?`
                              : `data.${dataset.table} aus dieser Umgebung nach S3 veröffentlichen (latest überschreiben)?`,
                            () =>
                              postJson('/api/admin/data-schema/publish', {
                                table: dataset.table,
                                snapshot: alsoSnapshot,
                              }),
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
                                  <span>latest</span>
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

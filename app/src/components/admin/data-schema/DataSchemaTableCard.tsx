import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { DataSchemaImportStatusPill } from '@/components/admin/data-schema/DataSchemaImportStatusPill'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { buttonStyles, buttonStylesSecondary } from '@/components/shared/links/styles'
import { Markdown } from '@/components/shared/text/Markdown'
import { Pill } from '@/components/shared/text/Pill'
import type { getDataSchemaOverviewLoaderFn } from '@/server/dataSchema/dataSchema.functions'

const smallButtonClassName = twMerge(buttonStyles, 'px-3 py-1.5 text-sm')
const smallSecondaryButtonClassName = twMerge(buttonStylesSecondary, 'px-3 py-1.5 text-sm')

export const dataSchemaTableSectionClassName = twMerge(
  'rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-gray-900/5 sm:p-6',
)

type DataSchemaDataset = Awaited<
  ReturnType<typeof getDataSchemaOverviewLoaderFn>
>['datasets'][number]

export function DataSchemaTableCard({
  dataset,
  pendingKey,
  onImport,
}: {
  dataset: DataSchemaDataset
  pendingKey: string | null
  onImport: (action: {
    key: `import:${string}` | `import-snap:${string}`
    table: string
    snapshotId?: string
    confirmMessage: string
  }) => void
}) {
  const [selectedSnapshot, setSelectedSnapshot] = useState(dataset.snapshotIds[0] ?? '')
  const importKey = `import:${dataset.table}` as const
  const importSnapKey = `import-snap:${dataset.table}` as const

  return (
    <section className={dataSchemaTableSectionClassName}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="font-mono text-lg font-semibold text-gray-900">{dataset.table}</h2>
          {dataset.error ? <Pill color="red">Manifest-Fehler</Pill> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pendingKey !== null || !dataset.manifest}
            className={smallButtonClassName}
            onClick={() =>
              onImport({
                key: importKey,
                table: dataset.table,
                confirmMessage: `Tabelle data.${dataset.table} mit data.dump überschreiben?`,
              })
            }
          >
            {pendingKey === importKey ? 'Import…' : 'Import'}
          </button>

          {dataset.snapshotIds.length > 0 ? (
            <>
              <select
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                value={selectedSnapshot}
                onChange={(e) => setSelectedSnapshot(e.target.value)}
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
                  onImport({
                    key: importSnapKey,
                    table: dataset.table,
                    snapshotId: selectedSnapshot,
                    confirmMessage: `Tabelle data.${dataset.table} mit Snapshot ${selectedSnapshot} überschreiben?`,
                  })
                }
              >
                {pendingKey === importSnapKey ? 'Import…' : 'Snapshot importieren'}
              </button>
            </>
          ) : null}
        </div>
      </div>
      {dataset.error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {dataset.error}
        </p>
      ) : null}

      <dl className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <dt className="font-medium text-gray-500">Veröffentlicht am:</dt>
          <dd>
            {dataset.manifest?.publishedAt
              ? formatDateTimeBerlin(dataset.manifest.publishedAt)
              : '—'}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <dt className="font-medium text-gray-500">Zeilen (S3):</dt>
          <dd>{dataset.manifest ? dataset.manifest.rowCount.toLocaleString('de-DE') : '—'}</dd>
        </div>
        {dataset.spec?.provider ? (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="font-medium text-gray-500">Quelle:</dt>
            <dd>{dataset.spec.provider}</dd>
          </div>
        ) : null}
        {dataset.spec?.file ? (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="font-medium text-gray-500">Datei:</dt>
            <dd className="font-mono text-xs text-gray-600">{dataset.spec.file}</dd>
          </div>
        ) : null}
        {dataset.spec?.consumedBy ? (
          <div className="flex flex-wrap items-baseline gap-x-2 sm:col-span-2">
            <dt className="font-medium text-gray-500">Processing:</dt>
            <dd className="font-mono text-xs text-gray-600">{dataset.spec.consumedBy}</dd>
          </div>
        ) : null}
      </dl>

      {dataset.spec?.documentation ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-700">Quelle</summary>
          <blockquote className="mt-2 border-l-4 border-gray-300 pl-4 text-sm text-gray-800">
            <Markdown markdown={dataset.spec.documentation} headingStyle="compact" />
          </blockquote>
        </details>
      ) : null}

      <h3 className="mt-6 text-sm font-semibold text-gray-900">Verlauf</h3>
      {dataset.recentImports.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Keine Importe</p>
      ) : (
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-700">
          {dataset.recentImports.map((row) => (
            <li key={row.id}>
              <div className="flex flex-wrap items-center gap-2">
                <DataSchemaImportStatusPill status={row.status} />
                <span>{formatDateTimeBerlin(row.createdAt)}</span>
                {row.durationMs != null ? <span>{(row.durationMs / 1000).toFixed(1)}s</span> : null}
                {row.snapshotId ? (
                  <span className="font-mono text-xs">{row.snapshotId}</span>
                ) : (
                  <span className="text-gray-500">aktuell</span>
                )}
              </div>
              {row.errorText ? (
                <pre className="mt-1 max-h-32 overflow-auto rounded bg-red-50 p-2 text-xs whitespace-pre-wrap text-red-800">
                  {row.errorText}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

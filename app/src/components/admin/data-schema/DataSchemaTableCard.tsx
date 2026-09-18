import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { twJoin, twMerge } from 'tailwind-merge'
import { adminCardClassName } from '@/components/admin/adminClasses'
import { AdminDescriptionList } from '@/components/admin/AdminDescriptionList'
import { DataSchemaImportStatusPill } from '@/components/admin/data-schema/DataSchemaImportStatusPill'
import { formatDateTimeBerlinWithWeekday } from '@/components/shared/date/formatDateBerlin'
import { buttonStyles, buttonStylesSecondary } from '@/components/shared/links/styles'
import { Markdown } from '@/components/shared/text/Markdown'
import { Pill } from '@/components/shared/text/Pill'
import type { getDataSchemaOverviewLoaderFn } from '@/server/dataSchema/dataSchema.functions'

const smallButtonClassName = twMerge(buttonStyles, 'px-3 py-1.5 text-sm')
const smallSecondaryButtonClassName = twMerge(
  buttonStylesSecondary,
  // `buttonStylesSecondary` has no disabled treatment; add one for the empty-snapshots state.
  'gap-1.5 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-yellow-300 disabled:hover:bg-white',
)

type DataSchemaDataset = Awaited<
  ReturnType<typeof getDataSchemaOverviewLoaderFn>
>['datasets'][number]

/** Import request; `PageDataSchema` confirms it in a dialog before running it. */
export type DataSchemaImportRequest = {
  table: string
  /** Omit for the current dump (`data.dump`). */
  snapshotId?: string
}

const snapshotIdRegex = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})$/

/** Snapshot ids are UTC `YYYYMMDDTHHmm` (see `dataSchemaSnapshotId`); format for display. */
export function formatSnapshotId(snapshotId: string) {
  const match = snapshotIdRegex.exec(snapshotId)
  if (!match) return snapshotId
  const [, year, month, day, hour, minute] = match
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)),
  )
  return formatDateTimeBerlinWithWeekday(date)
}

type Props = {
  dataset: DataSchemaDataset
  onImport: (request: DataSchemaImportRequest) => void
}

export function DataSchemaTableCard({ dataset, onImport }: Props) {
  const hasSnapshots = dataset.snapshotIds.length > 0

  return (
    <section
      aria-labelledby={`${dataset.table}-title`}
      className={twJoin(adminCardClassName, 'p-4 sm:p-6')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2
            id={`${dataset.table}-title`}
            className="font-mono text-base/7 font-semibold text-gray-900"
          >
            data.{dataset.table}
          </h2>
          {dataset.error ? <Pill color="red">Manifest-Fehler</Pill> : null}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!dataset.manifest}
            className={smallButtonClassName}
            onClick={() => onImport({ table: dataset.table })}
          >
            Importieren
          </button>

          <Menu as="div" className="relative">
            <MenuButton disabled={!hasSnapshots} className={smallSecondaryButtonClassName}>
              Älteren Snapshot zurückspielen
              <ChevronDownIcon aria-hidden="true" className="-mr-1 size-4 text-gray-400" />
            </MenuButton>
            {hasSnapshots ? (
              <MenuItems
                anchor="bottom end"
                className="z-40 w-72 rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-900/5 [--anchor-gap:4px] focus:outline-none"
              >
                {dataset.snapshotIds.map((id) => (
                  <MenuItem key={id}>
                    <button
                      type="button"
                      onClick={() => onImport({ table: dataset.table, snapshotId: id })}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                    >
                      Snapshot {formatSnapshotId(id)} zurückspielen
                    </button>
                  </MenuItem>
                ))}
              </MenuItems>
            ) : null}
          </Menu>
        </div>
      </div>
      {dataset.error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {dataset.error}
        </p>
      ) : null}

      <div className="mt-6">
        <AdminDescriptionList
          items={[
            {
              label: 'Veröffentlicht am',
              value: dataset.manifest?.publishedAt
                ? formatDateTimeBerlinWithWeekday(dataset.manifest.publishedAt)
                : null,
            },
            {
              label: 'Zeilen (S3)',
              value: dataset.manifest ? dataset.manifest.rowCount.toLocaleString('de-DE') : null,
            },
            { label: 'Quelle', value: dataset.spec?.provider },
            {
              label: 'Datei',
              value: dataset.spec?.file ? (
                <code className="text-xs">{dataset.spec.file}</code>
              ) : null,
            },
            {
              label: 'Processing',
              value: dataset.spec?.consumedBy ? (
                <code className="text-xs">{dataset.spec.consumedBy}</code>
              ) : null,
            },
          ]}
        />
      </div>

      {dataset.spec?.documentation ? (
        <details className="mt-4 rounded-md bg-gray-50 px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Dokumentation der Quelle
          </summary>
          <div className="mt-2 text-sm text-gray-800">
            <Markdown markdown={dataset.spec.documentation} headingStyle="compact" />
          </div>
        </details>
      ) : null}

      <h3 className="mt-6 text-sm font-semibold text-gray-900">Letzte Importe</h3>
      {dataset.recentImports.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Noch keine Importe vorhanden.</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100 text-sm text-gray-700">
          {dataset.recentImports.map((row) => (
            <li key={row.id} className="py-2 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <DataSchemaImportStatusPill status={row.status} />
                <span>{formatDateTimeBerlinWithWeekday(row.createdAt)}</span>
                {row.durationMs != null ? (
                  <span className="tabular-nums">
                    {(row.durationMs / 1000).toLocaleString('de-DE', {
                      maximumFractionDigits: 1,
                    })}{' '}
                    s
                  </span>
                ) : null}
                {row.snapshotId ? (
                  <code className="text-xs">{row.snapshotId}</code>
                ) : (
                  <span className="text-gray-500">aktueller Dump</span>
                )}
              </div>
              {row.errorText ? (
                <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-red-50 p-2 text-xs whitespace-pre-wrap text-red-800">
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

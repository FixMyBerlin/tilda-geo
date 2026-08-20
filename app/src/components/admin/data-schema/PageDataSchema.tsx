import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import {
  DataSchemaTableCard,
  dataSchemaTableSectionClassName,
} from '@/components/admin/data-schema/DataSchemaTableCard'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { Link } from '@/components/shared/links/Link'
import { Spinner } from '@/components/shared/Spinner/Spinner'
import { importDataSchemaTableFn } from '@/server/dataSchema/dataSchema.functions'
import {
  dataSchemaOverviewQueryKey,
  dataSchemaOverviewQueryOptions,
} from '@/server/dataSchema/dataSchemaOverviewQueryOptions'

type DataSchemaAction = {
  key: `import:${string}` | `import-snap:${string}`
  table: string
  snapshotId?: string
}

export function PageDataSchema() {
  const queryClient = useQueryClient()
  const { data, isPending, isError, error: queryError } = useQuery(dataSchemaOverviewQueryOptions())
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    mutate,
    isPending: isMutating,
    variables,
  } = useMutation({
    mutationFn: async (action: DataSchemaAction) => {
      return importDataSchemaTableFn({
        data: { table: action.table, snapshotId: action.snapshotId ?? null },
      })
    },
    onSuccess: async (result) => {
      setError(null)
      setFeedback(
        result.warning ? `Aktion abgeschlossen. ${result.warning}` : 'Aktion abgeschlossen.',
      )
      await queryClient.invalidateQueries({ queryKey: dataSchemaOverviewQueryKey })
    },
    onError: (e) => {
      setFeedback(null)
      setError(e instanceof Error ? e.message : String(e))
    },
  })

  const pendingKey = isMutating && variables ? variables.key : null
  const datasets = data?.datasets ?? []
  const listError = data?.listError ?? null
  const loadError = isError
    ? queryError instanceof Error
      ? queryError.message
      : String(queryError)
    : error

  function runAction(action: DataSchemaAction & { confirmMessage: string }) {
    const { confirmMessage, ...importAction } = action
    if (!window.confirm(confirmMessage)) return
    setFeedback(null)
    setError(null)
    mutate(importAction)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/data-schema', name: 'Data-Schema' }]} />
      </HeaderWrapper>

      <section className={dataSchemaTableSectionClassName}>
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
        {loadError ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {loadError}
          </p>
        ) : null}
      </section>

      {isPending ? (
        <section className={twMerge(dataSchemaTableSectionClassName, 'mt-8')}>
          <div className="py-8 text-center" role="status" aria-live="polite" aria-busy="true">
            <Spinner className="mx-auto" color="yellow" screenReaderLabel={false} size="8" />
            <p className="mt-4 text-base text-gray-500">Laden …</p>
          </div>
        </section>
      ) : isError ? (
        <section className={twMerge(dataSchemaTableSectionClassName, 'mt-8')}>
          <p className="text-sm text-gray-600">Tabellen konnten nicht geladen werden.</p>
        </section>
      ) : datasets.length === 0 ? (
        <section className={twMerge(dataSchemaTableSectionClassName, 'mt-8')}>
          <p className="text-sm text-gray-600">Keine Tabellen unter data-schema/ in S3 gefunden.</p>
        </section>
      ) : (
        <div className="mt-8 space-y-8">
          {datasets.map((dataset) => (
            <DataSchemaTableCard
              key={dataset.table}
              dataset={dataset}
              pendingKey={pendingKey}
              onImport={runAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

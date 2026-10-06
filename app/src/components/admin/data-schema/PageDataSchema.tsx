import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminIntro } from '@/components/admin/AdminIntro'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  type DataSchemaImportRequest,
  DataSchemaTableCard,
  formatSnapshotId,
} from '@/components/admin/data-schema/DataSchemaTableCard'
import { ConfirmDialog } from '@/components/shared/dialog/ConfirmDialog'
import { Link } from '@/components/shared/links/Link'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { importDataSchemaTableFn } from '@/server/dataSchema/dataSchema.functions'
import {
  dataSchemaOverviewQueryKey,
  dataSchemaOverviewQueryOptions,
} from '@/server/dataSchema/dataSchemaOverviewQueryOptions'

export function PageDataSchema() {
  const queryClient = useQueryClient()
  const { data } = useSuspenseQuery(dataSchemaOverviewQueryOptions())
  const [importRequest, setImportRequest] = useState<DataSchemaImportRequest | null>(null)

  const datasets = data.datasets
  const listError = data.listError

  // Errors are thrown into the dialog (`ConfirmDialog` shows them and stays open).
  const runImport = useMutation({
    mutationFn: async () => {
      if (!importRequest) return
      return importDataSchemaTableFn({
        data: { table: importRequest.table, snapshotId: importRequest.snapshotId ?? null },
      })
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: dataSchemaOverviewQueryKey })
      setImportRequest(null)
      toastSuccess(result?.warning ? `Importiert. ${result.warning}` : 'Importiert.')
    },
  })

  return (
    <>
      <AdminPageHeader
        title="Data-Schema"
        intro={
          <AdminIntro>
            <p>
              <strong>Importieren</strong> ersetzt eine Tabelle unter <code>data.*</code> durch den
              S3-Dump (<code>data.dump</code>) oder einen Snapshot. Karten-Layer aus dem Processing
              sehen die Daten erst nach einem Rebuild der <code>public.*</code>-Tabellen — siehe{' '}
              <Link to="/admin/processing">Processing-Läufe</Link>.
            </p>
          </AdminIntro>
        }
      />

      {listError ? (
        <p
          role="alert"
          className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-600/10"
        >
          S3-Liste konnte nicht geladen werden: {listError}
        </p>
      ) : null}

      {datasets.length === 0 ? (
        <AdminEmptyState>Noch keine Tabellen unter data-schema/ in S3 vorhanden.</AdminEmptyState>
      ) : (
        <div className="space-y-6">
          {datasets.map((dataset) => (
            <DataSchemaTableCard
              key={dataset.table}
              dataset={dataset}
              onImport={setImportRequest}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={importRequest !== null}
        setOpen={(open) => {
          if (!open) setImportRequest(null)
        }}
        tone="danger"
        icon={ExclamationTriangleIcon}
        title={importRequest ? `data.${importRequest.table} überschreiben?` : ''}
        description={
          importRequest?.snapshotId
            ? `Die Tabelle wird durch den Snapshot ${formatSnapshotId(importRequest.snapshotId)} ersetzt.`
            : 'Die Tabelle wird durch den aktuellen S3-Dump (data.dump) ersetzt.'
        }
        confirmLabel="Importieren"
        onConfirm={async () => {
          await runImport.mutateAsync()
        }}
      />
    </>
  )
}

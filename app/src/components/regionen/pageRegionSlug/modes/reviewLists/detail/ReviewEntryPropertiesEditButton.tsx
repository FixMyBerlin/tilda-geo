import { TableCellsIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState, type FormEvent, type MouseEvent } from 'react'
import { twJoin } from 'tailwind-merge'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import {
  inputBase,
  inputError,
  inputNormal,
  labelClass,
} from '@/components/shared/form/fields/sharedStyles'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { captureModalOpenOrigin } from '@/components/shared/motion/modalOpenOrigin'
import { toastError } from '@/components/shared/toast/toastError'
import { reviewEntriesQueryOptions } from '@/server/regions/regionQueryOptions'
import { getReviewEntryFn, updateReviewEntryFn } from '@/server/review-lists/review-lists.functions'
import { modePanelHeaderIconButtonClassName } from '../../modePanel.const'
import {
  buildInitialRows,
  collectUnionKeys,
  ensureTrailingEmpty,
  serializePropertyRows,
  validatePropertyRows,
  type PropertyRow,
} from './reviewEntryPropertiesRows'

type Props = { entryId: number; listId: number }

export const ReviewEntryPropertiesEditButton = ({ entryId, listId }: Props) => {
  const hasPermissions = useHasPermissions()
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<PropertyRow[]>([])

  const { data: entry } = useQuery({
    queryKey: ['review-lists', 'getReviewEntry', { regionSlug, entryId }],
    queryFn: () => getReviewEntryFn({ data: { regionSlug, entryId } }),
  })
  const { data: listEntries } = useQuery(reviewEntriesQueryOptions(regionSlug, listId))

  const rowErrors = validatePropertyRows(rows)
  const saveDisabled = rowErrors.size > 0

  const save = useMutation({
    mutationFn: (properties: Record<string, string>) =>
      updateReviewEntryFn({ data: { regionSlug, entryId, properties } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['review-lists', 'getReviewEntry'] }),
        queryClient.invalidateQueries({ queryKey: ['review-lists', 'getReviewEntriesForList'] }),
      ])
      setOpen(false)
    },
    onError: (error) => toastError(error, 'Attribute konnten nicht gespeichert werden.'),
  })

  if (!hasPermissions) return null

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    captureModalOpenOrigin(event.currentTarget)
    setRows(
      buildInitialRows(
        entry?.properties,
        collectUnionKeys(listEntries?.featureCollection.features ?? []),
      ),
    )
    setOpen(true)
  }

  const updateRow = (rowKey: string, patch: Partial<Pick<PropertyRow, 'key' | 'value'>>) => {
    setRows((current) =>
      ensureTrailingEmpty(current.map((row) => (row._key === rowKey ? { ...row, ...patch } : row))),
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saveDisabled || save.isPending) return
    save.mutate(serializePropertyRows(rows))
  }

  return (
    <>
      <button
        type="button"
        aria-label="Attribute bearbeiten"
        onClick={handleOpen}
        className={modePanelHeaderIconButtonClassName}
      >
        <TableCellsIcon className="size-5" aria-hidden />
      </button>

      <ModalDialog
        title="Attribute bearbeiten"
        icon="edit"
        mode="reviewLists"
        buttonCloseName="Abbrechen"
        open={open}
        setOpen={setOpen}
        panelTestId="review-entry-properties-edit"
        primaryAction={
          <button
            type="submit"
            form={formId}
            disabled={saveDisabled || save.isPending}
            className={twJoin(buttonStylesOnYellow, 'inline-flex w-full justify-center sm:w-auto')}
          >
            Speichern
          </button>
        }
      >
        {open ? (
          <form id={formId} onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-gray-600">
              Leere Werte werden beim Speichern entfernt. Eine neue Zeile erscheint, sobald ein
              Schlüssel eingetragen wird.
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-2">
              <span className={labelClass}>Schlüssel</span>
              <span className={labelClass}>Wert</span>
              {rows.map((row, index) => {
                const error = rowErrors.get(row._key)
                const errorId = `${formId}-error-${row._key}`
                return (
                  <div key={row._key} className="col-span-2 grid grid-cols-2 gap-x-2">
                    <div>
                      <input
                        value={row.key}
                        aria-label={`Schlüssel ${index + 1}`}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? errorId : undefined}
                        disabled={save.isPending}
                        autoComplete="off"
                        data-1p-ignore
                        data-lpignore
                        onChange={(event) => updateRow(row._key, { key: event.target.value })}
                        className={twJoin(inputBase, error ? inputError : inputNormal)}
                      />
                      {error ? (
                        <p id={errorId} role="alert" className="mt-1 text-sm text-red-800">
                          {error}
                        </p>
                      ) : null}
                    </div>
                    <input
                      value={row.value}
                      aria-label={`Wert ${index + 1}`}
                      disabled={save.isPending}
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore
                      onChange={(event) => updateRow(row._key, { value: event.target.value })}
                      className={twJoin(inputBase, inputNormal)}
                    />
                  </div>
                )
              })}
            </div>
          </form>
        ) : null}
      </ModalDialog>
    </>
  )
}

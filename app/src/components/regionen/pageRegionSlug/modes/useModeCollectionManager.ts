import { type QueryKey, useMutation, useQueryClient } from '@tanstack/react-query'

type ModeCollectionManagerOptions<TCreated> = {
  createFn: (name: string) => Promise<TCreated>
  renameFn: (input: { id: number; name: string }) => Promise<unknown>
  deleteFn: (id: number) => Promise<unknown>
  invalidateKeys: QueryKey[]
  onAfterCreate?: (created: TCreated) => void
  onAfterDelete?: (id: number) => void
}

/**
 * Create/rename/delete plus cache invalidation for Prüflisten selectors.
 * `ReviewListSelect` owns the name modal and extra actions.
 */
export const useModeCollectionManager = <TCreated>({
  createFn,
  renameFn,
  deleteFn,
  invalidateKeys,
  onAfterCreate,
  onAfterDelete,
}: ModeCollectionManagerOptions<TCreated>) => {
  const queryClient = useQueryClient()

  const invalidate = () =>
    Promise.all(invalidateKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))

  const create = useMutation({
    mutationFn: createFn,
    onSuccess: async (created) => {
      await invalidate()
      onAfterCreate?.(created)
    },
  })
  const rename = useMutation({
    mutationFn: renameFn,
    onSuccess: () => invalidate(),
  })
  const remove = useMutation({
    mutationFn: deleteFn,
    onSuccess: async (_result, id) => {
      await invalidate()
      onAfterDelete?.(id)
    },
  })

  return { invalidate, create, rename, remove }
}

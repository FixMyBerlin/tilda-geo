import { type QueryClient, queryOptions } from '@tanstack/react-query'
import {
  applyComposerDraftSlot,
  clearComposerDraftSlot,
  type ComposerDraftsForUser,
  readComposerDraftsForUser,
  writeComposerDraftSlot,
} from './composerDraftStorage'

const composerDraftsQueryKey = (userId: string) => ['composerDrafts', userId] as const

export const composerDraftsQueryOptions = (userId: string | undefined) => {
  return queryOptions({
    queryKey: composerDraftsQueryKey(userId ?? ''),
    queryFn: () =>
      userId ? readComposerDraftsForUser(userId) : ({} satisfies ComposerDraftsForUser),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

export const setComposerDraft = (
  queryClient: QueryClient,
  userId: string,
  draftId: string,
  values: Record<string, string>,
) => {
  writeComposerDraftSlot(userId, draftId, values)
  queryClient.setQueryData(composerDraftsQueryOptions(userId).queryKey, (prev) => {
    const base = prev ?? readComposerDraftsForUser(userId)
    return applyComposerDraftSlot(base, draftId, values)
  })
}

export const clearComposerDraft = (queryClient: QueryClient, userId: string, draftId: string) => {
  clearComposerDraftSlot(userId, draftId)
  queryClient.setQueryData(composerDraftsQueryOptions(userId).queryKey, (prev) => {
    const base = prev ?? readComposerDraftsForUser(userId)
    const { [draftId]: _, ...rest } = applyComposerDraftSlot(base, draftId, {})
    return rest
  })
}

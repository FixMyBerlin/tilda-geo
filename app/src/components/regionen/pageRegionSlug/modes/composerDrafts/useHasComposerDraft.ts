import { useQuery } from '@tanstack/react-query'
import { authClient } from '@/components/shared/auth/auth-client'
import { internalNewNoteDraftId, osmNewNoteDraftId } from './composerDraftIds'
import { composerDraftsQueryOptions } from './composerDraftsQueryOptions'
import { isComposerDraftExpired, type ComposerDraftsForUser } from './composerDraftStorage'

export const useHasComposerDraft = (draftId: string | undefined) => {
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id
  const { data: hasDraft } = useQuery({
    ...composerDraftsQueryOptions(userId),
    enabled: Boolean(userId && draftId),
    select: (drafts: ComposerDraftsForUser) => {
      if (!draftId) return false
      const slot = drafts[draftId]
      return Boolean(slot && !isComposerDraftExpired(slot))
    },
  })
  return Boolean(hasDraft)
}

export const useHasNewNoteComposerDraft = (
  regionSlug: string | undefined,
  kind: 'internal' | 'osm',
) => {
  const draftId = regionSlug
    ? kind === 'osm'
      ? osmNewNoteDraftId(regionSlug)
      : internalNewNoteDraftId(regionSlug)
    : undefined
  return useHasComposerDraft(draftId)
}

import { useDebouncer } from '@tanstack/react-pacer'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { authClient } from '@/components/shared/auth/auth-client'
import {
  composerDraftsQueryOptions,
  clearComposerDraft,
  setComposerDraft,
} from './composerDraftsQueryOptions'
import {
  isComposerDraftExpired,
  isEmptyComposerDraftValues,
  type ComposerDraftsForUser,
} from './composerDraftStorage'

const serializeComposerDraftValues = (values: Record<string, string>) => JSON.stringify(values)

export const confirmDiscardComposerDraft = (values: Record<string, string>) => {
  if (isEmptyComposerDraftValues(values)) return true
  return window.confirm('Ungespeicherte Änderungen gehen verloren. Fortfahren?')
}

export const useComposerDraft = (draftId: string) => {
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id
  // Prevents the autosave subscription from re-arming the debouncer and resurrecting the draft
  // via the unmount flush between clearDraft() and the `key` remount.
  const discardedRef = useRef(false)

  const query = useQuery({
    ...composerDraftsQueryOptions(userId),
    enabled: Boolean(userId),
    select: (drafts: ComposerDraftsForUser) => {
      const slot = drafts[draftId]
      if (!slot || isComposerDraftExpired(slot)) return undefined
      return slot.values
    },
  })

  const draftValues = query.data
  const isReady = !userId || query.status !== 'pending'

  const debouncer = useDebouncer(
    function persistComposerDraft(targetDraftId: string, values: Record<string, string>) {
      if (discardedRef.current || !userId) return
      const slot = queryClient.getQueryData(composerDraftsQueryOptions(userId).queryKey)?.[
        targetDraftId
      ]
      if (isEmptyComposerDraftValues(values)) {
        if (!slot) return
        clearComposerDraft(queryClient, userId, targetDraftId)
        return
      }
      if (
        slot &&
        serializeComposerDraftValues(slot.values) === serializeComposerDraftValues(values)
      ) {
        return
      }
      setComposerDraft(queryClient, userId, targetDraftId, values)
    },
    {
      wait: 500,
      onUnmount: (d) => {
        if (discardedRef.current) {
          d.cancel()
          return
        }
        d.flush()
      },
    },
  )

  useEffect(
    function flushComposerDraftOnHidden() {
      function flushDraftOnHidden() {
        if (document.hidden) debouncer.flush()
      }
      document.addEventListener('visibilitychange', flushDraftOnHidden)
      return function removeFlushComposerDraftOnHidden() {
        document.removeEventListener('visibilitychange', flushDraftOnHidden)
      }
    },
    [debouncer],
  )

  const saveDraft = (values: Record<string, string>) => {
    if (discardedRef.current || !userId) return
    debouncer.maybeExecute(draftId, values)
  }

  const clearDraft = () => {
    discardedRef.current = true
    debouncer.cancel()
    if (!userId) return
    clearComposerDraft(queryClient, userId, draftId)
  }

  return { isReady, draftValues, saveDraft, clearDraft }
}

import { useEffect, useEffectEvent } from 'react'
import type { FormApi } from '@/components/shared/form/types'
import { toComposerDraftStringValues } from './composerDraftStorage'

type Props<T extends Record<string, unknown>> = {
  form: FormApi<T>
  saveDraft: (values: Record<string, string>) => void
}

export function ComposerDraftAutosave<T extends Record<string, unknown>>({
  form,
  saveDraft,
}: Props<T>) {
  const persistDraft = useEffectEvent((values: object) => {
    saveDraft(toComposerDraftStringValues(values))
  })

  useEffect(
    function subscribeComposerDraftToForm() {
      const { unsubscribe } = form.store.subscribe((state) => {
        persistDraft(state.values)
      })
      return function unsubscribeComposerDraftFromForm() {
        unsubscribe()
      }
    },
    [form],
  )

  return null
}

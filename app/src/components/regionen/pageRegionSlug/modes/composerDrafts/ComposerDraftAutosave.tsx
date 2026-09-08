import { useEffect, useRef } from 'react'
import type { FormApi } from '@/components/shared/form/types'
import { toComposerDraftStringValues } from './composerDraftStorage'

type Props<T extends Record<string, unknown>> = {
  form: FormApi<T>
  saveDraft: (values: Record<string, string>) => void
}

function ComposerDraftValuesListener({
  values,
  saveDraft,
}: {
  values: object
  saveDraft: (values: Record<string, string>) => void
}) {
  const saveDraftRef = useRef(saveDraft)
  const isFirstValuesEffectRef = useRef(true)

  useEffect(
    function syncComposerDraftSaveFn() {
      saveDraftRef.current = saveDraft
    },
    [saveDraft],
  )

  useEffect(
    function persistComposerDraftOnValuesChange() {
      if (isFirstValuesEffectRef.current) {
        isFirstValuesEffectRef.current = false
        return
      }
      saveDraftRef.current(toComposerDraftStringValues(values))
    },
    [values],
  )
  return null
}

export function ComposerDraftAutosave<T extends Record<string, unknown>>({
  form,
  saveDraft,
}: Props<T>) {
  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => <ComposerDraftValuesListener values={values} saveDraft={saveDraft} />}
    </form.Subscribe>
  )
}

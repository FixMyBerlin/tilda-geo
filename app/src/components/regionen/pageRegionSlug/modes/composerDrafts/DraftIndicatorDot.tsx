import { useHasComposerDraft } from './useHasComposerDraft'

export function DraftIndicatorDot() {
  return (
    <span className="pointer-events-none absolute top-0 right-0 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 ring-2 ring-white">
      <span className="sr-only">Entwurf vorhanden</span>
    </span>
  )
}

export function ComposerDraftDot({ draftId }: { draftId: string | undefined }) {
  const hasDraft = useHasComposerDraft(draftId)
  if (!hasDraft) return null
  return <DraftIndicatorDot />
}

import { useSearch } from '@tanstack/react-router'
import { useRegionSearchNavigation } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useRegionSearchNavigation'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { compactNotesModeParam, zodNotesModeParam, type NotesModeParam } from './notesModeParam'

/**
 * Read the notes mode URL param (`notes` JSON). Route-agnostic (`strict: false`) so the
 * shared map layer can read it too; returns `{}` when the param is absent.
 */
export const useNotesModeValue = () => {
  const notesMode = useSearch({
    strict: false,
    select: (search) => search[searchParamsRegistry.notes],
  })
  return zodNotesModeParam.safeParse(notesMode).data ?? {}
}

/**
 * Read/update the notes mode param. Use inside the notes mode panel. Updates preserve all other
 * search params and replace history (filter/selector tweaks should not spam the back button).
 */
export const useNotesModeParam = () => {
  const notesMode = useNotesModeValue()
  const { updateSearch } = useRegionSearchNavigation()

  const setNotesModeParam = (next: NotesModeParam) => {
    updateSearch({ [searchParamsRegistry.notes]: compactNotesModeParam(next) }, { replace: true })
  }

  return { notesMode, setNotesModeParam }
}

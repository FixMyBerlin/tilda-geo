import { useNavigate, useSearch } from '@tanstack/react-router'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { compactNotesModeParam, zodNotesModeParam, type NotesModeParam } from './notesModeParam'

/**
 * Read the notes mode URL param (`notesMode` JSON). Route-agnostic (`strict: false`) so the
 * shared map layer can read it too; returns `{}` when the param is absent.
 */
export const useNotesModeValue = () => {
  const notesMode = useSearch({
    strict: false,
    select: (search) => search[searchParamsRegistry.notesMode],
  })
  return zodNotesModeParam.safeParse(notesMode).data ?? {}
}

/**
 * Read/update the notes mode param. Use inside the notes mode panel. Updates preserve all other
 * search params and replace history (filter/selector tweaks should not spam the back button).
 */
export const useNotesModeParam = () => {
  const notesMode = useNotesModeValue()
  const navigate = useNavigate()

  const setNotesModeParam = (next: NotesModeParam) => {
    void navigate({
      to: '.',
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        [searchParamsRegistry.notesMode]: compactNotesModeParam(next),
      }),
      replace: true,
    })
  }

  return { notesMode, setNotesModeParam }
}

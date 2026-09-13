import { useEffect } from 'react'
import { toastError } from '@/components/shared/toast/toastError'
import { useOsmNotesQuery } from './useOsmNotesQuery'

/** Mounts the OSM-notes query on the app QueryClient and toasts a load failure once. */
export const OsmNotes = () => {
  const { isError, error } = useOsmNotesQuery()

  useEffect(
    function toastOsmNotesLoadError() {
      if (!isError) return
      toastError(error, 'OSM-Hinweise konnten nicht geladen werden.')
    },
    [isError, error],
  )

  return null
}

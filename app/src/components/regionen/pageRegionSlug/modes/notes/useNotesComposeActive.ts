import { useNotesComposePin } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesComposePin'

/** True while creating a note: `osmNote` or `internalNote` is set in the URL. */
export const useNotesComposeActive = () => {
  const { isComposing } = useNotesComposePin()
  return isComposing
}

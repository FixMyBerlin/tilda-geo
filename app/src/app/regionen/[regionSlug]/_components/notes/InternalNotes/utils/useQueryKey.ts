import { useInternalNotesFilterParam } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useNotesAtlasParams'
import getNotesAndCommentsForRegion from '@/src/server/notes/queries/getNotesAndCommentsForRegion'
import { getQueryKey } from '@blitzjs/rpc'
import { useStaticRegion } from '../../../regionUtils/useStaticRegion'

export const useQueryKey = () => {
  const region = useStaticRegion()!
  const { internalNotesFilterParam } = useInternalNotesFilterParam()
  return getQueryKey(getNotesAndCommentsForRegion, {
    regionSlug: region.slug,
    filter: internalNotesFilterParam,
  })
}

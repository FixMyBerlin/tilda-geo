import {
  parseFeaturesParam,
  serializeFeaturesParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/featuresParamCodec'
import { compactNotesModeParam } from '@/components/regionen/pageRegionSlug/modes/notes/notesModeParam'
import { compactReviewListsModeParam } from '@/components/regionen/pageRegionSlug/modes/reviewLists/reviewListsModeParam'
import type { RegionSearch } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { filterUrlFeaturesForMode } from './modeScopedSelection'
import type { RegionMode } from './useCurrentMode'

/**
 * Drop compose/move flags and mode-owned `f` selections that do not belong on this mode.
 * Used from route `search.middlewares` (link building, load, and history).
 */
export const stripModeScopedSearch = (search: RegionSearch, mode: RegionMode) => {
  const notesKey = searchParamsRegistry.notes
  const reviewKey = searchParamsRegistry.review
  const featuresKey = searchParamsRegistry.f
  let next = search

  if (mode !== 'notes' && search[notesKey]?.new) {
    next = {
      ...next,
      [notesKey]: compactNotesModeParam({ ...search[notesKey], new: undefined }),
    }
  }

  if (mode !== 'reviewLists' && (search[reviewKey]?.new || search[reviewKey]?.move)) {
    next = {
      ...next,
      [reviewKey]: compactReviewListsModeParam({
        ...search[reviewKey],
        new: undefined,
        move: undefined,
      }),
    }
  }

  const featuresWire = search[featuresKey]
  if (featuresWire) {
    const parsed = parseFeaturesParam(featuresWire)
    const filtered = filterUrlFeaturesForMode(parsed, mode)
    if (filtered.length !== parsed.length) {
      next = {
        ...next,
        [featuresKey]: filtered.length > 0 ? serializeFeaturesParam(filtered) : undefined,
      }
    }
  }

  return next
}

export const modeScopedSearchMiddleware = (mode: RegionMode) => {
  return ({
    search,
    next,
  }: {
    search: RegionSearch
    next: (search: RegionSearch) => RegionSearch
  }) => next(stripModeScopedSearch(search, mode))
}

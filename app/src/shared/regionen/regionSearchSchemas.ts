import { z } from 'zod'
import {
  defaultBackgroundParam,
  validBackgroundParams,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/backgroundParam.const'
import {
  jsurlParse,
  jurlStringify,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v1/jurlParseStringify'
import {
  parseMapParam,
  serializeMapParam,
  type MapParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import { mapParamFallback } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParamFallback.const'
import type { DrawArea } from '@/components/regionen/pageRegionSlug/Map/Calculator/drawing/drawAreaTypes'
import { zodNotesModeParam } from '@/components/regionen/pageRegionSlug/modes/notes/notesModeParam'
import {
  defaultQaParam,
  zodQaParam,
} from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import { zodReviewListsModeParam } from '@/components/regionen/pageRegionSlug/modes/reviewLists/reviewListsModeParam'
import {
  optionalSearchJson,
  optionalSearchBoolean,
  optionalSearchString,
  searchBoolean,
  searchStringArray,
} from '@/lib/searchParamsSchema'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

const parseDrawParam = (query: string | undefined): DrawArea[] => {
  if (!query) return []
  const parsed = jsurlParse(query)
  return Array.isArray(parsed) ? (parsed as DrawArea[]) : []
}

export const serializeDrawParam = (areas: DrawArea[]) => {
  if (areas.length === 0) return undefined
  return jurlStringify(areas)
}

export const defaultMapSearchValue = serializeMapParam(mapParamFallback)

const normalizeMapSearchParam = (raw: unknown, defaultValue: string) => {
  const wire = optionalSearchString().safeParse(raw).data
  if (!wire) return defaultValue
  const parsed = parseMapParam(wire)
  return parsed ? serializeMapParam(parsed) : defaultValue
}

const mapSearchParam = (defaultValue: string) =>
  z.preprocess(
    (raw) => normalizeMapSearchParam(raw, defaultValue),
    z.string().default(defaultValue).catch(defaultValue),
  )

const backgroundSearchParam = () =>
  optionalSearchString()
    .transform((s) => s ?? defaultBackgroundParam)
    .pipe(z.enum(validBackgroundParams).catch(defaultBackgroundParam))

export const regionDialogParamSchema = z.enum(['welcome', 'download', 'docs'])

export type RegionDialogParam = z.infer<typeof regionDialogParamSchema>

export const regionSearchSchema = z.object({
  [searchParamsRegistry.v]: optionalSearchString(),
  [searchParamsRegistry.map]: mapSearchParam(defaultMapSearchValue),
  [searchParamsRegistry.config]: optionalSearchString(),
  [searchParamsRegistry.data]: searchStringArray().default([]),
  [searchParamsRegistry.f]: optionalSearchString(),
  [searchParamsRegistry.bg]: backgroundSearchParam(),
  [searchParamsRegistry.bg3d]: searchBoolean(false),
  [searchParamsRegistry.draw]: optionalSearchString(),
  [searchParamsRegistry.osmNote]: optionalSearchString(),
  [searchParamsRegistry.internalNote]: optionalSearchString(),
  [searchParamsRegistry.debugMap]: optionalSearchBoolean(),
  [searchParamsRegistry.qa]: optionalSearchJson(zodQaParam),
  // Invalid values (e.g. ?dialog=foo) clear rather than throwing the region route into error UI.
  [searchParamsRegistry.dialog]: regionDialogParamSchema.optional().catch(undefined),
  [searchParamsRegistry.welcomeSkipDialog]: z
    .literal(regionDialogParamSchema.enum.welcome)
    .optional()
    .catch(undefined),
  // Mode filters stay on the shared region search so switching modes keeps one URL without
  // per-child validateSearch schemas.
  [searchParamsRegistry.notesMode]: optionalSearchJson(zodNotesModeParam),
  [searchParamsRegistry.reviewLists]: optionalSearchJson(zodReviewListsModeParam),
})

export type RegionSearch = z.infer<typeof regionSearchSchema>

export const defaultRegionSearch = () => regionSearchSchema.parse({})

export const parseRegionSearch = (search: Record<string, unknown>) =>
  regionSearchSchema.parse(search)

export const getMapParamFromSearch = (search: RegionSearch): MapParam => {
  return parseMapParam(search[searchParamsRegistry.map]) ?? mapParamFallback
}

export const getQaParamFromSearch = (search: RegionSearch) => {
  return search[searchParamsRegistry.qa] ?? defaultQaParam
}

export const getDrawAreasFromSearch = (search: RegionSearch) => {
  return parseDrawParam(search[searchParamsRegistry.draw])
}

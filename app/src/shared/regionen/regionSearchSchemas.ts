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
import {
  optionalSearchJson,
  optionalSearchBoolean,
  optionalSearchString,
  searchBoolean,
  searchStringArray,
} from '@/lib/searchParamsSchema'
import {
  zodInternalNotesFilterParam,
  zodOsmFilterParam,
  zodQaFilterParam,
} from '@/shared/regionen/regionSearchZod'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

export type QaParamData = {
  configSlug: string
  style: string
}

/** Legacy key: renamed to user-pending-problematic so old URLs/bookmarks still work. */
const LEGACY_QA_STYLE_MAP: Record<string, string> = {
  'user-pending': 'user-pending-problematic',
}

export const parseQaParam = (query: string | undefined): QaParamData => {
  if (!query) return { configSlug: '', style: 'none' }
  const parts = query.split('--')
  if (parts.length < 2) return { configSlug: '', style: 'none' }
  const style = parts[parts.length - 1] || 'none'
  const configSlug = parts.slice(0, -1).join('--')
  return { configSlug, style: LEGACY_QA_STYLE_MAP[style] ?? style }
}

export const serializeQaParam = (data: QaParamData) => {
  if (!data.configSlug || data.style === 'none') return undefined
  return `${data.configSlug}--${data.style}`
}

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

const normalizeQaSearchParam = (raw: unknown) => {
  const wire = optionalSearchString().safeParse(raw).data
  return serializeQaParam(parseQaParam(wire)) ?? ''
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

const qaSearchParam = () => z.preprocess(normalizeQaSearchParam, z.string().default('').catch(''))

export const regionDialogParamSchema = z.enum(['welcome', 'download', 'docs'])

export type RegionDialogParam = z.infer<typeof regionDialogParamSchema>

export const regionSearchSchema = z.object({
  [searchParamsRegistry.map]: mapSearchParam(defaultMapSearchValue),
  [searchParamsRegistry.config]: optionalSearchString(),
  [searchParamsRegistry.data]: searchStringArray().default([]),
  [searchParamsRegistry.f]: optionalSearchString(),
  [searchParamsRegistry.bg]: backgroundSearchParam(),
  [searchParamsRegistry.bg3d]: searchBoolean(false),
  [searchParamsRegistry.draw]: optionalSearchString(),
  [searchParamsRegistry.osmNotes]: searchBoolean(false),
  [searchParamsRegistry.osmNote]: optionalSearchString(),
  [searchParamsRegistry.atlasNotes]: searchBoolean(false),
  [searchParamsRegistry.atlasNote]: optionalSearchString(),
  [searchParamsRegistry.atlasNotesFilter]: optionalSearchJson(zodInternalNotesFilterParam),
  [searchParamsRegistry.osmNotesFilter]: optionalSearchJson(zodOsmFilterParam),
  [searchParamsRegistry.debugMap]: optionalSearchBoolean(),
  [searchParamsRegistry.qa]: qaSearchParam(),
  [searchParamsRegistry.qaFilter]: optionalSearchJson(zodQaFilterParam),
  // Invalid values (e.g. ?dialog=foo) clear rather than throwing the region route into error UI.
  [searchParamsRegistry.dialog]: regionDialogParamSchema.optional().catch(undefined),
  [searchParamsRegistry.welcomeSkipDialog]: z
    .literal(regionDialogParamSchema.enum.welcome)
    .optional()
    .catch(undefined),
})

export type RegionSearch = z.infer<typeof regionSearchSchema>

export const defaultRegionSearch = () => regionSearchSchema.parse({})

export const parseRegionSearch = (search: Record<string, unknown>) =>
  regionSearchSchema.parse(search)

export const getMapParamFromSearch = (search: RegionSearch): MapParam => {
  return parseMapParam(search[searchParamsRegistry.map]) ?? mapParamFallback
}

export const getQaParamFromSearch = (search: RegionSearch): QaParamData => {
  return parseQaParam(search[searchParamsRegistry.qa] || undefined)
}

export const getDrawAreasFromSearch = (search: RegionSearch): DrawArea[] => {
  return parseDrawParam(search[searchParamsRegistry.draw])
}

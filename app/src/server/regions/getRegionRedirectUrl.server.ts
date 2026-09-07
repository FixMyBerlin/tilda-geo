import { createFreshCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import { migrateUrl } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/migrateUrl'
import type {
  MapDataCategoryConfig,
  MapDataCategoryParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { mergeCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/utils/mergeCategoriesConfig'
import { parse as parseConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/parse'
import { serialize as serializeConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/serialize'
import {
  parseMapParam,
  serializeMapParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import { mapParamFallback } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParamFallback.const'
import { getRegion } from '@/server/regions/queries/getRegion.server'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { resolveConfigTemplate } from '@/server/regions/regionConfigTemplates.server'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

const isTruthySearchFlag = (value: string | null) => value === 'true' || value === '1'

const qaParamHasKey = (qaValue: string | null) => {
  if (!qaValue) return false
  try {
    const parsed: unknown = JSON.parse(qaValue)
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'key' in parsed &&
      typeof parsed.key === 'string' &&
      parsed.key.length > 0
    )
  } catch {
    return false
  }
}

/** Legacy overlay bookmark: `qa` is present but is not already live JSON with a key. */
const isLegacyQaBookmark = (qaValue: string | null) => Boolean(qaValue) && !qaParamHasKey(qaValue)

/** Truthy overlay flags and/or pre-migration `atlasNote`. Live `osmNote`/`internalNote` are compose params. */
const isLegacyNotesOverlayBookmark = (params: URLSearchParams) =>
  isTruthySearchFlag(params.get('osmNotes')) ||
  isTruthySearchFlag(params.get('notes')) ||
  isTruthySearchFlag(params.get('internalNotes')) ||
  params.has('atlasNote')

/** Returns URL to redirect to, or null if no redirect. */
function sortedSearchParamEntries(searchParams: URLSearchParams) {
  return [...searchParams.entries()].sort(([a], [b]) => a.localeCompare(b))
}

function searchParamsSemanticallyEqual(a: URLSearchParams, b: URLSearchParams) {
  const aEntries = sortedSearchParamEntries(a)
  const bEntries = sortedSearchParamEntries(b)
  if (aEntries.length !== bEntries.length) return false
  return aEntries.every(([key, value], index) => {
    const [otherKey, otherValue] = bEntries[index]!
    return key === otherKey && value === otherValue
  })
}

function redirectIfChanged(oldUrl: string, newUrl: string) {
  const oldParsed = new URL(oldUrl)
  const newParsed = new URL(newUrl)
  if (
    oldParsed.pathname === newParsed.pathname &&
    searchParamsSemanticallyEqual(oldParsed.searchParams, newParsed.searchParams) &&
    oldParsed.hash === newParsed.hash
  ) {
    return null
  }
  return new URL(
    `${newParsed.pathname}${newParsed.search}${newParsed.hash}`,
    oldParsed.origin,
  ).toString()
}

function getRenamedRegionSlug(slug: string) {
  const renamedRegions: Record<string, string> = {
    // [oldName, newName]
    // Remember to also add a migration like prisma/migrations/20240307091010_migrate_region_slugs/migration.sql
    'bb-ag': 'bb-pg',
    'bb-ramboll': 'bb-sg',
  }
  return renamedRegions[slug] ?? slug
}

/**
 * Ensures that subcategories with dropdown UI always have at least one style active.
 * If no style is active and a 'hidden' style exists, activates 'hidden'.
 * This handles the case where migration from checkbox (off) to dropdown results in no active styles.
 */
function ensureAtLeastOneStyleActive(config: ReturnType<typeof mergeCategoriesConfig>) {
  return config.map((category) => ({
    ...category,
    subcategories: category.subcategories.map((subcategory) => {
      const hasActiveStyle = subcategory.styles.some((s) => s.active)
      const hasHiddenStyle = subcategory.styles.some((s) => s.id === 'hidden')

      // If no style is active and 'hidden' exists, activate 'hidden'
      if (!hasActiveStyle && hasHiddenStyle) {
        return {
          ...subcategory,
          styles: subcategory.styles.map((style) =>
            style.id === 'hidden' ? { ...style, active: true } : style,
          ),
        }
      }

      return subcategory
    }),
  }))
}

/**
 * Migrates old config category/subcategory IDs to new ones.
 * This handles the case where category names were renamed (e.g., 'parking' -> 'parkingLars').
 * Done in https://github.com/FixMyBerlin/tilda-geo/commit/6df2b6b0e40896a37d05ff8616a2f5221c18ea7d
 *
 * Also handles migration of subcategories that don't have a 'hidden' style in old config formats.
 * When a subcategory exists in the old config but doesn't have a 'hidden' style, we infer it was visible
 * and add 'hidden: true' to preserve the user's intent.
 */
function migrateConfigCategoryIds(urlConfig: ReturnType<typeof parseConfig>) {
  const categoryMigrations: Record<string, string> = {
    parking: 'parkingLars',
  }
  const subcategoryMigrations: Record<string, string> = {
    parking: 'parkingLars',
  }

  return urlConfig.map((category) => {
    const newCategoryId = categoryMigrations[category.id] || category.id
    return {
      ...category,
      id: newCategoryId as MapDataCategoryParam['id'],
      subcategories: category.subcategories.map((subcategory) => {
        const newSubcategoryId = subcategoryMigrations[subcategory.id] || subcategory.id

        // MIGRATION: Preserve visibility for subcategories that changed UI from checkbox to dropdown.
        // Background: When UI changed from checkbox (old format, e.g., 14ltyea) to dropdown (new format, e.g., 1qldklk),
        // the config format changed: old format had only 'default' style, new format uses 'hidden' style to control visibility.
        // If subcategory exists in old config without 'hidden' and has 'default: true', it was visible, so add 'hidden: false'.
        // If 'default: false' or no styles, let ensureAtLeastOneStyleActive handle it (will activate 'hidden' if nothing is active).
        const noHiddenStyle = !subcategory.styles.some((s) => s.id === 'hidden')
        const hasDefaultTrue = subcategory.styles.some((s) => s.id === 'default' && s.active)
        if (noHiddenStyle && hasDefaultTrue) {
          return {
            ...subcategory,
            id: newSubcategoryId,
            styles: [{ id: 'hidden', active: false }, ...subcategory.styles],
          }
        }

        return {
          ...subcategory,
          id: newSubcategoryId,
        }
      }),
    }
  }) as MapDataCategoryParam[]
}

/**
 * Returns URL to redirect to, or null if no redirect.
 * Called from the `/regionen/$regionSlug` layout route via getRegionPageDataFn in the route loader
 * (not beforeLoad — search-param navigations must not re-run this), so it also runs for mode child
 * routes (`/regionen/berlin/hinweise`, …). Pathname is mode identity; root rewrites are only for
 * unmigrated overlay bookmarks (legacy `osmNotes`/`notes`/`internalNotes` flags, pre-migration
 * `atlasNote`, or a legacy `qa=` string), not for live `qa` JSON or compose params (`osmNote` /
 * `internalNote`). Region-rename rewrites only the slug segment; existing mode paths are not nested.
 *
 * Routes that trigger this:
 * - `/regionen/berlin` → normalizes search params (map, config, etc.)
 * - `/regionen/bb-ag` → redirects to `/regionen/bb-pg` (region rename)
 * - `/regionen/bb-ag/hinweise` → redirects to `/regionen/bb-pg/hinweise` (rename, sub-path kept)
 *
 * Routes that DON'T trigger this (different or no route match, so this loader never runs):
 * - `/regionen/` → handled by `regionen/index.tsx`
 * - `/regionen/berlin/foo` → no route matches (`$regionSlug` is a single segment), 404
 */
export async function getRegionRedirectUrl(locationHref: string, regionSlug: string) {
  const absoluteUrl = new URL(locationHref, import.meta.env.VITE_APP_ORIGIN).toString()
  const slug = getRenamedRegionSlug(regionSlug)

  let region: TRegion | null = null
  try {
    region = await getRegion({ slug })
  } catch {
    return { redirectUrl: null, region: null }
  }

  let migratedUrl = absoluteUrl
  if (slug !== regionSlug) {
    const u = new URL(absoluteUrl)
    u.pathname = u.pathname.replace(regionSlug, slug)
    migratedUrl = u.toString()
  }

  // Snapshot overlay-bookmark signals before migrateUrl: after migration, a legacy `qa=` string
  // becomes live JSON and `atlasNote` becomes `internalNote`, which ModeSwitcher also copies.
  const preMigrationParams = new URL(migratedUrl).searchParams
  const hadLegacyQaBookmark = isLegacyQaBookmark(preMigrationParams.get('qa'))
  const hadLegacyNotesOverlay = isLegacyNotesOverlayBookmark(preMigrationParams)

  // URL param migrations need the region's current category list to rebuild defaults.
  migratedUrl = migrateUrl(migratedUrl, { categories: region.categories })

  const u = new URL(migratedUrl)
  const regionRootPath = `/regionen/${slug}`
  const params = u.searchParams
  const regionEnablesNotes = Boolean(region.notesOsm || region.notesInternal)

  // Mode identity is the pathname. Root rewrites are only for unmigrated overlay bookmarks
  // (legacy flags / legacy qa string), not for live `qa` JSON or compose params.
  // QA wins when both legacy signals are on. Already on a mode path: do not nest `/qa/qa`.
  if (u.pathname === regionRootPath) {
    if (hadLegacyQaBookmark && qaParamHasKey(params.get('qa'))) {
      u.pathname = `${regionRootPath}/qa`
    } else if (hadLegacyNotesOverlay && regionEnablesNotes) {
      u.pathname = `${regionRootPath}/hinweise`
    }
  }

  params.delete('osmNotes')
  params.delete('notes')
  params.delete('internalNotes')

  if (!region.notesOsm) params.delete('osmNote')
  if (!region.notesInternal) params.delete('internalNote')

  const usedParams = Object.values(searchParamsRegistry)
  Array.from(params.keys()).forEach((key) => {
    if (!usedParams.includes(key)) {
      params.delete(key)
    }
  })

  // Make sure param 'map' is valid. The global mapParamFallback is a typed-search sentinel
  // (validateSearch / defaultRegionSearch), not a real viewport — replace it with region.map.
  const map = u.searchParams.get('map')
  const isMissingOrInvalid = !map || !parseMapParam(map)
  const isGlobalFallback = map === serializeMapParam(mapParamFallback)
  if (isMissingOrInvalid || isGlobalFallback) {
    u.searchParams.set('map', serializeMapParam(region.map))
  }

  // Make sure param 'config' is valid
  const freshConfig = createFreshCategoriesConfig(region.categories)
  const resetConfig = () => u.searchParams.set('config', serializeConfig(freshConfig))
  if (u.searchParams.has('config')) {
    const configParam = u.searchParams.get('config')
    const checksum = configParam?.split('.')[0]
    const simplifiedConfig =
      configParam && checksum ? await resolveConfigTemplate(checksum, freshConfig) : undefined
    if (simplifiedConfig && configParam) {
      try {
        const parsedConfig = parseConfig(configParam, simplifiedConfig as MapDataCategoryConfig[])
        const migratedConfig = migrateConfigCategoryIds(parsedConfig)
        const mergedConfig = mergeCategoriesConfig({
          freshConfig,
          urlConfig: migratedConfig,
        })
        const finalConfig = ensureAtLeastOneStyleActive(mergedConfig)
        const newConfigParam = serializeConfig(finalConfig)
        u.searchParams.set('config', newConfigParam)
      } catch {
        resetConfig()
      }
    } else {
      resetConfig()
    }
  } else {
    resetConfig()
  }

  // NOTE: we intentionally do NOT reorder params to a canonical order. redirectIfChanged compares
  // params semantically (order-independent), so reordering only produced cosmetic URL churn — and it
  // was the main source of same-route 301 redirects during map interaction (the old
  // `hasVolatileMapParam` skip-list was a bandaid for exactly that). Redirects here are now limited
  // to real migrations: slug rename, config/map normalization, and unknown-param removal.
  migratedUrl = u.toString()

  const redirectUrl = redirectIfChanged(absoluteUrl, migratedUrl)
  return { redirectUrl, region: redirectUrl ? null : region }
}

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
import { migrateLitCompletenessSubcategories } from '@/server/regions/migrateLitCompletenessConfig.server'
import { getRegion } from '@/server/regions/queries/getRegion.server'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { resolveConfigTemplate } from '@/server/regions/regionConfigTemplates.server'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

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
    const subcategories =
      category.id === 'lit'
        ? migrateLitCompletenessSubcategories(category.subcategories)
        : category.subcategories

    return {
      ...category,
      id: newCategoryId as MapDataCategoryParam['id'],
      subcategories: subcategories.map((subcategory) => {
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
 * Called from `/regionen/$regionSlug` via getRegionPageDataFn in the route loader
 * (not beforeLoad — search-param navigations must not re-run this).
 *
 * Routes that trigger this:
 * - `/regionen/berlin` → normalizes search params (map, config, etc.)
 * - `/regionen/bb-ag` → redirects to `/regionen/bb-pg` (region rename)
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

  // URL param migrations need the region's current category list to rebuild defaults.
  migratedUrl = migrateUrl(migratedUrl, { categories: region.categories })

  // Remove unused params
  const usedParams = ['v', ...Object.values(searchParamsRegistry)]
  const u = new URL(migratedUrl)
  Array.from(u.searchParams.keys()).forEach((key) => {
    if (!usedParams.includes(key)) {
      u.searchParams.delete(key)
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

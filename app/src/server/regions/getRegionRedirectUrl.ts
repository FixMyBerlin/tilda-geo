import { searchParamsRegistry } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/searchParamsRegistry'
import { createFreshCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import { migrateUrl } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/migrateUrl'
import type { MapDataCategoryParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { mergeCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/utils/mergeCategoriesConfig'
import { configs } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/configs'
import { parse as parseConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/parse'
import { serialize as serializeConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/serialize'
import {
  parseMapParam,
  serializeMapParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import { staticRegion } from '@/data/regions.const'

/** Returns URL to redirect to, or null if no redirect. */
function redirectIfChanged(oldUrl: string, newUrl: string) {
  if (oldUrl === newUrl) return null
  return newUrl
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
 * Called from `/regionen/$regionSlug` route's beforeLoad.
 *
 * Routes that trigger this:
 * - `/regionen/berlin` → normalizes search params (map, config, etc.)
 * - `/regionen/bb-ag` → redirects to `/regionen/bb-pg` (region rename)
 *
 * Routes that DON'T trigger this (no route match, so beforeLoad never runs):
 * - `/regionen/` → handled by `regionen/index.tsx`
 * - `/regionen/berlin/foo` → no route matches, 404
 */
export function getRegionRedirectUrl(locationHref: string, regionSlug: string) {
  const absoluteUrl = new URL(locationHref, import.meta.env.VITE_APP_ORIGIN).toString()
  const slug = getRenamedRegionSlug(regionSlug)

  const existingSlugs = staticRegion.map((r) => r.slug)
  if (!existingSlugs.includes(slug)) return null

  let migratedUrl = absoluteUrl
  // If slug was renamed, update the URL pathname
  if (slug !== regionSlug) {
    const u = new URL(absoluteUrl)
    u.pathname = u.pathname.replace(regionSlug, slug)
    migratedUrl = u.toString()
  }

  // Migrate URL
  migratedUrl = migrateUrl(migratedUrl)

  // Remove unused params
  const usedParams = ['v', ...Object.values(searchParamsRegistry)]
  const u = new URL(migratedUrl)
  Array.from(u.searchParams.keys()).forEach((key) => {
    if (!usedParams.includes(key)) {
      u.searchParams.delete(key)
    }
  })

  const region = staticRegion.find((r) => r.slug === slug)
  if (!region) return null

  // Make sure param 'map' is valid
  const map = u.searchParams.get('map')
  if (!map || !parseMapParam(map)) {
    u.searchParams.set('map', serializeMapParam(region.map))
  }

  // Make sure param 'config' is valid
  const freshConfig = createFreshCategoriesConfig(region.categories)
  const resetConfig = () => u.searchParams.set('config', serializeConfig(freshConfig))
  if (u.searchParams.has('config')) {
    const configParam = u.searchParams.get('config')
    const checksum = configParam?.split('.')[0]
    const simplifiedConfig = configParam && checksum ? configs[checksum] : undefined
    if (simplifiedConfig && configParam) {
      const parsedConfig = parseConfig(configParam, simplifiedConfig)
      const migratedConfig = migrateConfigCategoryIds(parsedConfig)
      const mergedConfig = mergeCategoriesConfig({
        freshConfig,
        urlConfig: migratedConfig,
      })
      const finalConfig = ensureAtLeastOneStyleActive(mergedConfig)
      const newConfigParam = serializeConfig(finalConfig)
      u.searchParams.set('config', newConfigParam)
    } else {
      resetConfig()
    }
  } else {
    resetConfig()
  }

  // Ensure canonical param ordering for stable URLs.
  // IMPORTANT: keep the order untouched when volatile map interaction params are present.
  // These params change frequently (e.g. feature selection, calculator draw session, note dialog position) and
  // reordering them can trigger same-route redirects, which can cause full-page pending transitions.
  const hasVolatileMapParam = [
    searchParamsRegistry.f,
    searchParamsRegistry.draw,
    searchParamsRegistry.data,
    searchParamsRegistry.atlasNote,
    searchParamsRegistry.osmNote,
    searchParamsRegistry.atlasNotesFilter,
    searchParamsRegistry.osmNotesFilter,
  ].some((param) => u.searchParams.has(param))
  if (!hasVolatileMapParam) {
    const params = [...Object.values(searchParamsRegistry), 'v']
    params.forEach((param) => {
      if (u.searchParams.has(param)) {
        const value = u.searchParams.get(param)
        if (value !== null) {
          u.searchParams.delete(param)
          u.searchParams.append(param, value)
        }
      }
    })
  }

  migratedUrl = u.toString()

  return redirectIfChanged(absoluteUrl, migratedUrl)
}

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { searchParamsRegistry } from './app/regionen/[regionSlug]/_hooks/useQueryState/searchParamsRegistry'
import { createFreshCategoriesConfig } from './app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import { migrateUrl } from './app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/migrateUrl'
import { MapDataCategoryParam } from './app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/type'
import { mergeCategoriesConfig } from './app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/utils/mergeCategoriesConfig'
import { configs } from './app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/v2/configs'
import { parse as parseConfig } from './app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/v2/parse'
import { serialize as serializeConfig } from './app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/v2/serialize'
import {
  parseMapParam,
  serializeMapParam,
} from './app/regionen/[regionSlug]/_hooks/useQueryState/utils/mapParam'
import { StaticRegion, staticRegion } from './data/regions.const'

// 'matcher' specifies on which routes the `middleware` runs
export const config = {
  matcher: ['/regionen/:path*'],
}

function splitPathname(url: string) {
  return new URL(url).pathname.slice(1).split('/')
}

function redirectIfChanged(oldUrl: string, newUrl: string) {
  if (oldUrl === newUrl) {
    return NextResponse.next()
  }
  // Note for Dev: NextRequest normalizes 127.0.0.1 to localhost, so redirects will use localhost.
  // The client-side DevMiddlewareHostnameWorkaround fixes this after the redirect.
  return NextResponse.redirect(newUrl, 301)
}

function renameRegionIfNecessary(url: string, slug: string) {
  const renamedRegions = {
    // [oldName, newName]
    // Remember to also add a migration like db/migrations/20240307091010_migrate_region_slugs/migration.sql
    'bb-ag': 'bb-pg',
    'bb-ramboll': 'bb-sg',
  }
  const newSlug = renamedRegions[slug]
  if (newSlug) {
    const u = new URL(url)
    u.pathname = u.pathname.replace(slug, newSlug)
    return u.toString()
  } else {
    return url
  }
}

/**
 * Ensures that subcategories with dropdown UI always have at least one style active.
 * If no style is active and a 'hidden' style exists, activates 'hidden'.
 * This handles the case where migration from checkbox (off) to dropdown results in no active styles.
 */
function ensureAtLeastOneStyleActive(
  config: ReturnType<typeof mergeCategoriesConfig>,
): ReturnType<typeof mergeCategoriesConfig> {
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
function migrateConfigCategoryIds(
  urlConfig: ReturnType<typeof parseConfig>,
): MapDataCategoryParam[] {
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
        const noHiddenStyle = !subcategory.styles?.some((s) => s.id === 'hidden')
        const hasDefaultTrue = subcategory.styles?.some((s) => s.id === 'default' && s.active)
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

export function middleware(request: NextRequest) {
  const initialUrl = request.url.toString()

  let [page, slug, subpage] = splitPathname(initialUrl)
  if (page !== 'regionen') return NextResponse.next()
  if (page === 'regionen' && !slug) return NextResponse.next()
  if (!slug) return NextResponse.next()
  // from here path must be '/regionen/[slug]...'

  let migratedUrl = renameRegionIfNecessary(initialUrl, slug)
  // from here slugs were renamed

  const existingSlugs = staticRegion.map((r) => r.slug)
  slug = splitPathname(migratedUrl)[1]
  if (!existingSlugs.includes(slug!)) return NextResponse.next()
  // from here we're sure that the region exists

  if (subpage) return redirectIfChanged(initialUrl, migratedUrl)
  // from here we know that it's not a subpage and therefor should have search params

  // Migrate URL
  migratedUrl = migrateUrl(migratedUrl)

  // Remove unused params
  const usedParams = ['v', ...Object.values(searchParamsRegistry)]
  const u = new URL(migratedUrl)
  Array.from(u.searchParams.keys()).forEach((key) => {
    !usedParams.includes(key) && u.searchParams.delete(key)
  })

  const region = staticRegion.find((r) => r.slug === slug) as StaticRegion

  // Make sure param 'map' is valid
  const map = u.searchParams.get('map')
  if (!map || !parseMapParam(map)) {
    u.searchParams.set('map', serializeMapParam(region.map))
  }

  // Make sure param 'config' is valid
  const freshConfig = createFreshCategoriesConfig(region.categories)
  const resetConfig = () => u.searchParams.set('config', serializeConfig(freshConfig))
  if (u.searchParams.has('config')) {
    const configParam = u.searchParams.get('config')!
    const checksum = configParam.split('.')[0]!
    const simplifiedConfig = configs[checksum]
    // console.log("simplifiedConfig: ", simplifiedConfig)
    if (simplifiedConfig) {
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

  // Ensure order of params
  const params = [...Object.values(searchParamsRegistry), 'v']
  params.forEach((param) => {
    if (u.searchParams.has(param)) {
      const value = u.searchParams.get(param)!
      u.searchParams.delete(param)
      u.searchParams.append(param, value)
    }
  })

  migratedUrl = u.toString()

  return redirectIfChanged(initialUrl, migratedUrl)
}

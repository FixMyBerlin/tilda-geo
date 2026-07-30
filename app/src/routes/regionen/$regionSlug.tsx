import { createFileRoute, redirect } from '@tanstack/react-router'
import { PageRegionSlug } from '@/components/regionen/PageRegionSlug'
import RegionError from '@/components/regionen/pageRegionSlug/RegionError'
import RegionPagePending from '@/components/regionen/pageRegionSlug/RegionPagePending'
import { isDev, isProd } from '@/components/shared/utils/isEnv'
import { productName } from '@/data/tildaProductNames.const'
import { DEV_REGION_ERROR_QUERY_KEY } from '@/dev/errorPreviews'
import { processingMetadataQueryOptions } from '@/server/regions/processingMetadataQueryOptions'
import { regionQaConfigsQueryOptions } from '@/server/regions/regionQueryOptions'
import { getRegionPageDataFn } from '@/server/regions/regions.functions'
import {
  regionUploadsSystemLayerQueryOptions,
  regionUploadsUserQueryOptions,
} from '@/server/uploads/uploadsQueryOptions'
import { regionSearchSchema } from '@/shared/regionen/regionSearchSchemas'

/**
 * Region page route. The loader resolves redirect + auth + region (getRegionPageDataFn) and (1)
 * returns that page data and (2) preloads the React Query cache with region-specific data (QA
 * config list, uploads, processing metadata). QA map data and style/filter changes load on demand
 * in the client via useQaMapData / useQaMapState — same pattern as internal notes — so toggling QA
 * does not re-run this loader or trigger route pending UI.
 *
 * That cache is server state: the @tanstack/react-router-ssr-query integration dehydrates it and
 * streams it to the client so components using useQuery with the same query options get hydrated
 * data without a second request.
 * See: https://tanstack.com/router/latest/docs/guide/data-loading
 * and the SSR Query integration used in app/src/router.tsx.
 */
export const Route = createFileRoute('/regionen/$regionSlug')({
  ssr: 'data-only',
  errorComponent: RegionError,
  // Keep route-level pending UI here. URL changes that include `f` (feature selection) should not
  // be rewritten into redirects, otherwise this pending component can flash during normal map clicks.
  pendingComponent: RegionPagePending,
  // Delay pending UI so fast path/region loads keep the previous screen. Search-param updates
  // (map, qa, …) never re-run this loader, so they cannot trigger pending regardless of this value.
  pendingMs: 2_000,
  validateSearch: regionSearchSchema,
  // No loaderDeps: search params (map, config, qa, notes, …) update purely client-side via
  // useSearch() and must not re-run getRegionPageDataFn or trigger route pending UI.
  loader: async ({ params, context, location }) => {
    if (!isProd) {
      const preview = new URLSearchParams(location.search).get(DEV_REGION_ERROR_QUERY_KEY)
      if (preview === '1') {
        throw new Error('Region error preview (non-production)')
      }
    }
    if (isDev) {
      console.debug('[region] loader running')
    }

    // Redirect + auth + region resolution live in the loader (not beforeLoad). The loader runs on
    // path/region changes; search params (map, config, qa, notes, …) are client-only and must not
    // re-run this loader. beforeLoad would re-run on every navigation, including map pans.
    const pageData = await getRegionPageDataFn({
      data: { url: location.href, regionSlug: params.regionSlug },
    })
    if (pageData.redirectUrl) {
      throw redirect({ href: pageData.redirectUrl, statusCode: 301 })
    }

    const { queryClient } = context
    const regionSlug = params.regionSlug

    await Promise.all([
      queryClient.ensureQueryData(regionQaConfigsQueryOptions(regionSlug)),
      queryClient.ensureQueryData(regionUploadsUserQueryOptions(regionSlug)),
      queryClient.ensureQueryData(regionUploadsSystemLayerQueryOptions(regionSlug)),
      queryClient.ensureQueryData(processingMetadataQueryOptions()),
    ])

    return {
      authorized: pageData.authorized,
      // Non-null by contract: getRegionPageDataFn returns region:null only together with a
      // redirectUrl, which we handled above.
      region: pageData.region!,
      hasPermissions: pageData.hasPermissions,
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] }
    const region = loaderData.region
    return {
      meta: [
        { name: 'robots', content: 'noindex' },
        { title: `${region.fullName} — ${productName[region.product]} – tilda-geo.de` },
      ],
    }
  },
  component: PageRegionSlug,
})

import { createFileRoute, redirect } from '@tanstack/react-router'
import { LayoutRegionSlug } from '@/components/regionen/LayoutRegionSlug'
import { loadRegionSearchParams } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/regionSearchParamsLoader'
import { searchParamsRegistry } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/searchParamsRegistry'
import RegionError from '@/components/regionen/pageRegionSlug/RegionError'
import RegionPagePending from '@/components/regionen/pageRegionSlug/RegionPagePending'
import { isDev, isProd } from '@/components/shared/utils/isEnv'
import { productName } from '@/data/tildaProductNames.const'
import { DEV_REGION_ERROR_QUERY_KEY } from '@/dev/errorPreviews'
import { getRegionRedirectUrl } from '@/server/regions/getRegionRedirectUrl'
import { processingMetadataQueryOptions } from '@/server/regions/processingMetadataQueryOptions'
import {
  internalNotesQueryOptions,
  qaDataForMapQueryOptions,
  regionQaConfigsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import {
  getRegionPageBeforeLoadFn,
  getRegionPageLoaderFn,
} from '@/server/regions/regions.functions'
import {
  regionUploadsSystemLayerQueryOptions,
  regionUploadsUserQueryOptions,
} from '@/server/uploads/uploadsQueryOptions'

/**
 * Region page route. The loader (1) fetches main page data via getRegionPageLoaderFn and (2) preloads
 * the React Query cache with region-specific data (QA configs — server returns [] without access, internal notes when
 * the region has atlas notes, QA map data when the `qa` URL param is set). That cache is server state: the
 * @tanstack/react-router-ssr-query integration dehydrates it and streams it to the client so
 * components using useQuery with the same query options get hydrated data without a second request.
 * See: https://tanstack.com/router/latest/docs/guide/data-loading
 * and the SSR Query integration used in app/src/router.tsx.
 */
export const Route = createFileRoute('/regionen/$regionSlug')({
  ssr: 'data-only',
  errorComponent: RegionError,
  // Keep route-level pending UI here. URL changes that include `f` (feature selection) should not
  // be rewritten into redirects, otherwise this pending component can flash during normal map clicks.
  pendingComponent: RegionPagePending,
  // Avoid full-page pending takeover for short same-route transitions
  // (e.g. search-param updates from map interactions).
  pendingMs: 15_000,
  loaderDeps: ({ search }) => {
    return {
      qa: search?.[searchParamsRegistry.qa] ?? '',
      atlasNotesFilter: search?.[searchParamsRegistry.atlasNotesFilter] ?? '',
      qaFilter: search?.[searchParamsRegistry.qaFilter] ?? '',
    }
  },
  beforeLoad: async ({ params, location }) => {
    const redirectUrl = getRegionRedirectUrl(location.href, params.regionSlug)
    if (redirectUrl) {
      throw redirect({ href: redirectUrl, statusCode: 301 })
    }
    const { isAuthorized, region } = await getRegionPageBeforeLoadFn({
      data: { regionSlug: params.regionSlug, url: location.href },
    })
    return { isAuthorized, region }
  },
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
    const loaderData = await getRegionPageLoaderFn({
      data: {
        regionSlug: params.regionSlug,
        isAuthorized: context.isAuthorized,
        region: context.region,
      },
    })

    const { queryClient } = context
    const regionSlug = params.regionSlug

    await Promise.all([
      queryClient.ensureQueryData(regionQaConfigsQueryOptions(regionSlug)),
      queryClient.ensureQueryData(regionUploadsUserQueryOptions(regionSlug)),
      queryClient.ensureQueryData(regionUploadsSystemLayerQueryOptions(regionSlug)),
      queryClient.ensureQueryData(processingMetadataQueryOptions()),
    ])

    const {
      qa: qaParam,
      atlasNotesFilter: notesFilter,
      qaFilter,
    } = loadRegionSearchParams(location.search)

    if (context.region?.notes === 'atlasNotes' && loaderData.authorized) {
      await queryClient.ensureQueryData(
        internalNotesQueryOptions(regionSlug, notesFilter ?? undefined),
      )
    }

    if (qaParam.configSlug && qaParam.style !== 'none') {
      const qaConfigs = queryClient.getQueryData<{ id: number; slug: string }[]>(
        regionQaConfigsQueryOptions(regionSlug).queryKey,
      )
      const activeConfig = qaConfigs?.find((c) => c.slug === qaParam.configSlug)
      if (activeConfig?.id) {
        const userIds = (qaFilter?.users ?? []).map(String)
        await queryClient.ensureQueryData(
          qaDataForMapQueryOptions({
            configId: activeConfig.id,
            regionSlug,
            userIds: userIds.length > 0 ? userIds : undefined,
          }),
        )
      }
    }

    return loaderData
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] }
    const region = loaderData.region
    return {
      meta: [
        { name: 'robots', content: 'noindex' },
        { title: `${region.fullName} — ${productName.get(region.product)} – tilda-geo.de` },
      ],
    }
  },
  component: LayoutRegionSlug,
})

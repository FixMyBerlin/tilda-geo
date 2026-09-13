import { createFileRoute, redirect } from '@tanstack/react-router'
import { PageModeQa } from '@/components/regionen/pageRegionSlug/modes/qa/PageModeQa'
import {
  compactQaParam,
  QA_DEFAULT_STATUS_KEY,
} from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import {
  qaDataForMapQueryOptions,
  regionQaConfigsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import { getQaParamFromSearch } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

/**
 * QA mode ("Qualitätssicherung"). Redirects to the region root unless the region has at least one
 * active QA config (`availableModes.ts`). QA layers and selector live only here, not on the default
 * map. Parent layout validates `qa` (`regionSearchSchema`).
 */
export const Route = createFileRoute('/regionen/$regionSlug/qa')({
  ssr: 'data-only',
  loaderDeps: ({ search }) => {
    const qa = search[searchParamsRegistry.qa]
    // Free-text `search` is omitted so typing does not re-run the loader; the map/panel query follows URL state.
    return {
      key: qa?.key,
      users: qa?.users,
    }
  },
  loader: async ({ params, context, deps, parentMatchPromise }) => {
    const parent = await parentMatchPromise
    // Parent throws /access-denied for guests; do not race a zero-config bounce to the map.
    if (!parent.loaderData?.authorized || !parent.loaderData.hasPermissions) {
      return
    }

    if (!parent.loaderData.availableModes.qa) {
      throw redirect({
        from: '/regionen/$regionSlug/qa',
        to: '/regionen/$regionSlug',
        params: { regionSlug: params.regionSlug },
        search: true,
      })
    }

    const { queryClient } = context
    const regionSlug = params.regionSlug

    const qaConfigs = await queryClient.ensureQueryData(regionQaConfigsQueryOptions(regionSlug))
    const defaultConfig = qaConfigs[0]
    if (!deps.key && defaultConfig) {
      throw redirect({
        from: '/regionen/$regionSlug/qa',
        to: '.',
        search: (prev) => ({
          ...prev,
          [searchParamsRegistry.qa]: compactQaParam({
            ...getQaParamFromSearch(prev),
            key: defaultConfig.slug,
            status: QA_DEFAULT_STATUS_KEY,
          }),
        }),
        replace: true,
      })
    }

    if (deps.key) {
      const activeConfig = qaConfigs.find((config) => config.slug === deps.key)
      if (activeConfig) {
        const userIds = (deps.users ?? []).map(String)
        await queryClient.ensureQueryData(
          qaDataForMapQueryOptions({
            configSlug: activeConfig.slug,
            regionSlug,
            userIds,
          }),
        )
      }
    }
  },
  component: PageModeQa,
})

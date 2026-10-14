import { createFileRoute, redirect } from '@tanstack/react-router'
import { isMemberOnlyMode } from '@/components/regionen/pageRegionSlug/modes/availableModes'
import { modeScopedSearchMiddleware } from '@/components/regionen/pageRegionSlug/modes/modeScopedSearchMiddleware'
import { spaceFinderVariantIdToPrime } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/collection/spaceFinderCollectionOptions'
import { PageModeSpaceFinder } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/PageModeSpaceFinder'
import {
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { getSafeSignInCallbackURL } from '@/shared/auth/safeSignInCallbackURL'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

/**
 * Flächenfinder mode ("spaceFinder"). Redirects to the region root unless the region has
 * `spaceFinderEnabled` and the user can manage it (`availableModes.ts` — D8, unlike the other
 * modes this one needs an explicit flag because the planning worker only runs on some instances).
 * `space` JSON is validated on the parent region route. Guests are redirected to /access-denied here
 * (always member-only, every planning server function already requires membership).
 */
export const Route = createFileRoute('/regionen/$regionSlug/flaechenfinder')({
  ssr: 'data-only',
  search: { middlewares: [modeScopedSearchMiddleware('spaceFinder')] },
  // Only the variant id. Opacity and the score must not refetch the variant.
  loaderDeps: ({ search }) => ({ key: search[searchParamsRegistry.space]?.key }),
  loader: async ({ params, context, deps, location, parentMatchPromise }) => {
    const parent = await parentMatchPromise
    if (!parent.loaderData?.authorized) {
      return
    }
    if (
      !parent.loaderData.hasPermissions &&
      isMemberOnlyMode('spaceFinder', parent.loaderData.region)
    ) {
      throw redirect({
        to: '/access-denied',
        search: {
          from: getSafeSignInCallbackURL(`${location.pathname}${location.searchStr}`),
        },
      })
    }

    if (!parent.loaderData.availableModes.spaceFinder) {
      throw redirect({
        from: '/regionen/$regionSlug/flaechenfinder',
        to: '/regionen/$regionSlug',
        params,
        search: true,
      })
    }

    const { queryClient } = context
    const areas = await queryClient.ensureQueryData(planningAreasQueryOptions(params.regionSlug))
    const variantId = spaceFinderVariantIdToPrime(areas, deps.key)
    if (variantId != null) {
      await queryClient.ensureQueryData(planningVariantQueryOptions(variantId))
    }
  },
  component: PageModeSpaceFinder,
})

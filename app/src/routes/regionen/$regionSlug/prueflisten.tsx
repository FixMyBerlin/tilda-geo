import { createFileRoute, redirect } from '@tanstack/react-router'
import { isMemberOnlyMode } from '@/components/regionen/pageRegionSlug/modes/availableModes'
import { modeScopedSearchMiddleware } from '@/components/regionen/pageRegionSlug/modes/modeScopedSearchMiddleware'
import { PageModeReviewLists } from '@/components/regionen/pageRegionSlug/modes/reviewLists/PageModeReviewLists'
import { getSafeSignInCallbackURL } from '@/components/shared/hooks/useSignInUrl'
import {
  reviewEntriesQueryOptions,
  reviewListsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

/**
 * Review lists mode ("Prüflisten"). Region members/admins can open this mode even when no list
 * exists yet (to create the first). Guests are redirected to /access-denied here (always
 * member-only). Discoverability is the header switcher (`availableModes.reviewLists`). `review` is
 * validated on the parent region route.
 */
export const Route = createFileRoute('/regionen/$regionSlug/prueflisten')({
  ssr: 'data-only',
  search: { middlewares: [modeScopedSearchMiddleware('reviewLists')] },
  loaderDeps: ({ search }) => ({ key: search[searchParamsRegistry.review]?.key }),
  loader: async ({ params, context, deps, location, parentMatchPromise }) => {
    const parent = await parentMatchPromise
    if (!parent.loaderData?.authorized) {
      return
    }
    if (
      !parent.loaderData.hasPermissions &&
      isMemberOnlyMode('reviewLists', parent.loaderData.region)
    ) {
      throw redirect({
        to: '/access-denied',
        search: {
          from: getSafeSignInCallbackURL(`${location.pathname}${location.searchStr}`),
        },
      })
    }

    const { queryClient } = context
    const regionSlug = params.regionSlug

    // No hard availability redirect here: region members/admins reach this mode to create the
    // first list. Discoverability is handled by the header switcher (availableModes.reviewLists).
    const lists = await queryClient.ensureQueryData(reviewListsQueryOptions(regionSlug))

    // Prime the selected (or first) list's entries.
    const listId = deps.key ?? lists.lists[0]?.id
    if (listId !== undefined) {
      await queryClient.ensureQueryData(reviewEntriesQueryOptions(regionSlug, listId))
    }
  },
  component: PageModeReviewLists,
})

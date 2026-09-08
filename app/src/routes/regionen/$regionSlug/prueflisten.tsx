import { createFileRoute } from '@tanstack/react-router'
import { PageModeReviewLists } from '@/components/regionen/pageRegionSlug/modes/reviewLists/PageModeReviewLists'
import {
  reviewEntriesQueryOptions,
  reviewListsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

/**
 * Review lists mode ("Prüflisten"). Region members/admins can open this mode even when no list
 * exists yet (to create the first). Guests are redirected by the parent region loader.
 * Discoverability is the header switcher (`availableModes.reviewLists`). `rl` is validated on the
 * parent region route.
 */
export const Route = createFileRoute('/regionen/$regionSlug/prueflisten')({
  ssr: 'data-only',
  loaderDeps: ({ search }) => ({ key: search[searchParamsRegistry.reviewLists]?.key }),
  loader: async ({ params, context, deps, parentMatchPromise }) => {
    const parent = await parentMatchPromise
    if (!parent.loaderData?.authorized || !parent.loaderData.hasPermissions) {
      return
    }

    const { queryClient } = context
    const regionSlug = params.regionSlug

    // No hard availability redirect here: region members/admins reach this mode to create the
    // first list. Guests are redirected by the parent region loader. Discoverability is handled
    // by the header switcher (availableModes.reviewLists).
    const lists = await queryClient.ensureQueryData(reviewListsQueryOptions(regionSlug))

    // Prime the selected (or first) list's entries.
    const listId = deps.key ?? lists.lists[0]?.id
    if (listId !== undefined) {
      await queryClient.ensureQueryData(reviewEntriesQueryOptions(regionSlug, listId))
    }
  },
  component: PageModeReviewLists,
})

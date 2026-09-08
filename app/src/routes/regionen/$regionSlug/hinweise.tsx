import { createFileRoute, redirect } from '@tanstack/react-router'
import { notesModeToServerFilter } from '@/components/regionen/pageRegionSlug/modes/notes/notesModeParam'
import { PageModeNotes } from '@/components/regionen/pageRegionSlug/modes/notes/PageModeNotes'
import { internalNotesQueryOptions } from '@/server/regions/regionQueryOptions'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

/**
 * Notes mode ("Hinweise"). Redirects to the region root unless OSM or TILDA notes are enabled
 * (`availableModes.ts`). `notesMode` JSON is validated on the parent region route.
 */
export const Route = createFileRoute('/regionen/$regionSlug/hinweise')({
  ssr: 'data-only',
  loaderDeps: ({ search }) => {
    const notesMode = search[searchParamsRegistry.notesMode]
    // Free-text `search` is omitted so typing does not re-run the loader; the panel query follows URL state.
    return {
      completed: notesMode?.completed,
      commented: notesMode?.commented,
      notReacted: notesMode?.notReacted,
      user: notesMode?.user,
    }
  },
  loader: async ({ context, params, deps, parentMatchPromise }) => {
    const parent = await parentMatchPromise
    if (!parent.loaderData?.availableModes.notes) {
      throw redirect({
        from: '/regionen/$regionSlug/hinweise',
        to: '/regionen/$regionSlug',
        params,
        search: true,
      })
    }

    const { queryClient } = context
    if (parent.loaderData.region.notesInternal) {
      await queryClient.ensureQueryData(
        internalNotesQueryOptions(params.regionSlug, notesModeToServerFilter(deps)),
      )
    }
  },
  component: PageModeNotes,
})

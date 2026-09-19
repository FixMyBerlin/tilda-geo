import { createFileRoute, redirect } from '@tanstack/react-router'
import { isMemberOnlyMode } from '@/components/regionen/pageRegionSlug/modes/availableModes'
import { modeScopedSearchMiddleware } from '@/components/regionen/pageRegionSlug/modes/modeScopedSearchMiddleware'
import { notesModeToServerFilter } from '@/components/regionen/pageRegionSlug/modes/notes/notesModeParam'
import { resolveSelectedNoteFolderId } from '@/components/regionen/pageRegionSlug/modes/notes/notesSelection'
import { PageModeNotes } from '@/components/regionen/pageRegionSlug/modes/notes/PageModeNotes'
import {
  internalNotesQueryOptions,
  noteFoldersQueryOptions,
} from '@/server/regions/regionQueryOptions'
import { getSafeSignInCallbackURL } from '@/shared/auth/safeSignInCallbackURL'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

/**
 * Notes mode ("Hinweise"). Redirects to the region root unless OSM or TILDA notes are enabled
 * (`availableModes.ts`). `notes` JSON is validated on the parent region route. Guests may open OSM
 * notes; internal-only notes redirect to /access-denied (`isMemberOnlyMode`).
 */
export const Route = createFileRoute('/regionen/$regionSlug/hinweise')({
  ssr: 'data-only',
  search: { middlewares: [modeScopedSearchMiddleware('notes')] },
  loaderDeps: ({ search }) => {
    const notesMode = search[searchParamsRegistry.notes]
    // Free-text `search` is omitted so typing does not re-run the loader; the panel query follows URL state.
    return {
      key: notesMode?.key,
      completed: notesMode?.completed,
      commented: notesMode?.commented,
      notReacted: notesMode?.notReacted,
      user: notesMode?.user,
    }
  },
  loader: async ({ context, params, deps, location, parentMatchPromise }) => {
    const parent = await parentMatchPromise
    if (!parent.loaderData?.authorized) {
      return
    }
    if (!parent.loaderData.hasPermissions && isMemberOnlyMode('notes', parent.loaderData.region)) {
      throw redirect({
        to: '/access-denied',
        search: {
          from: getSafeSignInCallbackURL(`${location.pathname}${location.searchStr}`),
        },
      })
    }
    if (!parent.loaderData.availableModes.notes) {
      throw redirect({
        from: '/regionen/$regionSlug/hinweise',
        to: '/regionen/$regionSlug',
        params,
        search: true,
      })
    }

    const { queryClient } = context
    if (parent.loaderData.region.notesInternal && parent.loaderData.hasPermissions) {
      const { folders } = await queryClient.ensureQueryData(
        noteFoldersQueryOptions(params.regionSlug),
      )
      const folderId = resolveSelectedNoteFolderId(deps.key, folders)
      if (folderId !== undefined) {
        await queryClient.ensureQueryData(
          internalNotesQueryOptions(params.regionSlug, folderId, notesModeToServerFilter(deps)),
        )
      }
    }
  },
  component: PageModeNotes,
})

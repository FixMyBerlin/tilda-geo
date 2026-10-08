import { createFileRoute, redirect } from '@tanstack/react-router'
import { PageModeCalculator } from '@/components/regionen/pageRegionSlug/modes/calculator/PageModeCalculator'
import { modeScopedSearchMiddleware } from '@/components/regionen/pageRegionSlug/modes/modeScopedSearchMiddleware'

/**
 * Summieren mode (area calculator). Open to everyone who can see the region; redirects to the
 * region root unless the region has a dataset that can be summed (`availableModes.ts`). Nothing
 * is loaded here: dataset, filter and drawn areas live in the URL (`sum`) and are
 * validated on the parent region route.
 */
export const Route = createFileRoute('/regionen/$regionSlug/summieren')({
  ssr: 'data-only',
  search: { middlewares: [modeScopedSearchMiddleware('calculator')] },
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise
    if (!parent.loaderData?.authorized) {
      return
    }
    if (!parent.loaderData.availableModes.calculator) {
      throw redirect({
        from: '/regionen/$regionSlug/summieren',
        to: '/regionen/$regionSlug',
        params,
        search: true,
      })
    }
  },
  component: PageModeCalculator,
})

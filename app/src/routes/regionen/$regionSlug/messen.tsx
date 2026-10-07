import { createFileRoute } from '@tanstack/react-router'
import { PageModeMeasure } from '@/components/regionen/pageRegionSlug/modes/measure/PageModeMeasure'
import { modeScopedSearchMiddleware } from '@/components/regionen/pageRegionSlug/modes/modeScopedSearchMiddleware'

/**
 * Messen mode (measure lengths and areas). Open to everyone who can see the region, in every
 * region. Nothing is loaded here: the measured lines and areas live in the URL (`measure`)
 * and are validated on the parent region route.
 */
export const Route = createFileRoute('/regionen/$regionSlug/messen')({
  ssr: 'data-only',
  search: { middlewares: [modeScopedSearchMiddleware('measure')] },
  component: PageModeMeasure,
})

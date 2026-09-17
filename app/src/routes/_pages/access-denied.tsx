import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageAccessDenied } from '@/components/pages/accessDenied/PageAccessDenied'
import { getSafeSignInCallbackURL } from '@/components/shared/hooks/useSignInUrl'
import { optionalSearchString } from '@/lib/searchParamsSchema'

const accessDeniedSearchSchema = z.object({
  from: optionalSearchString().transform((from) =>
    from === undefined ? undefined : getSafeSignInCallbackURL(from),
  ),
  reason: z.enum(['deactivated']).optional().catch(undefined),
})

export const Route = createFileRoute('/_pages/access-denied')({
  ssr: true,
  validateSearch: (search) => accessDeniedSearchSchema.parse(search),
  head: ({ match }) => {
    const title =
      match.search.reason === 'deactivated'
        ? 'Diese Region ist deaktiviert – tilda-geo.de'
        : 'Zugriff verweigert – tilda-geo.de'
    return {
      meta: [{ name: 'robots', content: 'noindex' }, { title }],
    }
  },
  component: PageAccessDenied,
})

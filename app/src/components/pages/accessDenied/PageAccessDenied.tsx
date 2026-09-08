import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useSignInUrl } from '@/components/shared/hooks/useSignInUrl'
import { Link } from '@/components/shared/links/Link'
import { currentUserQueryOptions } from '@/server/users/currentUserQueryOptions'

const routeApi = getRouteApi('/_pages/access-denied')

export function PageAccessDenied() {
  const { from, reason } = routeApi.useSearch()
  const { data } = useQuery(currentUserQueryOptions())
  const isLoggedIn = Boolean(data?.user)
  const signInHref = useSignInUrl(from ?? '/')

  if (reason === 'deactivated') {
    return (
      <div className="py-8">
        <h1 className="text-xl font-semibold">Diese Region ist deaktiviert</h1>
        <p className="text-stone-600 mt-2">
          Die Lizenz ist ausgelaufen und die Region wurde archiviert. Nehmen Sie mit uns Kontakt auf
          um die Region wieder zu aktivieren.
        </p>
        <p className="mt-4">
          <Link to="/kontakt" button>
            Kontakt aufnehmen
          </Link>
        </p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="py-8">
        <h1 className="text-xl font-semibold">Anmeldung erforderlich</h1>
        <p className="text-stone-600 mt-2">
          Dieser Bereich ist nur für autorisierte Benutzer verfügbar. Bitte melden Sie sich an und
          stellen Sie sicher, dass Sie Zugriff haben.
        </p>
        <div className="mt-4 flex gap-4">
          <Link href={signInHref} button>
            Anmelden
          </Link>
          <Link to="/kontakt" button>
            Kontakt aufnehmen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <h1 className="text-xl font-semibold">Zugriff verweigert</h1>
      <p className="text-stone-600 mt-2">Sie haben keine Berechtigung, diesen Bereich zu nutzen.</p>
      <p className="mt-4">
        <Link to="/kontakt" button>
          Kontakt aufnehmen
        </Link>
      </p>
    </div>
  )
}

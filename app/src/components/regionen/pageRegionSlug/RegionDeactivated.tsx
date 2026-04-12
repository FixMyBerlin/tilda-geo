import { useSignInUrl } from '@/components/shared/hooks/useSignInUrl'
import { Link } from '@/components/shared/links/Link'
import type { RegionStatus } from '@/prisma/generated/browser'

type Props = {
  status: RegionStatus // but never 'PUBLIC'
}

export const RegionAccessDenied = ({ status }: Props) => {
  const signInHref = useSignInUrl()

  switch (status) {
    case 'PUBLIC':
      return null
    case 'DEACTIVATED':
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-2xl font-bold">Diese Region ist deaktiviert</h1>
            <p className="mb-6 text-gray-600">
              Die Lizenz ist ausgelaufen und die Region wurde archiviert. Nehmen Sie mit uns Kontakt
              auf um die Region wieder zu aktivieren.
            </p>
            <Link to="/kontakt" button>
              Kontakt aufnehmen
            </Link>
          </div>
        </div>
      )
    case 'PRIVATE':
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-2xl font-bold">Zugriff verweigert</h1>
            <p className="mb-6 text-gray-600">
              Diese Region ist nur für autorisierte Benutzer verfügbar. Bitte melden Sie sich an und
              stellen Sie sicher, dass Sie Zugriff auf diese Region haben.
            </p>
            <div className="flex justify-center gap-4">
              <Link href={signInHref} button>
                Anmelden
              </Link>
              <Link to="/kontakt" button>
                Kontakt aufnehmen
              </Link>
            </div>
          </div>
        </div>
      )
  }
}

import { authClient } from '@/components/shared/auth/auth-client'
import { useSignInUrl } from '@/components/shared/hooks/useSignInUrl'
import { Link } from '@/components/shared/links/Link'
import { linkStyles } from '@/components/shared/links/styles'

type Props = {
  /** First line: what requires region membership. */
  accessMessage: string
  /**
   * Text after “kontaktieren Sie uns” when signed in without membership.
   * Default: region access; download can add “… und zum Download”.
   */
  memberContactSuffix?: string
  className?: string
}

/**
 * Auth / membership gate copy shared by download modal and mode panels.
 * Signed out → sign-in with return URL; signed in without membership → Kontakt.
 */
export const RegionMembershipCallout = ({
  accessMessage,
  memberContactSuffix = ' um Zugriff zur Region zu erhalten.',
  className,
}: Props) => {
  const { data: session } = authClient.useSession()
  const isLoggedIn = Boolean(session?.role)
  const signInHref = useSignInUrl()

  return (
    <div className={className}>
      <p className="text-sm text-gray-700">{accessMessage}</p>
      {isLoggedIn ? (
        <p className="mt-2.5 text-sm text-gray-700">
          Bitte <Link to="/kontakt">kontaktieren Sie uns</Link>
          {memberContactSuffix}
        </p>
      ) : (
        <p className="mt-2.5 text-sm text-gray-700">
          Bitte{' '}
          <Link href={signInHref} className={linkStyles}>
            loggen Sie sich ein
          </Link>
          .
        </p>
      )}
    </div>
  )
}

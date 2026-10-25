import { Callout } from '@/components/shared/Callout/Callout'
import { useSignInUrl } from '@/components/shared/hooks/useSignInUrl'
import { Link } from '@/components/shared/links/Link'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'

type Props = { message?: string }

export const NotesNewLoginNotice = ({
  message = 'Um einen Hinweis zu erstellen, müssen Sie eingeloggt sein.',
}: Props = {}) => {
  const signInHref = useSignInUrl()

  return (
    <section className="px-4 py-3">
      <Callout
        tone="info"
        title="Anmeldung erforderlich"
        actions={
          <Link href={signInHref} classNameOverwrite={buttonStylesOnYellow} button>
            Anmelden (oder registrieren)
          </Link>
        }
      >
        <p>{message}</p>
      </Callout>
    </section>
  )
}

import { Callout } from '@/components/shared/Callout/Callout'
import { useSignInUrl } from '@/components/shared/hooks/useSignInUrl'
import { Link } from '@/components/shared/links/Link'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'

export const NotesNewLoginNotice = () => {
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
        <p>Um einen Hinweis zu erstellen, müssen Sie eingeloggt sein.</p>
      </Callout>
    </section>
  )
}

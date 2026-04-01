import { useSignInUrl } from '@/components/shared/hooks/useSignInUrl'
import { Link } from '@/components/shared/links/Link'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'

export const NotesNewLoginNotice = () => {
  const signInHref = useSignInUrl()

  return (
    <section className="prose p-5">
      <h1 className="text-xl">
        Um Hinweise auf OpenStreetMap zu veröffentliche, müssen Sie eingeloggt sein.
      </h1>
      <Link href={signInHref} classNameOverwrite={buttonStylesOnYellow} button>
        Anmelden (oder registrieren)
      </Link>
    </section>
  )
}

import { getRouteApi, Link, useRouter } from '@tanstack/react-router'

const routeApi = getRouteApi('/_pages/oAuthError')

const lostStateMessage =
  'Der Anmeldevorgang konnte nicht fortgesetzt werden (Anmeldezustand fehlt oder ist ungültig). Das passiert zum Beispiel nach einem Serverfehler, wenn Cookies blockiert werden oder wenn die Seite während der Anmeldung neu geladen wird. Bitte starten Sie die Anmeldung erneut.'

const oauthErrorMessages = {
  state_not_found: lostStateMessage,
  state_invalid: lostStateMessage,
  state_mismatch:
    'Der Anmeldevorgang wurde unterbrochen oder die Sitzung passt nicht mehr (abgelaufen oder manipuliert). Bitte melden Sie sich erneut an.',
  oauth_sign_in_failed:
    'Die Anmeldung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.',
  access_denied:
    'Die Anmeldung wurde bei OpenStreetMap abgebrochen. Ohne Ihre Zustimmung können wir Sie nicht anmelden.',
  invalid_code:
    'OpenStreetMap hat die Anmeldung nicht bestätigt. Bitte starten Sie die Anmeldung erneut.',
  unable_to_get_user_info:
    'Ihre Profildaten konnten nicht von OpenStreetMap geladen werden. Bitte versuchen Sie es erneut.',
  account_not_linked:
    'OpenStreetMap konnte nicht mit Ihrem Nutzerkonto verknüpft werden. Bitte melden Sie sich erneut an.',
} satisfies Record<string, string>

export function PageOAuthError() {
  const { error, error_description, callbackURL } = routeApi.useSearch()
  const router = useRouter()
  const { href: signInHref } = router.buildLocation({
    to: '/api/sign-in/osm',
    search: { callbackURL: callbackURL ?? '/' },
  })

  const normalizedError = error?.trim().toLowerCase()
  const knownMessage =
    normalizedError != null
      ? oauthErrorMessages[normalizedError as keyof typeof oauthErrorMessages]
      : undefined

  const message =
    knownMessage ||
    error_description?.trim() ||
    (error != null
      ? `Unbekannter Fehler (${error}). Bitte versuchen Sie die Anmeldung erneut.`
      : 'Es ist ein Fehler aufgetreten.')

  return (
    <>
      <h1>Fehler bei der Nutzung der OpenStreetMap Anmeldung</h1>
      <p className="text-gray-600">Details zum Fehler:</p>
      <blockquote className="not-prose mt-2 border-l-4 border-gray-300 pl-4 text-gray-900">
        {message}
      </blockquote>
      <p>
        <Link to={signInHref}>Mit OpenStreetMap erneut anmelden</Link>
      </p>
    </>
  )
}

import { getRouteApi, Link, useRouter } from '@tanstack/react-router'

const routeApi = getRouteApi('/_pages/oAuthError')

const oauthErrorMessages = {
  please_restart_the_process:
    'Der Anmeldevorgang konnte nicht fortgesetzt werden (Anmeldezustand fehlt oder ist ungültig). Das passiert zum Beispiel nach einem Serverfehler, wenn Cookies blockiert werden oder wenn die Seite während der Anmeldung neu geladen wird. Bitte starten Sie die Anmeldung erneut.',
  state_mismatch:
    'Der Anmeldevorgang wurde unterbrochen oder die Sitzung passt nicht mehr (abgelaufen oder manipuliert). Bitte melden Sie sich erneut an.',
  invalid_callback_url:
    'Die Zielseite für die Anmeldung war ungültig. Bitte starten Sie die Anmeldung erneut.',
  oauth_sign_in_failed:
    'Die Anmeldung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.',
  oauth_sign_in_missing_redirect:
    'Die Anmeldung konnte nicht gestartet werden, weil kein Weiterleitungsziel zurückgegeben wurde.',
  oauth_sign_in_exception:
    'Die Anmeldung konnte wegen eines technischen Fehlers nicht gestartet werden.',
} satisfies Record<string, string>

export function PageOAuthError() {
  const { error, error_description } = routeApi.useSearch()
  const router = useRouter()
  const { href: signInHref } = router.buildLocation({
    to: '/api/sign-in/osm',
    search: { callbackURL: '/' },
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

import { getRouteApi } from '@tanstack/react-router'

const routeApi = getRouteApi('/_pages/oAuthError')

export function PageOAuthError() {
  const { error } = routeApi.useSearch()
  return (
    <>
      <h1>Fehler bei der Nutzung der OpenStreetMap Anmeldung</h1>
      <pre className="mt-4">{error != null ? JSON.stringify({ error }, undefined, 2) : null}</pre>
    </>
  )
}

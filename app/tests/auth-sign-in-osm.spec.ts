import { expect, test } from '@playwright/test'

// Sign-in initiation builds the OSM authorize URL from the configured authorizationUrl and
// writes OAuth state; it never contacts OSM (that only happens on the callback via getUserInfo).
// So this needs no OSM stubbing. It guards the `tilda.state` cookie: /api/sign-in/osm returns its
// own 302, so the cookie only arrives through the tanstackStartCookies plugin.
test.describe('Sign-in – OSM initiation', () => {
  test('redirects to OSM and sets the OAuth state cookie', async ({ request }) => {
    const response = await request.get('/api/sign-in/osm?callbackURL=/', { maxRedirects: 0 })

    expect(response.status()).toBe(302)

    const location = response.headers()['location']
    expect(location).toContain('openstreetmap.org/oauth2/authorize')
    expect(new URL(location ?? '').searchParams.get('redirect_uri')).toMatch(
      /\/api\/auth\/callback\/osm$/,
    )

    const setCookies = response
      .headersArray()
      .filter((header) => header.name.toLowerCase() === 'set-cookie')
      .map((header) => header.value)
    const stateCookie = setCookies.find((cookie) => cookie.startsWith('tilda.state='))

    expect(
      stateCookie,
      `Expected a tilda.state cookie, got: ${setCookies.join(' | ')}`,
    ).toBeTruthy()
    expect(stateCookie).toContain('HttpOnly')
  })

  test('the error page retries with the page the sign-in started from', async ({ page }) => {
    await page.goto('/oAuthError?error=access_denied&callbackURL=/datenschutz')

    const retry = page.getByRole('link', { name: 'Mit OpenStreetMap erneut anmelden' })
    await expect(retry).toHaveAttribute('href', '/api/sign-in/osm?callbackURL=/datenschutz')
  })
})

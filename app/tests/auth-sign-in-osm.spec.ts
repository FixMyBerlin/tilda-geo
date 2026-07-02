import { expect, test } from '@playwright/test'

// Sign-in initiation builds the OSM authorize URL from the configured authorizationUrl and
// writes OAuth state; it never contacts OSM (that only happens on the callback via getUserInfo).
// So this needs no OSM stubbing. It guards the migration regression where /api/sign-in/osm
// dropped the `tilda.state` cookie because auth.handler ran nested and returned a custom 302.
test.describe('Sign-in – OSM initiation', () => {
  test('redirects to OSM and sets the OAuth state cookie', async ({ request }) => {
    const response = await request.get('/api/sign-in/osm?callbackURL=/', { maxRedirects: 0 })

    expect(response.status()).toBe(302)

    const location = response.headers()['location']
    expect(location).toContain('openstreetmap.org/oauth2/authorize')

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
})

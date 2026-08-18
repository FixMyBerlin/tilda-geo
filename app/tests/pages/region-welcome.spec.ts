import { expect, test, type Page } from '@playwright/test'
import { regionWelcomeDemoSpecs } from '../../prisma/seeds/regionWelcomeDemoContent'
import db from '../../src/server/db.server'
import { WELCOME_DISMISSED_COOKIE_NAME } from '../../src/shared/regionen/welcomeDismissCookie'
import { verifyMapRendered, waitForMapLoad } from '../utils/maps'

/**
 * Seeded PUBLIC regions with welcome demo content (`prisma/seeds/regionSeedCatalog.ts`).
 * Hero images are attached by `attachRegionWelcomeDemoImages` during `bun run seed` (from `app/`).
 */
const SLUG_WITH_FAQ = 'radinfra'
const SLUG_NO_FAQ = 'bb-kampagne'
const SLUG_NO_IMAGE = 'parkraum'

const PRIVATE_WELCOME_LEAK = {
  title: 'Private welcome must not leak',
  subtitle: 'Private subtitle must not leak',
  bodyMarkdown: 'Private body markdown must not leak',
} as const

const MOBILE_VIEWPORT = { width: 390, height: 844 }
const E2E_ORIGIN = 'http://127.0.0.1:5173'

const radinfraSpec = regionWelcomeDemoSpecs[SLUG_WITH_FAQ]
const bbKampagneSpec = regionWelcomeDemoSpecs[SLUG_NO_FAQ]
const parkraumSpec = regionWelcomeDemoSpecs[SLUG_NO_IMAGE]

const welcomeDesktopPanel = (page: Page) => page.getByTestId('region-welcome-desktop-panel')
const welcomePanel = (page: Page) => welcomeDesktopPanel(page).getByTestId('region-welcome-panel')
const welcomeMobilePanel = (page: Page) => page.getByTestId('region-welcome-panel-mobile')
const welcomeCloseCta = (page: Page) =>
  page.getByTestId('region-welcome-close-cta').locator('visible=true')
const welcomeToggle = (page: Page) => page.getByTestId('region-welcome-toggle')

async function expectWelcomePanelOpen(page: Page) {
  await expect(welcomeDesktopPanel(page)).toHaveAttribute('aria-hidden', 'false', {
    timeout: 15_000,
  })
  await expect(welcomePanel(page)).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL(/dialog=welcome/, { timeout: 15_000 })
}

async function expectWelcomePanelClosed(page: Page) {
  await expect(page).not.toHaveURL(/dialog=welcome/)
  await expect(welcomeDesktopPanel(page)).toHaveAttribute('aria-hidden', 'true')
}

async function clearWelcomeDismissed(page: Page) {
  await page.context().clearCookies({ name: WELCOME_DISMISSED_COOKIE_NAME })
}

async function setWelcomeDismissed(page: Page, slug: string) {
  await page.context().addCookies([
    {
      name: WELCOME_DISMISSED_COOKIE_NAME,
      value: slug,
      url: E2E_ORIGIN,
      path: '/',
    },
  ])
}

async function openRegionWelcome(page: Page, slug: string) {
  await clearWelcomeDismissed(page)
  await page.goto(`/regionen/${slug}`, { waitUntil: 'domcontentloaded' })
  await expectWelcomePanelOpen(page)
  await waitForMapLoad(page)
}

async function assertRegionExists(slug: string) {
  const region = await db.region.findUnique({ where: { slug }, select: { id: true } })
  if (!region) {
    throw new Error(`E2E region-welcome: region "${slug}" missing — run prisma migrate + seed.`)
  }
  return region
}

async function requirePrivateRegion() {
  const region = await db.region.findFirst({
    where: { status: 'PRIVATE' },
    select: { id: true, slug: true },
    orderBy: { slug: 'asc' },
  })
  if (!region) {
    throw new Error(
      'E2E region-welcome: no PRIVATE region in database — seed at least one PRIVATE region.',
    )
  }
  return region
}

let hasDemoWelcomeImages = false

test.describe('Region welcome panel', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await assertRegionExists(SLUG_WITH_FAQ)
    await assertRegionExists(SLUG_NO_FAQ)
    await assertRegionExists(SLUG_NO_IMAGE)

    const regionWithImage = await db.region.findFirst({
      where: { slug: SLUG_NO_FAQ },
      select: { welcomeImageUploadId: true },
    })
    hasDemoWelcomeImages = regionWithImage?.welcomeImageUploadId != null
  })

  test('auto-opens on first visit with title and subtitle', async ({ page }) => {
    await openRegionWelcome(page, SLUG_WITH_FAQ)

    await expect(
      welcomePanel(page).getByRole('heading', { name: radinfraSpec.title }),
    ).toBeVisible()
    await expect(welcomePanel(page).getByText(radinfraSpec.subtitle)).toBeVisible()
  })

  test('closes via Zur Karte CTA and leaves map interactive', async ({ page }) => {
    await openRegionWelcome(page, SLUG_WITH_FAQ)

    await welcomeCloseCta(page).click()
    await expectWelcomePanelClosed(page)

    await verifyMapRendered(page)
    await page.getByRole('button', { name: 'Zoom in' }).click()
  })

  test('stays dismissed after reload', async ({ page }) => {
    await openRegionWelcome(page, SLUG_WITH_FAQ)

    await welcomeCloseCta(page).click()
    await expectWelcomePanelClosed(page)

    await page.goto(`/regionen/${SLUG_WITH_FAQ}`, { waitUntil: 'domcontentloaded' })
    await waitForMapLoad(page)
    await expectWelcomePanelClosed(page)
  })

  test('reopens via burger after dismissal', async ({ page }) => {
    await openRegionWelcome(page, SLUG_WITH_FAQ)

    await welcomeCloseCta(page).click()
    await expectWelcomePanelClosed(page)

    await welcomeToggle(page).click()
    await expectWelcomePanelOpen(page)
  })

  test('FAQ view swap with Zur Karte CTA in both views', async ({ page }) => {
    await openRegionWelcome(page, SLUG_WITH_FAQ)

    const firstFaq = radinfraSpec.sections[0]!
    await expect(welcomeCloseCta(page)).toBeVisible()
    await expect(welcomePanel(page).getByTestId('region-welcome-welcome-view')).toBeVisible()

    await welcomePanel(page)
      .getByTestId('region-welcome-welcome-view')
      .getByRole('button', { name: 'Häufige Fragen' })
      .click()
    await expect(welcomePanel(page).getByTestId('region-welcome-faq-view')).toBeVisible()
    await expect(welcomePanel(page).getByTestId('region-welcome-welcome-view')).toHaveCount(0)
    await expect(welcomeCloseCta(page)).toBeVisible()

    await page.getByRole('button', { name: firstFaq.title }).click()
    await expect(page.getByText(firstFaq.bodyMarkdown!)).toBeVisible()

    await page.getByRole('button', { name: radinfraSpec.subtitle }).click()
    await expect(welcomePanel(page).getByTestId('region-welcome-welcome-view')).toBeVisible()
    await expect(
      welcomePanel(page).getByRole('heading', { name: radinfraSpec.title }),
    ).toBeVisible()
    await expect(welcomeCloseCta(page)).toBeVisible()
  })

  test('regions without FAQ sections hide the Häufige Fragen link', async ({ page }) => {
    await openRegionWelcome(page, SLUG_NO_FAQ)

    await expect(
      welcomePanel(page).getByRole('heading', { name: bbKampagneSpec.title }),
    ).toBeVisible()
    await expect(welcomePanel(page).getByRole('button', { name: 'Häufige Fragen' })).toHaveCount(0)
  })

  test('regions without image show placeholder on desktop', async ({ page }) => {
    await openRegionWelcome(page, SLUG_NO_IMAGE)

    await expect(welcomePanel(page).getByTestId('region-welcome-hero-placeholder')).toBeVisible()
    await expect(welcomePanel(page).getByTestId('region-welcome-hero-image')).toHaveCount(0)
    await expect(
      welcomePanel(page).getByRole('heading', { name: parkraumSpec.title }),
    ).toBeVisible()
  })

  test('hero image renders when demo assets are seeded', async ({ page }) => {
    test.skip(!hasDemoWelcomeImages, 'Run `bun run seed` from app/ for hero image coverage.')

    await page.setViewportSize({ width: 800, height: 900 })
    await openRegionWelcome(page, SLUG_NO_FAQ)

    await expect(welcomePanel(page).getByTestId('region-welcome-hero-image')).toBeVisible()
    await expect(welcomePanel(page).getByTestId('region-welcome-hero-placeholder')).toHaveCount(0)
    await expect(
      welcomePanel(page).getByTestId('region-welcome-hero-image').locator('img'),
    ).toHaveAttribute('alt', bbKampagneSpec.imageAltText!)
  })

  test('deep link opens panel even when dismissed', async ({ page }) => {
    await setWelcomeDismissed(page, SLUG_WITH_FAQ)

    await page.goto(`/regionen/${SLUG_WITH_FAQ}?dialog=welcome`, { waitUntil: 'domcontentloaded' })
    await expectWelcomePanelOpen(page)
    await waitForMapLoad(page)
  })

  test('__skipDialog=welcome suppresses auto-open', async ({ page }) => {
    await clearWelcomeDismissed(page)
    await page.goto(`/regionen/${SLUG_WITH_FAQ}?__skipDialog=welcome`, {
      waitUntil: 'domcontentloaded',
    })
    await waitForMapLoad(page)

    await expectWelcomePanelClosed(page)
  })

  test('does not show on PRIVATE region even when welcome exists', async ({ page }) => {
    const privateRegion = await requirePrivateRegion()

    await db.region.update({
      where: { id: privateRegion.id },
      data: {
        welcomeEnabled: true,
        welcomeTitle: PRIVATE_WELCOME_LEAK.title,
        welcomeSubtitle: PRIVATE_WELCOME_LEAK.subtitle,
        welcomeBodyMarkdown: PRIVATE_WELCOME_LEAK.bodyMarkdown,
      },
    })

    try {
      await page.goto(`/regionen/${privateRegion.slug}`)
      await expect(page.getByRole('heading', { name: 'Zugriff verweigert' })).toBeVisible()
      await expect(page).not.toHaveURL(/dialog=welcome/)
      await expect(welcomeDesktopPanel(page)).toHaveAttribute('aria-hidden', 'true')
      await expect(welcomeMobilePanel(page)).toHaveCount(0)
      await expect(page.getByText(PRIVATE_WELCOME_LEAK.title)).toHaveCount(0)
      await expect(page.getByText(PRIVATE_WELCOME_LEAK.subtitle)).toHaveCount(0)
      await expect(page.getByText(PRIVATE_WELCOME_LEAK.bodyMarkdown)).toHaveCount(0)
    } finally {
      await db.region.update({
        where: { id: privateRegion.id },
        data: {
          welcomeEnabled: false,
          welcomeTitle: '',
          welcomeSubtitle: null,
          welcomeBodyMarkdown: null,
        },
      })
    }
  })
})

test.describe('Region welcome panel (mobile)', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({ viewport: MOBILE_VIEWPORT })

  test('auto-opens bottom sheet with pinned Zur Karte CTA and FAQ swap', async ({ page }) => {
    await clearWelcomeDismissed(page)
    await page.goto(`/regionen/${SLUG_WITH_FAQ}`, { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/dialog=welcome/, { timeout: 15_000 })
    await expect(welcomeMobilePanel(page)).toBeVisible({ timeout: 15_000 })
    await waitForMapLoad(page)

    await expect(
      welcomeMobilePanel(page).getByRole('heading', { name: radinfraSpec.title }),
    ).toBeVisible()
    await expect(welcomeMobilePanel(page).getByText(radinfraSpec.subtitle)).toBeVisible()
    await expect(welcomeCloseCta(page)).toBeInViewport()

    const firstFaq = radinfraSpec.sections[0]!
    await welcomeMobilePanel(page).getByRole('button', { name: 'Häufige Fragen' }).click()
    await expect(welcomeMobilePanel(page).getByTestId('region-welcome-faq-view')).toBeVisible()
    await expect(welcomeMobilePanel(page).getByTestId('region-welcome-welcome-view')).toHaveCount(0)
    await expect(welcomeCloseCta(page)).toBeInViewport()

    await page.getByRole('button', { name: firstFaq.title }).click()
    await expect(page.getByText(firstFaq.bodyMarkdown!)).toBeVisible()
    await expect(welcomeCloseCta(page)).toBeInViewport()
  })
})

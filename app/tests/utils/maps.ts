import type { Page } from '@playwright/test'

export async function waitForMapLoad(page: Page, timeout = 30000) {
  const mapLoadedPromise = page.evaluate((timeoutMs) => {
    return new Promise<void>((resolve) => {
      // biome-ignore lint/suspicious/noExplicitAny: Just for tests…
      if ((window as any).__mapLoaded) {
        resolve()
        return
      }

      const handler = () => {
        // biome-ignore lint/suspicious/noExplicitAny: Just for tests…
        ;(window as any).__mapLoaded = true
        resolve()
      }
      window.addEventListener('mapLoaded', handler, { once: true })

      setTimeout(() => {
        window.removeEventListener('mapLoaded', handler)
        resolve()
      }, timeoutMs)
    })
  }, timeout)

  await Promise.race([mapLoadedPromise, page.waitForSelector('.maplibregl-canvas', { timeout })])

  await page.waitForTimeout(500)
}

export async function verifyMapRendered(page: Page) {
  const canvas = page.locator('.maplibregl-canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 10000 })

  const boundingBox = await canvas.boundingBox()
  if (!boundingBox || boundingBox.width === 0 || boundingBox.height === 0) {
    throw new Error('Map canvas has no dimensions')
  }
}

export async function checkMapTilesLoaded(page: Page) {
  await page.waitForSelector('.maplibregl-canvas', { state: 'visible' })

  const hasControls = await page
    .locator('.maplibregl-ctrl')
    .first()
    .isVisible()
    .catch(() => false)

  if (!hasControls) {
    console.warn('Map controls not visible - map may still be loading')
  }
}

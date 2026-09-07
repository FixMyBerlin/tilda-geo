import { expect, test } from '@playwright/test'
import { ATLAS_APP_ANCHOR_IDS } from '@/components/regionen/pageRegionSlug/mapData/types'
import { TEST_REGION_URL } from '../fixtures/routes'
import { getMapLayerIds, waitForAtlasGeoLayers, waitForMapLoad } from '../utils/maps'

// Read-only smoke check. Tests that write the MapLayerOrder table live together in
// tests/pages/admin-layer-order.spec.ts (serial), because Playwright runs spec files in
// parallel and the table is a global singleton.

const ANCHORS = ATLAS_APP_ANCHOR_IDS

test('Smoke – map layer order: anchors stay in order and atlas layers splice into the basemap', async ({
  page,
}) => {
  await page.goto(TEST_REGION_URL)
  await page.waitForURL(/map=/, { timeout: 30_000 })
  await waitForMapLoad(page, 60_000)
  await waitForAtlasGeoLayers(page)

  const layerIds = await getMapLayerIds(page)

  const anchorPositions = ANCHORS.map((anchor) => layerIds.indexOf(anchor))
  for (const [i, anchor] of ANCHORS.entries()) {
    expect(anchorPositions[i], `anchor ${anchor} missing from style`).toBeGreaterThan(-1)
  }
  expect(anchorPositions, 'anchors out of order').toEqual(
    [...anchorPositions].sort((a, b) => a - b),
  )

  const atlasLayerPositions = layerIds
    .map((id, position) => ({ id, position }))
    .filter(({ id }) => id.startsWith('source:'))
  expect(atlasLayerPositions.length).toBeGreaterThan(0)

  const belowRoadnameAnchor = layerIds.indexOf('atlas-app-beforeid-below-roadname')
  const splicedBelow = atlasLayerPositions.filter(({ position }) => position < belowRoadnameAnchor)
  expect(splicedBelow.length, 'no atlas layers spliced below the roadname anchor').toBeGreaterThan(
    0,
  )

  const topAnchor = layerIds.indexOf('atlas-app-beforeid-top')
  const lastAtlasLayer = atlasLayerPositions.at(-1)
  expect(lastAtlasLayer!.position).toBeLessThan(topAnchor)
})

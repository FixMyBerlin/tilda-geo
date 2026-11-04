import { expect, test } from '@playwright/test'
import { LAYER_POSITIONS } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/beforeId'
import { TEST_REGION_URL } from '../fixtures/routes'
import { getMapLayerIds, waitForTildaLayers, waitForMapLoad } from '../utils/maps'

// Read-only smoke check. Tests that write the MapLayerOrder table live together in
// tests/pages/admin-layer-order.spec.ts (serial), because Playwright runs spec files in
// parallel and the table is a global singleton.

test('Smoke – map layer order: the basemap has all positions in order and TILDA layers sit between them', async ({
  page,
}) => {
  await page.goto(TEST_REGION_URL)
  await page.waitForURL(/map=/, { timeout: 30_000 })
  await waitForMapLoad(page, 60_000)
  await waitForTildaLayers(page)

  const layerIds = await getMapLayerIds(page)

  const positions = LAYER_POSITIONS.map((position) => layerIds.indexOf(position))
  for (const [i, position] of LAYER_POSITIONS.entries()) {
    expect(positions[i], `${position} missing from the basemap style`).toBeGreaterThan(-1)
  }
  expect(positions, 'LAYER_POSITIONS does not follow the basemap style').toEqual(
    [...positions].sort((a, b) => a - b),
  )

  const tildaLayerPositions = layerIds
    .map((id, position) => ({ id, position }))
    .filter(({ id }) => id.startsWith('source:'))
  expect(tildaLayerPositions.length).toBeGreaterThan(0)

  const belowRoadnameAnchor = layerIds.indexOf('atlas-app-beforeid-below-roadname')
  const splicedBelow = tildaLayerPositions.filter(({ position }) => position < belowRoadnameAnchor)
  expect(splicedBelow.length, 'no TILDA layers spliced below the roadname anchor').toBeGreaterThan(
    0,
  )

  const topAnchor = layerIds.indexOf('atlas-app-beforeid-top')
  const lastTildaLayer = tildaLayerPositions.at(-1)
  expect(lastTildaLayer!.position).toBeLessThan(topAnchor)
})

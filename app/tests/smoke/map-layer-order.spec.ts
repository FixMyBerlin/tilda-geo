import { expect, test } from '@playwright/test'
import { ATLAS_APP_ANCHOR_IDS } from '@/components/regionen/pageRegionSlug/mapData/types'
import { getMapLayerIds, waitForMapLoad } from '../utils/maps'

// Verifies the layer ordering mechanics of <AllSources>/<AllLayers>:
// - our beforeId anchor layers exist in the basemap style, in the expected order
// - Atlas-Geo layers are spliced between the anchors (not stacked on top of the basemap)
// Uses `window.__mainMap`, exposed in Playwright mode on map load.

// Bottom-to-top anchor IDs — see ATLAS_APP_ANCHOR_IDS in mapData/types.ts
const ANCHORS = ATLAS_APP_ANCHOR_IDS

test.describe('Smoke – map layer order', () => {
  test('anchors are present in order and atlas layers are spliced into the basemap', async ({
    page,
  }) => {
    await page.goto('/regionen/bibi')
    // The region page immediately rewrites the URL with map params; wait for that
    // navigation to settle before evaluating in the page (avoids a destroyed context).
    await page.waitForURL(/map=/, { timeout: 30_000 })
    await waitForMapLoad(page, 60_000)

    const layerIds = await getMapLayerIds(page)

    // All beforeId anchors exist and keep their relative order
    const anchorPositions = ANCHORS.map((anchor) => layerIds.indexOf(anchor))
    for (const [i, anchor] of ANCHORS.entries()) {
      expect(anchorPositions[i], `anchor ${anchor} missing from style`).toBeGreaterThan(-1)
    }
    expect(anchorPositions, 'anchors out of order').toEqual(
      [...anchorPositions].sort((a, b) => a - b),
    )

    // Atlas-Geo layers (keys from createLayerKeyAtlasGeo) are rendered…
    const atlasLayerPositions = layerIds
      .map((id, position) => ({ id, position }))
      .filter(({ id }) => id.startsWith('source:'))
    expect(atlasLayerPositions.length).toBeGreaterThan(50)

    // …and spliced into the basemap: some atlas layers sit below the roadname anchor
    // (between basemap layers), instead of everything stacking on top.
    const belowRoadnameAnchor = layerIds.indexOf('atlas-app-beforeid-below-roadname')
    const splicedBelow = atlasLayerPositions.filter(
      ({ position }) => position < belowRoadnameAnchor,
    )
    expect(
      splicedBelow.length,
      'no atlas layers spliced below the roadname anchor',
    ).toBeGreaterThan(0)

    // The top anchor stays above all atlas layers
    const topAnchor = layerIds.indexOf('atlas-app-beforeid-top')
    const lastAtlasLayer = atlasLayerPositions[atlasLayerPositions.length - 1]
    expect(lastAtlasLayer!.position).toBeLessThan(topAnchor)
  })
})

import { serializeMapParam } from '../../utils/mapParam'
import { mapParamFallback } from '../../utils/mapParamFallback.const'
import type { UrlMigration } from './types'

const migration: UrlMigration = (initialUrl) => {
  const url = new URL(initialUrl)

  // MIGRATION: Rename old strings in `config` param
  // We do this migration on string level which makes it a lot easier
  // OLD => NEW
  const config = url.searchParams.get('config')
  if (config) {
    let newConfig = config
    const nameMigrations = {
      // Category names changes:
      // Note: `~a` postfix signals a category, `~s` postfix signals a subcategory, no will match both
      // (One is an array, one is an object, which corresponds to category and subcategory.)
      'i~fromTo~': 'i~poi~',
      'i~shops~': 'i~poi~',
      'i~roadClassification~': 'i~roads~',
      // Done in https://github.com/FixMyBerlin/tilda-geo/commit/5541a6ac3f03e4276e65fa4334c90f3408a48de5
      'i~boundaries~s': 'i~poiBoundaries~s',
      'i~barriers~s': 'i~poiPlusBarriers~s',
      'i~landuse~s': 'i~poiPlusLanduse~s',
      'i~publicTransport~s': 'i~poiPlusPublicTransport~s',
      // Done in https://github.com/FixMyBerlin/tilda-geo/commit/7f8f987b1e4927f79fe7c4f7f7f09f2c54d0781e
      'i~places~s': 'i~poiPlaces~s',
      // Property name changes:
      '~topics~': '~sc~',
    }
    for (const [old, updated] of Object.entries(nameMigrations)) {
      newConfig = newConfig.replaceAll(old, updated)
    }
    url.searchParams.set('config', newConfig)
  }

  // MIGRATION: Update `lat`/`lng`/`zoom` params to new `map` param
  // We either have all three or only lat/lng as input params
  const lat = url.searchParams.get('lat')
  const lng = url.searchParams.get('lng')
  const zoom = url.searchParams.get('zoom')
  if ((lat && lng && zoom) || (lat && lng)) {
    // Sometimes, we have a ?map but also ?lng, ?lat in which case we just delete the old stuff
    if (!url.searchParams.get('map')) {
      url.searchParams.append(
        'map',
        serializeMapParam({
          zoom: zoom ? Number(zoom) : mapParamFallback.zoom,
          lat: lat ? Number(lat) : mapParamFallback.lat,
          lng: lng ? Number(lng) : mapParamFallback.lng,
        }),
      )
    }
    url.searchParams.delete('lat')
    url.searchParams.delete('lng')
    url.searchParams.delete('zoom')
  }

  return url.toString()
}

export default migration

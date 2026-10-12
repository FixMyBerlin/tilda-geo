import { Layer, Source } from 'react-map-gl/maplibre'
import { useRegionBackgrounds } from '@/components/regionen/pageRegionSlug/background/useRegionBackgrounds'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import { layerVisibility } from '../utils/layerVisibility'
import { RASTER_BACKGROUND_POSITION } from './utils/beforeId'

// Source and Layers are two components, see <AllSources> and <AllLayers>.

export const SourcesRasterBackgrounds = () => {
  const backgrounds = useRegionBackgrounds()

  return (
    <>
      {backgrounds.map(({ id, tilesUrl, minzoom, maxzoom, tileSize, scheme, attributionHtml }) => {
        const backgroundId = `${id}_tiles`

        // TODO A: The idea was to be able to use {x}… params in the attribution string
        //    however, that causes React devtool warnings `Unable to update <Source> prop: attribution`.
        //    So for now, this is disabled…
        const enhancedAttributionHtml = attributionHtml
        // const enhancedAttributionHtml = replaceZxy({
        //   url: attributionHtml,
        //   zoom,
        //   lat,
        //   lng,
        // })

        return (
          <Source
            id={backgroundId}
            key={backgroundId}
            type="raster"
            tiles={[tilesUrl]}
            attribution={enhancedAttributionHtml}
            {...(maxzoom ? { maxzoom } : {})}
            {...(minzoom ? { minzoom } : {})}
            {...(tileSize ? { tileSize } : {})}
            {...(scheme ? { scheme } : {})}
          />
        )
      })}
    </>
  )
}

export const LayersRasterBackgrounds = () => {
  const { backgroundParam } = useBackgroundParam()
  const backgrounds = useRegionBackgrounds()

  // The background covers the basemap layers below it; the Atlas-Geo layers of positions below it
  // move right above it (`beforeIdOnBackground`). Check the list via <Map> => `handleLoad` => `console.log`.

  return (
    <>
      {backgrounds.map(({ id }) => {
        const backgroundId = `${id}_tiles`
        const visible = backgroundParam === id

        return (
          <Layer
            id={id}
            key={id}
            type="raster"
            source={backgroundId}
            layout={layerVisibility(visible)}
            beforeId={RASTER_BACKGROUND_POSITION}
          />
        )
      })}
    </>
  )
}

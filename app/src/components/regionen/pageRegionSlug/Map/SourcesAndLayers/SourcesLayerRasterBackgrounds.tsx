import { Fragment } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useRegionBackgrounds } from '@/components/regionen/pageRegionSlug/background/useRegionBackgrounds'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import { layerVisibility } from '../utils/layerVisibility'

export const SourcesLayerRasterBackgrounds: React.FC = () => {
  const { backgroundParam } = useBackgroundParam()
  const backgrounds = useRegionBackgrounds()

  // Last layer in Array `allLayer.filter((l) => l.source === 'openmaptiles')`
  // Picking a different layer would who maptiler Vector data on top of the background
  // Check the list via <Map> => `handleLoad` => `console.log`
  // See also <SourceAndLayers> => `layerOrder`
  const beforeId = 'atlas-app-beforeid-below-roadname'

  return (
    <>
      {backgrounds.map(({ id, tilesUrl, minzoom, maxzoom, tileSize, scheme, attributionHtml }) => {
        const backgroundId = `${id}_tiles`

        const visible = backgroundParam === id

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
          <Fragment key={backgroundId}>
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
            <Layer
              id={id}
              key={id}
              type="raster"
              source={backgroundId}
              layout={layerVisibility(visible)}
              beforeId={beforeId}
            />
          </Fragment>
        )
      })}
    </>
  )
}

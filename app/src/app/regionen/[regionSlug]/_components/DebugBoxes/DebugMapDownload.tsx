import { useMapLoaded } from '@/src/app/regionen/[regionSlug]/_hooks/mapState/useMapState'
import { featureCollection } from '@turf/helpers'
import { LayerSpecification } from 'maplibre-gl'
import { useMap } from 'react-map-gl/maplibre'

type Props = { layers: LayerSpecification[] }

export const DebugMapDownload = ({ layers }: Props) => {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()

  if (!mapLoaded || !mainMap || !layers || layers.length === 0) return null

  const dateTody = new Date().toISOString().split('T')[0]

  const downloadLayers = layers.filter(
    (layer) =>
      layer?.id &&
      mainMap.getMap().getLayer(layer.id) &&
      layer?.layout?.visibility === 'visible' &&
      !layer.id.includes('-highlight') &&
      !layer.id.includes('-hitarea') &&
      layer.id.includes('default'),
  )

  // TODO: Figure out why `querySourceFeatures` does not work.
  //    https://maplibre.org/maplibre-gl-js-docs/api/map/#map#querysourcefeatures
  //    OR, confirm that `queryRenderedFeatures(undefined,{})` (undefined == current viewbox)
  //    behaves similar enough that we don't need to figure this out.
  //    The issue was, that it always returned `[]`. Even when isSourceLoaded is true
  //    (https://maplibre.org/maplibre-gl-js-docs/api/map/#map#issourceloaded)
  //    This example works, apparently https://docs.mapbox.com/mapbox-gl-js/example/query-similar-features/
  //    Next: Maybe more testing with the source prop? https://github.com/maplibre/maplibre-gl-js/issues/1952
  // mainMap
  //   .getMap()
  //   .querySourceFeatures(layer.source, {
  //     sourceLayer: layer.id,
  //     filter: ['all'],
  //   }),

  return (
    <details>
      <summary className="cursor-pointer hover:font-semibold">
        Download {downloadLayers.length}
      </summary>

      <table>
        <tbody>
          {downloadLayers.map((layer) => {
            const features = mainMap.queryRenderedFeatures(undefined, {
              layers: [layer.id],
            })
            const featureColl = featureCollection(features)

            const dataString = `data:application/json,${JSON.stringify(featureColl)}`

            return (
              <tr key={layer.id} className="border-b border-pink-200 text-left first:border-t">
                <th className="font-normal">
                  <strong>{layer.id}</strong>
                  <br />
                  {
                    // @ts-ignore again this AnyLayer issue
                    layer.source
                  }
                </th>
                <td className="whitespace-nowrap">
                  <a
                    className="underline hover:decoration-2"
                    download={`${dateTody}--${layer.id}.geojson`}
                    href={dataString}
                  >
                    Download {features.length.toLocaleString()}
                  </a>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </details>
  )
}

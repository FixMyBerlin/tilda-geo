import { getTilesUrl, isDevTilesUrl } from '@/src/app/_components/utils/getTilesUrl'
import { StyleSpecification } from 'maplibre-gl'
import { useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import {
  useMapDebugActions,
  useMapDebugShowDebugInfo,
  useMapDebugUseDebugCachelessTiles,
  useMapDebugUseDebugLayerStyles,
} from '../../_hooks/mapState/useMapDebugState'
import { useMapLoaded } from '../../_hooks/mapState/useMapState'
import { useInteractiveLayers } from '../Map/utils/useInteractiveLayers'
import { DebugMapDownload } from './DebugMapDownload'

export const DebugMap = () => {
  const showDebugInfo = useMapDebugShowDebugInfo()
  const useDebugLayerStyles = useMapDebugUseDebugLayerStyles()
  const useDebugCachelessTiles = useMapDebugUseDebugCachelessTiles()
  const { setShowDebugInfo, setUseDebugLayerStyles, setUseDebugCachelessTiles } =
    useMapDebugActions()
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const [_triggerRerender, setTriggerRerender] = useState(0)
  const [layerFilter, setLayerFilter] = useState('')

  const interactiveLayerIds = useInteractiveLayers()

  const handleRerender = () => setTriggerRerender((prev) => prev + 1)

  if (!showDebugInfo || !mapLoaded || !mainMap) return null

  // There are situations, when all our guards are not enough and `mainMap.getStyle()` still errors.
  // One way to force this is: (1) open /regionen/bibi, (2) Goto "Acount bearbeiten", (3) Save the form, (4) Use the browser back to show the map again.
  let getStyles: StyleSpecification | undefined = undefined
  let orderedLayers: string[] = []
  try {
    getStyles = mainMap.getStyle()
    orderedLayers = mainMap.getLayersOrder()
  } catch (error) {
    console.warn('DebugMap', { error })
    return null
  }

  const allSources = getStyles?.sources
  const allLayers = getStyles?.layers
  if (!allSources || !allLayers) return null

  const vectorSources = Object.entries(allSources).filter(([_, value]) => value.type === 'vector')
  const rasterSources = Object.entries(allSources).filter(([_, value]) => value.type === 'raster')
  const atlasLayers = allLayers
    .filter((layer) => {
      return 'source' in layer && layer.source !== 'openmaptiles' && layer.type !== 'raster'
    })
    .flat()
  if (!vectorSources || !rasterSources || !atlasLayers) return null

  return (
    <div className="group absolute top-3 right-[8.5rem] z-30 max-h-[95%] max-w-[25rem] space-y-0.5 overflow-y-auto rounded bg-pink-300 px-2 py-2 text-[10px] shadow-xl">
      <button
        className="absolute top-0 right-0 z-10 flex h-5 w-5 items-center justify-center rounded-full border bg-purple-500/90 opacity-0 group-hover:opacity-100 hover:bg-purple-800 hover:text-purple-200"
        onClick={() => setShowDebugInfo(false)}
      >
        &times;
      </button>

      <div className="flex flex-col gap-1">
        <button
          onClick={() => setUseDebugLayerStyles(!useDebugLayerStyles)}
          className="rounded border px-1"
        >
          Debug Style {useDebugLayerStyles ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => setUseDebugCachelessTiles(!useDebugCachelessTiles)}
          className={twJoin('rounded border px-1', isDevTilesUrl ? 'line-through' : '')}
          disabled={isDevTilesUrl}
        >
          Cachless tiles {useDebugCachelessTiles ? 'ON' : 'OFF'}
        </button>
      </div>

      <details>
        <summary className="cursor-pointer hover:font-semibold">Sources</summary>

        <details className="ml-2 border-l border-pink-200 pl-2">
          <summary className="cursor-pointer hover:font-semibold">
            Vector {Object.keys(vectorSources).length}
          </summary>
          <pre>{JSON.stringify(vectorSources, undefined, 2)}</pre>
        </details>
        <details className="ml-2 border-l border-pink-200 pl-2">
          <summary className="cursor-pointer hover:font-semibold">
            Raster {Object.keys(rasterSources).length}
          </summary>
          <pre>{JSON.stringify(rasterSources, undefined, 2)}</pre>
        </details>

        <div className="font-mono">getTilesUrl: {getTilesUrl()}</div>
      </details>

      <DebugMapDownload layers={atlasLayers} />

      <details>
        <summary className="cursor-pointer hover:font-semibold" onClick={handleRerender}>
          Layers {Object.keys(atlasLayers).length}
        </summary>

        <button
          type="button"
          onClick={handleRerender}
          className="p-1 font-bold underline hover:text-pink-700"
        >
          Manually update layers (eg. after filter changes)
        </button>
        <input onChange={(e) => setLayerFilter(e.target.value)} placeholder="Filter Layer" />

        {Object.entries(atlasLayers)
          .filter(([_key, layer]) => (Boolean(layerFilter) ? layer.id.includes(layerFilter) : true))
          .map(([_key, layer]) => {
            const layerName =
              'source' in layer && layer.source.includes('atlas')
                ? layer.id?.split('--')
                : [layer.id]
            return (
              <details key={layer.id} className="ml-2 border-l border-pink-200 pb-1 pl-2">
                <summary
                  className={twJoin(
                    layer?.layout?.visibility === 'visible' ? 'font-semibold' : '',
                    'cursor-pointer truncate hover:underline',
                  )}
                  title={layer.id}
                >
                  {/* @ts-ignore this weird AnyLayer issue that I don't get worked around… */}
                  {layer?.layout?.visibility === 'none' && '(off)'}
                  {/* @ts-ignore this weird AnyLayer issue that I don't get worked around… */}
                  {layer?.layout?.visibility === 'visible' && '(on)'}{' '}
                  {layerName.map((line, index) => (
                    <code key={`${line}${index}`} className={index == 0 ? '' : 'block'}>
                      {line}
                    </code>
                  ))}
                </summary>
                <pre>{JSON.stringify(layer, undefined, 2)}</pre>
              </details>
            )
          })}
      </details>

      <details>
        <summary className="cursor-pointer hover:font-semibold">interactiveLayerIds</summary>

        <ul>
          {interactiveLayerIds.map((layerId) => (
            <li key={`interactiveLayerIds${layerId}`}>{layerId}</li>
          ))}
        </ul>
      </details>

      <details>
        <summary className="cursor-pointer hover:font-semibold">All layer</summary>

        <table>
          <thead>
            <tr>
              <th>index</th>
              <th>source</th>
              <th>type</th>
              <th>id</th>
            </tr>
          </thead>
          <tbody>
            {allLayers.map((layer) => {
              const source = 'source' in layer ? (layer?.source ?? '-') : '-'
              return (
                <tr key={`all${layer.id}`} className="border-t border-t-white/10 leading-tight">
                  <td className={source == 'openmaptiles' ? 'font-semibold' : ''}>
                    <div className="w-28 truncate">{source}</div>
                  </td>
                  <td>{layer.type}</td>
                  <td>{layer.id}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </details>

      <details>
        <summary className="cursor-pointer hover:font-semibold">
          Ordered Layers ({orderedLayers.length})
        </summary>
        {orderedLayers.map((layer, index) => (
          <details key={layer} className="mt-0.5">
            <summary className="flex cursor-pointer items-center gap-2 hover:underline">
              <div className="flex min-w-6 items-center justify-center rounded bg-white/20 px-0.5">
                {index}
              </div>{' '}
              {layer}
            </summary>
            <div className="text-white/60">
              <pre>
                <code>
                  {JSON.stringify(
                    allLayers.find((l) => l.id === layer),
                    undefined,
                    2,
                  ) || 'NOT FOUND'}
                </code>
              </pre>
            </div>
          </details>
        ))}
      </details>
    </div>
  )
}

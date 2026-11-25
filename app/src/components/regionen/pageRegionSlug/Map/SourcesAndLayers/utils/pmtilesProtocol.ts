import type { AddProtocolAction } from 'maplibre-gl'
import { Protocol, TileType } from 'pmtiles'

const pmtilesPrefix = 'pmtiles://'

export const createPmtilesUrl = (url: string) => {
  return `${pmtilesPrefix}${url}`
}

// MapLibre sends two kinds of requests for a `pmtiles://` source through this protocol:
// 1. `type: 'json'`, once per source when it loads: the TileJSON. The pmtiles protocol builds it in memory
//    from the PMTiles header (zoom levels, bounds, tile URL `pmtiles://…/{z}/{x}/{y}`); there is no file.
// 2. `type: 'arrayBuffer'`, for every tile: the tile bytes, read by range request from the PMTiles file.
// The PMTiles header says whether the archive holds MVT or MLT tiles, but the pmtiles protocol leaves
// `encoding` out of the TileJSON. We add it in step 1; MapLibre reads `encoding` from the TileJSON
// (`loadTileJson`) and decodes every tile of the source with it, so MVT and MLT files need no source config.
export const createPmtilesProtocolAction = () => {
  const protocol = new Protocol()
  const action: AddProtocolAction = async (params, abortController) => {
    // pmtiles types `cacheControl` as `string | undefined`, MapLibre as optional `string`
    const response = (await protocol.tilev4(params, abortController)) as Awaited<
      ReturnType<AddProtocolAction>
    >
    // Tile request (`arrayBuffer`): pass the tile bytes from the PMTiles file through unchanged
    if (params.type !== 'json') return response

    const archive = protocol.get(params.url.slice(pmtilesPrefix.length))
    const header = await archive?.getHeader()
    // For `type: 'json'` the data is the TileJSON object
    const tileJson = response.data as Record<string, unknown>

    // MLT: our new PMTiles, built by manby with `--tile-format=mlt`
    if (header?.tileType === TileType.Mlt) return { data: { ...tileJson, encoding: 'mlt' } }
    // MVT: our old PMTiles, built by tippecanoe before the switch to MLT (also MapLibre's default)
    return { data: { ...tileJson, encoding: 'mvt' } }
  }
  return action
}

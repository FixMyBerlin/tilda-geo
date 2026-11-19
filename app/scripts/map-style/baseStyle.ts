import path from 'node:path'
import {
  LAYER_POSITIONS,
  type LayerPosition,
} from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/beforeId'
import { MAPTILER_API_KEY } from '@/components/regionen/pageRegionSlug/Map/utils/maptilerApiKey.const'
import {
  BACKGROUND_STYLES,
  type BackgroundStyleId,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/backgroundStyles.const'

type BaseStyle = { layers: { id: string; [key: string]: unknown }[] }

export const baseStylePath = (id: BackgroundStyleId) =>
  path.join(import.meta.dir, `../../src/server/api/map-style/styles/${id}.json`)

/**
 * Inserts an empty layer for each anchor that the style lacks (`anchorsBefore`), so that our
 * layers find every `LAYER_POSITIONS` layer in every style.
 */
const insertAnchors = (id: BackgroundStyleId, style: BaseStyle) => {
  const anchorsBefore: Partial<Record<LayerPosition, string>> = BACKGROUND_STYLES[id].anchorsBefore
  for (const anchor of LAYER_POSITIONS) {
    const before = anchorsBefore[anchor]
    if (!before) continue
    const index = style.layers.findIndex((layer) => layer.id === before)
    if (index === -1) throw new Error(`${id}: layer "${before}" for anchor "${anchor}" not found`)
    style.layers.splice(index, 0, {
      id: anchor,
      type: 'background',
      layout: { visibility: 'none' },
    })
  }
  return style
}

/** Fetched from the EU endpoint, so the style's tile and font URLs point there as well. */
export const fetchBaseStyle = async (id: BackgroundStyleId) => {
  const url = `https://api.maptiler.eu/maps/${BACKGROUND_STYLES[id].maptilerMapId}/style.json?key=${MAPTILER_API_KEY}`
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) {
    throw new Error(`Maptiler answered ${response.status} ${response.statusText}`)
  }
  return insertAnchors(id, (await response.json()) as BaseStyle)
}

export const readLocalBaseStyle = async (id: BackgroundStyleId) => {
  return (await Bun.file(baseStylePath(id)).json()) as BaseStyle
}

/** The layers our own layers are placed below, missing or out of order; without them the layer order breaks. */
export const anchorLayerProblems = (style: BaseStyle) => {
  const layerIds = style.layers.map((layer) => layer.id)
  const indexes = LAYER_POSITIONS.map((anchor) => layerIds.indexOf(anchor))
  const missing = LAYER_POSITIONS.filter((_, i) => indexes[i] === -1)
  if (missing.length) return `missing: ${missing.join(', ')}`
  const outOfOrder = LAYER_POSITIONS.filter((_, i) => i > 0 && indexes[i]! < indexes[i - 1]!)
  if (outOfOrder.length) return `out of order: ${outOfOrder.join(', ')}`
  return null
}

export const isSameStyle = (a: BaseStyle, b: BaseStyle) => {
  return JSON.stringify(a) === JSON.stringify(b)
}

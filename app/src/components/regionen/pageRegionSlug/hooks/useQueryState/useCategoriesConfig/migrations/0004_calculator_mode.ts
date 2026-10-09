import {
  CALCULATOR_AREA_PRECISION,
  calculatorAreasToParam,
  compactCalculatorModeParam,
  parseCalculatorModeParam,
  zodCalculatorModeParam,
} from '@/components/regionen/pageRegionSlug/modes/calculator/calculatorModeParam'
import type { DrawArea } from '@/components/regionen/pageRegionSlug/modes/calculator/drawing/drawAreaTypes'
import { jsurlParse } from '../v1/jurlParseStringify'
import type { UrlMigration } from './types'

/** Links from older drawing tools may hold more decimals than areas have today. */
const roundToAreaPrecision = (area: DrawArea) => {
  const factor = 10 ** CALCULATOR_AREA_PRECISION
  const round = (value: number) => Math.round(value * factor) / factor
  return {
    ...area,
    geometry: {
      ...area.geometry,
      coordinates: area.geometry.coordinates.map((ring) =>
        ring.map(([lng, lat]) => [round(lng ?? 0), round(lat ?? 0)]),
      ),
    },
  } satisfies DrawArea
}

const isDrawArea = (value: unknown): value is DrawArea => {
  const area = value as Partial<DrawArea> | null
  return (
    typeof area?.id === 'string' &&
    area.geometry?.type === 'Polygon' &&
    Array.isArray(area.geometry.coordinates?.[0])
  )
}

/**
 * The area calculator became the Summieren mode, with its whole state in `sum`.
 *
 * - The drawn areas move from `draw` (jsurl list of GeoJSON features) to `sum.areas` (one
 *   GeoJSON geometry).
 * - This version also marks links whose `config` was read for entries that left the categories
 *   (calculator subcategories, Mapillary category). That needs the decoded `config`, which is
 *   only there later in `getRegionRedirectUrl`: `migrateRemovedConfigEntries.server.ts`.
 */
const migration: UrlMigration = function calculatorMode(initialUrl) {
  const url = new URL(initialUrl)
  const draw = url.searchParams.get('draw')
  if (draw === null) return initialUrl
  url.searchParams.delete('draw')

  const parsed: unknown = jsurlParse(draw)
  const areas = calculatorAreasToParam(
    Array.isArray(parsed) ? parsed.filter(isDrawArea).map(roundToAreaPrecision) : [],
  )
  if (areas) {
    // Validated like the live param; a `sum` that is already there keeps its own areas.
    const sum = { areas, ...parseCalculatorModeParam(url.searchParams.get('sum')) }
    const compact = compactCalculatorModeParam(zodCalculatorModeParam.parse(sum))
    if (compact) url.searchParams.set('sum', JSON.stringify(compact))
  }

  return url.toString()
}

export default migration

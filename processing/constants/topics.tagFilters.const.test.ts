import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { topicsConfig, type Topic } from './topics.const'
import { tagFilterProfiles } from './topics.tagFilters.const'

const processingRoot = join(import.meta.dir, '..')

const parkingOffStreetBuildingExpressions = [
  'wr/building=carport',
  'wr/building=garage',
  'wr/building=garages',
  'wr/building=parking',
] as const

function expressionObjectScopes(expressions: readonly string[]) {
  return {
    node: expressions.some((e) => e.startsWith('n') || e.startsWith('nw') || e.startsWith('nwr')),
    way: expressions.some((e) => {
      const prefix = e.split('/')[0] ?? ''
      return prefix.includes('w')
    }),
    relation: expressions.some(
      (e) => e.startsWith('r') || e.startsWith('wr') || e.startsWith('nwr'),
    ),
  }
}

const topicHandlerScopes: Record<Topic, { node?: boolean; way?: boolean; relation?: boolean }> = {
  roads_bikelanes: { way: true },
  bikeroutes: { relation: true },
  bicycleParking: { node: true, way: true },
  trafficSigns: { node: true, way: true },
  boundaries: { relation: true },
  places: { node: true, way: true, relation: true },
  publicTransport: { node: true, way: true, relation: true },
  poiClassification: { node: true, way: true, relation: true },
  barriers: { way: true, relation: true },
  landcover: { way: true, relation: true },
  parking: { node: true, way: true, relation: true },
}

describe('topics.tagFilters.const', () => {
  it('every topic maps to a non-empty profile', () => {
    for (const [topic, entry] of topicsConfig) {
      expect(tagFilterProfiles[entry.tagFilterProfile].length, topic).toBeGreaterThan(0)
    }
  })

  it('features profile has no broad road or barrier keys', () => {
    expect(tagFilterProfiles.features).not.toContain('w/highway')
    expect(tagFilterProfiles.features).not.toContain('w/railway')
    expect(tagFilterProfiles.features).not.toContain('w/waterway')
    expect(tagFilterProfiles.features).not.toContain('wr/natural')
    expect(tagFilterProfiles.features).not.toContain('wr/aeroway')
    expect(tagFilterProfiles.features).not.toContain('n/traffic_sign*')
    expect(tagFilterProfiles.features).not.toContain('wr/building')
    expect(tagFilterProfiles.features).not.toContain('nw/crossing')
    expect(tagFilterProfiles.features).not.toContain('r/boundary=administrative')
    expect(tagFilterProfiles.features).not.toContain('r/route=bicycle')
  })

  it('features profile covers POI leisure and public transport railway imports', () => {
    expect(topicsConfig.get('poiClassification')?.tagFilterProfile).toBe('features')
    expect(topicsConfig.get('publicTransport')?.tagFilterProfile).toBe('features')
    expect(tagFilterProfiles.features).toContain('nwr/leisure')
    expect(tagFilterProfiles.features).toContain('w/railway=station,halt,tram_stop')
  })

  it('bikeroutes and boundaries share the relations profile', () => {
    expect(topicsConfig.get('bikeroutes')?.tagFilterProfile).toBe('relations')
    expect(topicsConfig.get('boundaries')?.tagFilterProfile).toBe('relations')
    expect(tagFilterProfiles.relations).toContain('r/route=bicycle')
    expect(tagFilterProfiles.relations).toContain('r/boundary=administrative')
  })

  it('trafficSigns shares the roadsBikelanes profile with roads_bikelanes', () => {
    expect(topicsConfig.get('trafficSigns')?.tagFilterProfile).toBe('roadsBikelanes')
    expect(topicsConfig.get('roads_bikelanes')?.tagFilterProfile).toBe('roadsBikelanes')
  })

  it('every topic profile covers the OSM object types its Lua handlers use', () => {
    for (const [topic, entry] of topicsConfig) {
      const handlers = topicHandlerScopes[topic]
      const scopes = expressionObjectScopes(tagFilterProfiles[entry.tagFilterProfile])

      if (handlers.node) expect(scopes.node, topic).toBe(true)
      if (handlers.way) expect(scopes.way, topic).toBe(true)
      if (handlers.relation) expect(scopes.relation, topic).toBe(true)
    }
  })

  it('monolithicUnion matches the former filter-expressions.txt snapshot', () => {
    const legacyPath = join(processingRoot, 'filter/osmiumTagFilter/filter-expressions.legacy.txt')
    const legacySource = readFileSync(legacyPath, 'utf8')
    const legacyExpressions = legacySource
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))

    expect([...tagFilterProfiles.monolithicUnion]).toEqual(legacyExpressions)
  })

  it('parking uses monolithicUnion profile', () => {
    expect(topicsConfig.get('parking')?.tagFilterProfile).toBe('monolithicUnion')
  })

  it('parking profile keeps broad obstacle keys and covers public transport imports', () => {
    expect(tagFilterProfiles.parking).toContain('nwr/amenity')
    expect(tagFilterProfiles.parking).toContain('nw/barrier')
    expect(tagFilterProfiles.parking).toContain('nw/leisure')
    expect(tagFilterProfiles.parking).toContain('nw/man_made')
    expect(tagFilterProfiles.parking).toContain('nw/natural')
    expect(tagFilterProfiles.parking).toContain('nw/outdoor_seating')
    expect(tagFilterProfiles.parking).toContain('nw/landuse')
    expect(tagFilterProfiles.parking).toContain('nw/public_transport')
    expect(tagFilterProfiles.parking).toContain('nw/railway')
    expect(tagFilterProfiles.parking).toContain('n/traffic_sign*')
  })

  it('parking off-street building expressions stay in sync with parking Lua', () => {
    const sanitizePath = join(processingRoot, 'topics/parking/helper/sanitize_parking_tags.lua')
    const categoriesPath = join(
      processingRoot,
      'topics/parking/off_street_parking/areas/off_street_parking_area_categories.lua',
    )
    const sanitizeSource = readFileSync(sanitizePath, 'utf8')
    const categoriesSource = readFileSync(categoriesPath, 'utf8')

    for (const expression of parkingOffStreetBuildingExpressions) {
      expect(tagFilterProfiles.parking, expression).toContain(expression)
      const buildingValue = expression.replace('wr/building=', '')
      expect(categoriesSource, `categories missing building ${buildingValue}`).toContain(
        `'${buildingValue}'`,
      )
    }

    expect(sanitizeSource).toContain("parking = 'multi-storey'")
    expect(sanitizeSource).toContain("garage = 'garage'")
    expect(sanitizeSource).toContain("garages = 'garage'")
    expect(sanitizeSource).toContain("carport = 'carport'")
  })

  it('roadsBikelanes profile covers highways and traffic sign nodes', () => {
    expect(tagFilterProfiles.roadsBikelanes).toContain('w/highway')
    expect(tagFilterProfiles.roadsBikelanes).toContain('n/traffic_sign*')
  })

  it('barriers profile uses trunk/motorway highways only, not all w/highway', () => {
    expect(tagFilterProfiles.barriers).not.toContain('w/highway')
    expect(tagFilterProfiles.barriers).toContain(
      'w/highway=motorway,motorway_link,trunk,trunk_link',
    )
    expect(tagFilterProfiles.barriers).toContain('w/railway')
    expect(tagFilterProfiles.barriers).toContain('w/waterway')
  })

  it('barrier trunk/motorway values stay in sync with highway_classes.lua', () => {
    const highwayClassesPath = join(processingRoot, 'topics/helper/highway_classes.lua')
    const source = readFileSync(highwayClassesPath, 'utf8')

    for (const highway of ['motorway', 'motorway_link', 'trunk', 'trunk_link']) {
      expect(source, `highway_classes.lua missing ${highway}`).toContain(`'${highway}'`)
    }
  })

  it('landcover profile includes buildings and leisure', () => {
    expect(tagFilterProfiles.landcover).toContain('wr/building')
    expect(tagFilterProfiles.landcover).toContain('wr/leisure')
  })
})

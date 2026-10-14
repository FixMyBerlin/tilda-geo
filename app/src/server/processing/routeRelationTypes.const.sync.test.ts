import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { routeRelationTypes } from '@/data/processingTypes/routeRelationTypes.const'

// processing cannot import from app/, so the route types live in two files that must agree:
// processing/topics/helper/route_types.lua (source) and the app mirror (adds German labels).
const luaSource = readFileSync(
  join(import.meta.dirname, '../../../../processing/topics/helper/route_types.lua'),
  'utf8',
)
const luaRoutes = Object.fromEntries(
  Array.from(luaSource.matchAll(/^\s+(\w+) = '(\w+)',$/gm), ([, route, table]) => [route, table]),
)

describe('routeRelationTypes.const sync', () => {
  it('lists the same routes and tables as route_types.lua', () => {
    const appRoutes = Object.fromEntries(
      Object.entries(routeRelationTypes).map(([route, { table }]) => [route, table]),
    )
    expect(appRoutes).toEqual(luaRoutes)
  })
})

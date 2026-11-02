/**
 * Route types whose relations processing writes to `route_relations`, with their `routes` topic
 * table and a German label (app-only). Hand-mirrored from processing/topics/helper/route_types.lua;
 * routeRelationTypes.const.sync.test.ts checks that both list the same routes and tables.
 */
export const routeRelationTypes = {
  bicycle: { table: 'bikeroutes', label: 'Fahrrad' },
  mtb: { table: 'mtbroutes', label: 'Mountainbike' },
  bus: { table: 'busroutes', label: 'Bus' },
  foot: { table: 'footroutes', label: 'Spaziergang' },
  hiking: { table: 'hikingroutes', label: 'Wandern' },
} as const

export type RouteRelationType = keyof typeof routeRelationTypes

/**
 * Pseudo relations: network classes from external data (processing pseudo tags), written as
 * `<group>:<class>` into `route_relations`, one class per line. Not checked by the sync test;
 * the group name comes from processing/topics/roads_bikelanes/route_relations/pseudo_route_relations.lua.
 */
export const pseudoRouteRelationTypes = {
  radnetz_berlin: { label: 'Radnetz Berlin' },
} as const

export type PseudoRouteRelationType = keyof typeof pseudoRouteRelationTypes

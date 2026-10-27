import type { ExpressionSpecification } from 'maplibre-gl'
import {
  type PseudoRouteRelationType,
  pseudoRouteRelationTypes,
  type RouteRelationType,
  routeRelationTypes,
} from '@/data/processingTypes/routeRelationTypes.const'

export type RouteRelationGroup = {
  route: RouteRelationType
  relationIds: number[]
}

type PseudoRouteRelation = {
  group: PseudoRouteRelationType
  value: string
}

export const routeRelationsKey = 'route_relations'

const isRouteRelationType = (name: string): name is RouteRelationType =>
  Object.hasOwn(routeRelationTypes, name)

const isPseudoRouteRelationType = (name: string): name is PseudoRouteRelationType =>
  Object.hasOwn(pseudoRouteRelationTypes, name)

/**
 * Splits `tags.route_relations` as processing writes it, e.g.
 * `bicycle:2788485,12138805;bus:1234567;radnetz_berlin:Vorrangnetz`, into OSM routes and pseudo
 * relations (one class per line).
 */
export const parseRouteRelations = (value: string | undefined) => {
  const groups = (value?.split(';') ?? []).map((group) => {
    const [name = '', entries = ''] = group.split(':')
    return { name, entries }
  })
  return {
    routes: groups.flatMap(({ name, entries }) =>
      isRouteRelationType(name)
        ? [
            {
              route: name,
              relationIds: entries.split(',').map(Number),
            } satisfies RouteRelationGroup,
          ]
        : [],
    ),
    pseudo: groups.flatMap(({ name, entries }) =>
      isPseudoRouteRelationType(name)
        ? [{ group: name, value: entries } satisfies PseudoRouteRelation]
        : [],
    ),
  }
}

/** What the inspector highlights on hover: one OSM route relation or one pseudo class. */
export type RouteRelationHighlight = { relationId: number } | PseudoRouteRelation

type RouteRelationDetail = { ref: string | null; name: string | null }

export const routeRelationTitle = (relationId: number, detail?: RouteRelationDetail) =>
  [detail?.ref, detail?.name].filter(Boolean).join(' – ') || `relation/${relationId}`

/** Short label for links: the ref, else the name, else the relation id. */
export const routeRelationShortTitle = (relationId: number, detail?: RouteRelationDetail) =>
  detail?.ref || detail?.name || `relation/${relationId}`

/**
 * Matches features whose `route_relations` contain the relation id or pseudo class. The value is
 * wrapped in `;`. A relation id follows `:` (first of its route) or `,` and is followed by `,` or
 * `;`. A pseudo class is the only entry of its group, so it is matched as `;<group>:<class>;`.
 */
export const routeRelationFilter = (highlight: RouteRelationHighlight) => {
  const value = [
    'concat',
    ';',
    ['coalesce', ['get', routeRelationsKey], ''],
    ';',
  ] satisfies ExpressionSpecification
  const needles =
    'relationId' in highlight
      ? [':', ','].flatMap((before) =>
          [',', ';'].map((after) => `${before}${highlight.relationId}${after}`),
        )
      : [`;${highlight.group}:${highlight.value};`]
  return [
    'any',
    ...needles.map((needle) => ['in', needle, value] satisfies ExpressionSpecification),
  ] satisfies ExpressionSpecification
}

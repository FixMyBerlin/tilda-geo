import { useEffect } from 'react'
import { twJoin } from 'tailwind-merge'
import {
  pseudoRouteRelationTypes,
  routeRelationTypes,
} from '@/data/processingTypes/routeRelationTypes.const'
import {
  type RouteRelationHighlight,
  routeRelationsKey,
  routeRelationTitle,
} from '../../../routeRelations/routeRelations'
import { useRouteRelationHighlightActions } from '../../../routeRelations/useRouteRelationHighlight'
import { useRouteRelations } from '../../../routeRelations/useRouteRelations'
import {
  tagsTableLabelCellClass,
  tagsTableLabelContentClass,
  tagsTableRowClass,
  tagsTableValueCellClass,
} from '../tagsTableLayout'
import { ConditionalFormattedKey } from '../translations/ConditionalFormattedKey'
import type { CompositTableRow } from './types'

export const tableKeyRouteRelations = 'composit_route_relations'

/**
 * Route relations (`route_relations`) the way belongs to, grouped by route type, followed by
 * pseudo relations (network classes from external data). Hovering an entry highlights all lines
 * of that route or class on the visible way layers.
 */
export const TagsTableRowCompositRouteRelations = ({ sourceId, properties }: CompositTableRow) => {
  const { routes, pseudo } = useRouteRelations(properties[routeRelationsKey])
  const { setHovered } = useRouteRelationHighlightActions()

  // The row unmounts when another feature is inspected while a route is still hovered.
  useEffect(
    function clearHoveredRouteOnUnmount() {
      return () => setHovered(null)
    },
    [setHovered],
  )

  if (routes.length === 0 && pseudo.length === 0) return null

  const hoverProps = (highlight: RouteRelationHighlight) => ({
    className: 'cursor-help hover:text-gray-900',
    title: 'Zeigt alle Wege auf der Karte',
    onMouseEnter: () => setHovered(highlight),
    onMouseLeave: () => setHovered(null),
  })

  return (
    <tr className={tagsTableRowClass}>
      <td className={twJoin(tagsTableLabelCellClass, 'text-gray-900')}>
        <span className={tagsTableLabelContentClass}>
          <ConditionalFormattedKey sourceId={sourceId} tagKey={routeRelationsKey} />
        </span>
      </td>
      <td className={twJoin(tagsTableValueCellClass, 'text-gray-500')}>
        <dl className="space-y-1.5">
          {routes.map(({ route, relations }) => (
            <div key={route}>
              <dt className="text-xs text-gray-400">{routeRelationTypes[route].label}</dt>
              <dd>
                <ul className="space-y-0.5">
                  {relations.map(({ relationId, detail }) => (
                    <li key={relationId} {...hoverProps({ relationId })}>
                      {routeRelationTitle(relationId, detail)}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
          {pseudo.map(({ group, value }) => (
            <div key={group}>
              <dt className="text-xs text-gray-400">{pseudoRouteRelationTypes[group].label}</dt>
              <dd {...hoverProps({ group, value })}>{value}</dd>
            </div>
          ))}
        </dl>
      </td>
    </tr>
  )
}

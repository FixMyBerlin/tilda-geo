import { TagsTableRow } from '../TagsTableRow'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import type { CompositTableRow } from './types'

export const tableKeyLit = 'composit_lit'
export const TagsTableRowCompositLit = ({ sourceId, tagKey, properties }: CompositTableRow) => {
  if (!properties.lit) return null

  return (
    <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
      <ValueDisclosure>
        <ValueDisclosureButton>
          <ConditionalFormattedValue sourceId={sourceId} tagKey={'lit'} tagValue={properties.lit} />
        </ValueDisclosureButton>
        <ValueDisclosurePanel>
          {properties.osm_lit && properties.osm_lit !== 'yes' && properties.osm_lit !== 'no' && (
            <p className="mt-1 leading-tight">
              <em>Detaillierte Angaben direkt aus OSM:</em>{' '}
              <ConditionalFormattedValue
                sourceId={sourceId}
                tagKey={'osm_lit'}
                tagValue={properties.osm_lit}
              />
            </p>
          )}
          {/* <p className="mt-1 leading-tight">
            <em>Aktualität:</em>{' '}
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={'fresh'}
              tagValue={properties['lit_fresh']}
            />
          </p> */}
        </ValueDisclosurePanel>
      </ValueDisclosure>
    </TagsTableRow>
  )
}

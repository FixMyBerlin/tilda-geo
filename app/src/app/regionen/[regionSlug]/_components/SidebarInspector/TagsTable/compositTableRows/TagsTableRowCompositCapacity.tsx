import { TagsTableRow } from '../TagsTableRow'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { CompositTableRow } from './types'

export const tableKeyCapacity = 'composit_capacity'
export const TagsTableRowCompositCapacity = ({
  sourceId,
  tagKey,
  properties,
}: CompositTableRow) => {
  if (!properties['capacity']) return null

  return (
    <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={'capacity'}>
      <ValueDisclosure>
        <ValueDisclosureButton>
          <ConditionalFormattedValue
            sourceId={sourceId}
            tagKey={'capacity'}
            tagValue={properties['capacity']}
          />
        </ValueDisclosureButton>
        <ValueDisclosurePanel>
          <p>
            <em>Quelle:</em>{' '}
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={'capacity_source'}
              tagValue={properties['capacity_source']}
            />
          </p>
          <p>
            <em>Genauigkeit der Quelle:</em>{' '}
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={'confidence'}
              tagValue={properties['capacity_confidence']}
            />
          </p>
        </ValueDisclosurePanel>
      </ValueDisclosure>
    </TagsTableRow>
  )
}

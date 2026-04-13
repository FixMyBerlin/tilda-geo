import { TagsTableRow } from '../TagsTableRow'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import type { CompositTableRow } from './types'

export const tableKeyMaxspeed = 'composit_maxspeed'
export const TagsTableRowCompositMaxspeed = ({
  sourceId,
  tagKey,
  properties,
}: CompositTableRow) => {
  if (!properties.maxspeed) return null

  return (
    <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
      <ValueDisclosure>
        <ValueDisclosureButton>
          <ConditionalFormattedValue
            sourceId={sourceId}
            tagKey={'maxspeed'}
            tagValue={properties.maxspeed}
          />
        </ValueDisclosureButton>
        <ValueDisclosurePanel>
          <p>
            <em>Quelle:</em>{' '}
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={'maxspeed_source'}
              tagValue={properties.maxspeed_source}
            />
          </p>
          <p>
            <em>Genauigkeit der Quelle:</em>{' '}
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={'confidence'}
              tagValue={properties.maxspeed_confidence}
            />
          </p>
          {/* <p>
            <em>Aktualität:</em>{' '}
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={'fresh'}
              tagValue={properties['maxspeed_fresh']}
            />
          </p> */}
        </ValueDisclosurePanel>
      </ValueDisclosure>

      {(properties['maxspeed:backward'] ||
        properties['maxspeed:forward'] ||
        properties['maxspeed:conditional']) && (
        <ValueDisclosure>
          <ValueDisclosureButton>Weitere Angaben aus OpenStreetMap</ValueDisclosureButton>
          <ValueDisclosurePanel>
            {properties['maxspeed:backward'] && (
              <p>
                <em>Höchstgeschwindigkeit entgegend der OSM Linienrichtung:</em>{' '}
                <ConditionalFormattedValue
                  sourceId={sourceId}
                  tagKey={'maxspeed:backward'}
                  tagValue={properties['maxspeed:backward']}
                />
              </p>
            )}
            {properties['maxspeed:forward'] && (
              <p>
                <em>Höchstgeschwindigkeit in OSM Linienrichtung:</em>{' '}
                <ConditionalFormattedValue
                  sourceId={sourceId}
                  tagKey={'maxspeed:forward'}
                  tagValue={properties['maxspeed:forward']}
                />
              </p>
            )}
            {properties['maxspeed:conditional'] && (
              <p>
                <em>Konditionale Angaben:</em>{' '}
                <ConditionalFormattedValue
                  sourceId={sourceId}
                  tagKey={'maxspeed:conditional'}
                  tagValue={properties['maxspeed:conditional']}
                />
              </p>
            )}
          </ValueDisclosurePanel>
        </ValueDisclosure>
      )}
    </TagsTableRow>
  )
}

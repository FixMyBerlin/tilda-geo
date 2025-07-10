import dompurify from 'dompurify'
import { TagsTableRow } from '../TagsTableRow'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { translations } from '../translations/translations.const'
import { NodataFallback } from './NodataFallback'
import { CompositTableRow } from './types'

export const tableKeyWidth = 'composit_width'
export const TagsTableRowCompositWidth = ({ sourceId, tagKey, properties }: CompositTableRow) => {
  if (!properties['width']) {
    return (
      <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
        <NodataFallback />
      </TagsTableRow>
    )
  }

  const secureWidthSource = dompurify.sanitize(properties['width_source'])
  const sourceHasTranslation = Object.keys(translations).some((k) =>
    k.includes(`width_source=${secureWidthSource}`),
  )

  return (
    <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
      <ValueDisclosure>
        <ValueDisclosureButton>
          <ConditionalFormattedValue
            sourceId={sourceId}
            tagKey={'width'}
            tagValue={properties['width']}
          />
        </ValueDisclosureButton>
        <ValueDisclosurePanel>
          <p>
            <em>Quelle:</em>{' '}
            {sourceHasTranslation ? (
              <ConditionalFormattedValue
                sourceId={sourceId}
                tagKey={'width_source'}
                tagValue={secureWidthSource}
              />
            ) : (
              <code>{secureWidthSource}</code>
            )}
          </p>
          {/* <p>
            <em>Genauigkeit der Quelle:</em>{' '}
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={'confidence'}
              tagValue={properties['width_confidence']}
            />
          </p> */}
        </ValueDisclosurePanel>
      </ValueDisclosure>
    </TagsTableRow>
  )
}

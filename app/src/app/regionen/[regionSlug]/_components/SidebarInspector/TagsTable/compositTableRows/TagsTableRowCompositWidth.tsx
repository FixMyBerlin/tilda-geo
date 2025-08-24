import dompurify from 'dompurify'
import { TagsTableRow } from '../TagsTableRow'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { translations } from '../translations/translations.const'
import { NodataFallback } from './NodataFallback'
import { CompositTableRow } from './types'

export const tableKeyWidths = ['composit_width', 'composit_road_width']

export const TagsTableRowCompositWidth = ({ sourceId, tagKey, properties }: CompositTableRow) => {
  const widthKey = tagKey.replace('composit_', '')
  const width = widthKey
  const widthSource = `${widthKey}_source`
  const widthConfidence = `${widthKey}_confidence`

  if (!width) {
    return (
      <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
        <NodataFallback />
      </TagsTableRow>
    )
  }

  const secureWidthSource = dompurify.sanitize(properties[widthSource])
  const sourceHasTranslation = Object.keys(translations).some((k) =>
    k.includes(`${widthSource}=${secureWidthSource}`),
  )

  return (
    <TagsTableRow key={widthKey} sourceId={sourceId} tagKey={widthKey}>
      <ValueDisclosure>
        <ValueDisclosureButton>
          <ConditionalFormattedValue
            sourceId={sourceId}
            tagKey={width}
            tagValue={properties[width]}
          />
        </ValueDisclosureButton>
        <ValueDisclosurePanel>
          <p>
            <em>Quelle:</em>{' '}
            {sourceHasTranslation ? (
              <ConditionalFormattedValue
                sourceId={sourceId}
                tagKey={widthSource}
                tagValue={secureWidthSource}
              />
            ) : (
              <code>{secureWidthSource}</code>
            )}
          </p>
          {properties[widthConfidence] && (
            <p>
              <em>Genauigkeit der Quelle:</em>{' '}
              <ConditionalFormattedValue
                sourceId={sourceId}
                tagKey={widthConfidence}
                tagValue={properties[widthConfidence]}
              />
            </p>
          )}
        </ValueDisclosurePanel>
      </ValueDisclosure>
    </TagsTableRow>
  )
}

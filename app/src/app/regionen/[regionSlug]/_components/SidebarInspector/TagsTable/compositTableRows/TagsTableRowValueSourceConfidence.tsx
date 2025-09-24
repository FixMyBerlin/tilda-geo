import { isDev } from '@/src/app/_components/utils/isEnv'
import { TagsTableRow } from '../TagsTableRow'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { CompositTableRow } from './types'

export const TagsTableRowValueSourceConfidence = ({
  sourceId,
  tagKey,
  properties,
}: CompositTableRow) => {
  if (!properties[tagKey]) return null

  return (
    <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
      <ValueDisclosure>
        <ValueDisclosureButton>
          <span title={isDev ? `${sourceId}--${tagKey}=${properties[tagKey]}` : undefined}>
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={tagKey}
              tagValue={properties[tagKey]}
            />
          </span>
        </ValueDisclosureButton>
        <ValueDisclosurePanel>
          <p title={isDev ? `${sourceId}--${tagKey}=${properties[`${tagKey}_source`]}` : undefined}>
            <em>Quelle:</em>{' '}
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={`${tagKey}_source`}
              tagValue={properties[`${tagKey}_source`]}
            />
          </p>
          <p
            title={
              isDev ? `${sourceId}--${tagKey}=${properties[`${tagKey}_confidence`]}` : undefined
            }
          >
            <em>Genauigkeit der Quelle:</em>{' '}
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={`${tagKey}_confidence`}
              tagValue={properties[`${tagKey}_confidence`]}
            />
          </p>
        </ValueDisclosurePanel>
      </ValueDisclosure>
    </TagsTableRow>
  )
}

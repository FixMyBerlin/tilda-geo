import { isDev } from '@/components/shared/utils/isEnv'
import { TagsTableRow } from '../TagsTableRow'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import { NodataFallbackWrapper } from './NodataFallbackWrapper'
import type { CompositTableRow } from './types'

export const tableKeySurfaceSmoothness = 'composit_surface_smoothness'
export const TagsTableRowCompositSurfaceSmoothness = ({
  sourceId,
  tagKey,
  properties,
}: CompositTableRow) => {
  if (!(properties.smoothness || properties.surface)) return null

  return (
    <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
      <table className="w-full leading-4">
        <tbody>
          <tr>
            <th className="py-1 pr-2 text-left font-medium">Belag</th>
            <td className="w-full py-1">
              <NodataFallbackWrapper fallback={!properties.surface}>
                <ValueDisclosure>
                  <ValueDisclosureButton>
                    <span title={isDev ? `${sourceId}--surface=${properties.surface}` : undefined}>
                      <ConditionalFormattedValue
                        sourceId={sourceId}
                        tagKey={'surface'}
                        tagValue={properties.surface}
                      />
                    </span>
                  </ValueDisclosureButton>
                  <ValueDisclosurePanel>
                    <p
                      title={
                        isDev
                          ? `${sourceId}--surface_source=${properties.surface_source}`
                          : undefined
                      }
                    >
                      <em>Quelle:</em>{' '}
                      <ConditionalFormattedValue
                        sourceId={sourceId}
                        tagKey={'surface_source'}
                        tagValue={properties.surface_source}
                      />
                    </p>
                    <p
                      title={
                        isDev
                          ? `${sourceId}--surface_confidence=${properties.surface_confidence}`
                          : undefined
                      }
                    >
                      <em>Genauigkeit der Quelle:</em>{' '}
                      <NodataFallbackWrapper fallback={!properties.surface_confidence}>
                        Hoch
                      </NodataFallbackWrapper>
                    </p>
                  </ValueDisclosurePanel>
                </ValueDisclosure>
              </NodataFallbackWrapper>
            </td>
          </tr>
          <tr className="border-t">
            <th className="py-1 pr-2 text-left font-medium">Zustand</th>
            <td className="w-full py-1">
              <NodataFallbackWrapper fallback={!properties.smoothness}>
                <ValueDisclosure>
                  <ValueDisclosureButton>
                    <span
                      title={isDev ? `${sourceId}--smoothness=${properties.smoothness}` : undefined}
                    >
                      <ConditionalFormattedValue
                        sourceId={sourceId}
                        tagKey={'smoothness'}
                        tagValue={properties.smoothness}
                      />
                    </span>
                  </ValueDisclosureButton>
                  <ValueDisclosurePanel>
                    <p
                      title={
                        isDev
                          ? `${sourceId}--smoothness_source=${properties.smoothness_source}`
                          : undefined
                      }
                    >
                      <em>Quelle:</em>{' '}
                      <ConditionalFormattedValue
                        sourceId={sourceId}
                        tagKey={'smoothness_source'}
                        tagValue={properties.smoothness_source}
                      />
                    </p>
                    <p
                      title={
                        isDev
                          ? `${sourceId}--smoothness_confidence=${properties.smoothness_confidence}`
                          : undefined
                      }
                    >
                      <em>Genauigkeit der Quelle:</em>{' '}
                      <ConditionalFormattedValue
                        sourceId={sourceId}
                        tagKey={'confidence'}
                        tagValue={properties.smoothness_confidence}
                      />
                    </p>
                  </ValueDisclosurePanel>
                </ValueDisclosure>
              </NodataFallbackWrapper>
            </td>
          </tr>
        </tbody>
      </table>
    </TagsTableRow>
  )
}

import { isDev } from '@/components/shared/utils/isEnv'
import {
  tagsTableCompositSubLabelCellClass,
  tagsTableCompositSubRowHeaderClass,
  tagsTableCompositSubValueCellClass,
  tagsTableCompositTableClass,
} from '../tagsTableLayout'
import { TagsTableRowFrame } from '../TagsTableRow'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { renderTranslationHtml } from '../translations/renderTranslationHtml'
import { TRANSLATION_BREAK_MARKER } from '../translations/translationBreakMarker'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import { NodataFallbackWrapper } from './NodataFallbackWrapper'
import type { CompositTableRow } from './types'

export const tableKeySurfaceSmoothness = 'composit_surface_smoothness'
export const TagsTableRowCompositSurfaceSmoothness = ({
  sourceId,
  properties,
}: CompositTableRow) => {
  if (!(properties.smoothness || properties.surface)) return null

  return (
    <TagsTableRowFrame
      label={renderTranslationHtml(
        `Ober${TRANSLATION_BREAK_MARKER}flächen${TRANSLATION_BREAK_MARKER}qualität`,
      )}
    >
      <table className={tagsTableCompositTableClass}>
        <tbody>
          <tr>
            <td colSpan={2} className="py-1">
              <NodataFallbackWrapper fallback={!properties.surface}>
                <ValueDisclosure>
                  <div className={tagsTableCompositSubRowHeaderClass}>
                    <div className={tagsTableCompositSubLabelCellClass}>Belag</div>
                    <div className={tagsTableCompositSubValueCellClass}>
                      <ValueDisclosureButton>
                        <span
                          title={isDev ? `${sourceId}--surface=${properties.surface}` : undefined}
                        >
                          <ConditionalFormattedValue
                            sourceId={sourceId}
                            tagKey={'surface'}
                            tagValue={properties.surface}
                          />
                        </span>
                      </ValueDisclosureButton>
                    </div>
                  </div>
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
            <td colSpan={2} className="py-1">
              <NodataFallbackWrapper fallback={!properties.smoothness}>
                <ValueDisclosure>
                  <div className={tagsTableCompositSubRowHeaderClass}>
                    <div className={tagsTableCompositSubLabelCellClass}>Fahrqualität</div>
                    <div className={tagsTableCompositSubValueCellClass}>
                      <ValueDisclosureButton>
                        <span
                          title={
                            isDev ? `${sourceId}--smoothness=${properties.smoothness}` : undefined
                          }
                        >
                          <ConditionalFormattedValue
                            sourceId={sourceId}
                            tagKey={'smoothness'}
                            tagValue={properties.smoothness}
                          />
                        </span>
                      </ValueDisclosureButton>
                    </div>
                  </div>
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
                        tagKey={'smoothness_confidence'}
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
    </TagsTableRowFrame>
  )
}

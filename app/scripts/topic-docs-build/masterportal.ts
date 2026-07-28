import {
  getTopicDocNumericFormatSuffix,
  topicDocNumericFormatSet,
  type TopicDocNumericFormat,
} from '../../src/data/topicDocs/schema'
import { mapillaryPKeyUrlGfiHrefTemplate } from '../../src/lib/mapillaryPKeyUrl'
import type { CompiledAttribute, CompiledValue } from './types'

const isMapillaryAttributeKey = (key: string) => key === 'mapillary' || key.startsWith('mapillary_')

/** Maps raw feature values to GFI display strings (Masterportal `gfiAttributes` object `format`). */
const collectGfiValueFormat = (values: Array<CompiledValue>, acc: Record<string, string>) => {
  for (const node of values) {
    acc[node.value] = node.label
  }
}

type MasterportalGfiAttributeValue =
  | string
  | {
      name: string
      type: 'number'
      format?: string
      prefix?: string
      suffix?: string
    }
  | {
      name: string
      type: 'html'
      html: {
        tag: string
        innerHTML: string
        properties?: Record<string, string>
      }
    }
  | {
      name: string
      condition: 'contains'
      type: 'string'
      format: Record<string, string>
    }

export type MasterportalTableOutput = {
  gfiAttributes: Record<string, MasterportalGfiAttributeValue>
}

export const buildMasterportalMap = (
  compiledAttributes: Array<CompiledAttribute>,
): MasterportalTableOutput => {
  const isNumericTopicDocFormat = (
    format: CompiledAttribute['type'],
  ): format is TopicDocNumericFormat => {
    return topicDocNumericFormatSet.has(format)
  }
  const gfiAttributes: Record<string, MasterportalGfiAttributeValue> = {}

  for (const attribute of compiledAttributes) {
    if (attribute.type === 'ignore') {
      continue
    }

    if (isMapillaryAttributeKey(attribute.key)) {
      gfiAttributes[attribute.key] = {
        name: attribute.label,
        type: 'html',
        html: {
          tag: 'a',
          innerHTML: 'Mapillary',
          properties: {
            href: mapillaryPKeyUrlGfiHrefTemplate,
            target: '_blank',
          },
        },
      }
      continue
    }

    if (isNumericTopicDocFormat(attribute.type)) {
      const suffix = getTopicDocNumericFormatSuffix(attribute.type)
      gfiAttributes[attribute.key] = {
        name: attribute.label,
        type: 'number',
        ...(suffix ? { suffix } : {}),
      }
      continue
    }

    if (attribute.values?.length) {
      const format: Record<string, string> = {}
      collectGfiValueFormat(attribute.values, format)
      if (Object.keys(format).length > 0) {
        gfiAttributes[attribute.key] = {
          name: attribute.label,
          condition: 'contains',
          type: 'string',
          format,
        }
        continue
      }
    }

    if (attribute.type === 'sanitized_strings') {
      gfiAttributes[attribute.key] = attribute.label
      continue
    }

    gfiAttributes[attribute.key] = attribute.label
  }

  return { gfiAttributes }
}

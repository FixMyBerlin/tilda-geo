import { mapillaryPKeyUrlGfiHrefTemplate } from '../../src/lib/mapillaryPKeyUrl'
import type { CompiledAttribute, CompiledValue } from './types'

const isMapillaryAttributeKey = (key: string) => key === 'mapillary' || key.startsWith('mapillary_')

/** Maps raw feature values to GFI display strings (Masterportal `gfiAttributes` object `format`). */
const collectGfiValueFormat = (values: Array<CompiledValue>, acc: Record<string, string>) => {
  for (const node of values) {
    acc[node.value] = node.label
    if (node.children?.length) {
      collectGfiValueFormat(node.children, acc)
    }
  }
}

export type MasterportalGfiAttributeValue =
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

    if (attribute.type === 'number') {
      gfiAttributes[attribute.key] = {
        name: attribute.label,
        type: 'number',
      }
      continue
    }

    if (attribute.type === 'sanitized_strings') {
      gfiAttributes[attribute.key] = attribute.label
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

    gfiAttributes[attribute.key] = attribute.label
  }

  return { gfiAttributes }
}

import { getTopicDocFormatsForTagKey, isNumericTopicDocFormat } from '@/data/topicDocs/runtime'

export type ExportAttributeType = 'string' | 'number'

export const getExportAttributeType = (key: string): ExportAttributeType => {
  const knownFormats = getTopicDocFormatsForTagKey(key)
  if (!knownFormats || knownFormats.size === 0) return 'string'

  return [...knownFormats].every(isNumericTopicDocFormat) ? 'number' : 'string'
}

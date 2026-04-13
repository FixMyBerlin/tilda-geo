import { numberConfigs } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/_utils/numberConfig'

export type ExportAttributeType = 'string' | 'number'

export const getExportAttributeType = (key: string): ExportAttributeType => {
  const numberKeywordsEquals = numberConfigs.map(({ key: numberKey }) => numberKey)
  const numberKeywordsIncludes: Array<string> = []

  const shouldCastToNumber = key.startsWith('osm_')
    ? false
    : numberKeywordsEquals.some((keyword) => key === keyword) ||
      numberKeywordsIncludes.some((keyword) => key.includes(keyword))

  return shouldCastToNumber ? 'number' : 'string'
}

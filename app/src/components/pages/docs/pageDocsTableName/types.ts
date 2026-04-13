import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import type { StaticRegion } from '@/data/regions.const'
import type {
  TopicDocGfiAttributeObject,
  TopicDocGfiAttributeValue,
  TopicDocGfiHtmlConfig,
  TopicDocMasterportalGfiConfig,
} from '@/data/topicDocs/masterportalGfi.types'
import type { TopicDocCompiled } from '@/data/topicDocs/runtime'

export type DocsPageRegion = (StaticRegion & { slug: string }) | null

export type DocsPageGroupDoc = {
  tableName: string
  topicDoc: TopicDocCompiled | null
}

export type DocsPageTopicDoc = TopicDocCompiled | null

export type DocsPageGfiHtmlConfig = TopicDocGfiHtmlConfig
export type DocsPageGfiAttributeObject = TopicDocGfiAttributeObject
export type DocsPageGfiAttributeValue = TopicDocGfiAttributeValue

export type DocsPageMasterportal = TopicDocMasterportalGfiConfig | null

export type DocsPageSummaryProps = {
  tableName: SourceExportApiIdentifier
  region: DocsPageRegion
  groupDocs: Array<DocsPageGroupDoc>
  regionSlug: string | null
}

export type DocsPageAttributesProps = {
  topicDoc: DocsPageTopicDoc
  tableName: SourceExportApiIdentifier
  regionSlug: string | null
}

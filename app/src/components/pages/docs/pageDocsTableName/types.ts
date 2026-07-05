import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import type { TopicDocMasterportalGfiConfig } from '@/data/topicDocs/masterportalGfi.types'
import type { TopicDocCompiled } from '@/data/topicDocs/runtime'
import type { TRegion } from '@/server/regions/queries/getRegion.server'

export type DocsPageRegion = TRegion | null

type DocsPageGroupDoc = {
  tableName: string
  topicDoc: TopicDocCompiled | null
}

export type DocsPageTopicDoc = TopicDocCompiled | null

export type DocsPageMasterportal = TopicDocMasterportalGfiConfig | null

export type DocsPageSummaryProps = {
  tableName: SourceExportApiIdentifier
  groupDocs: Array<DocsPageGroupDoc>
  regionSlug: string | null
}

export type DocsPageAttributesProps = {
  topicDoc: DocsPageTopicDoc
  tableName: SourceExportApiIdentifier
  regionSlug: string | null
}

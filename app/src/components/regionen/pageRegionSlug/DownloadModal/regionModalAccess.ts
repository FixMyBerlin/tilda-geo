import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { exportConfigs } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import {
  deriveRegionDatasetsFromCategories,
  type RegionForDatasetDerivation,
} from '@/components/regionen/pageRegionSlug/regionDatasets/deriveRegionDatasetsFromCategories'
import { getTopicDocByTableName } from '@/data/topicDocs/runtime'

export type RegionModalDataset = {
  tableName: SourceExportApiIdentifier
  label: string
  title: string
  desc: string
  attributionHtml: string
  licence: string | undefined
  hasStructuredDocs: boolean
  isDownloadable: boolean
}

const exportConfigByTableName = new Map(exportConfigs.map((config) => [config.id, config]))

const enrichDataset = (
  dataset: ReturnType<typeof deriveRegionDatasetsFromCategories>[number],
): RegionModalDataset => {
  const exportConfig = exportConfigByTableName.get(dataset.tableName)

  return {
    tableName: dataset.tableName,
    label: dataset.label,
    title: exportConfig?.title ?? dataset.label,
    desc: exportConfig?.desc ?? '',
    attributionHtml: exportConfig?.attributionHtml ?? '',
    licence: exportConfig?.licence,
    hasStructuredDocs: getTopicDocByTableName(dataset.tableName) != null,
    isDownloadable: dataset.isDownloadable,
  }
}

export const getRegionModalDatasets = (region: RegionForDatasetDerivation) => {
  const derived = deriveRegionDatasetsFromCategories(region).map(enrichDataset)
  const downloadable = derived.filter((dataset) => dataset.isDownloadable)
  const other = derived.filter((dataset) => !dataset.isDownloadable)

  return {
    downloadable,
    other,
    all: derived,
  }
}

export type RegionModalAccess = ReturnType<typeof getRegionModalAccess>

// Visibility rules for download vs documentation modals — kept in sync via unit tests.
export const getRegionModalAccess = (
  region: RegionForDatasetDerivation,
  hasPermissions: boolean,
) => {
  const { downloadable, other, all } = getRegionModalDatasets(region)

  const showDownloadableSectionInDownloadModal =
    hasPermissions && region.exports != null && downloadable.length > 0

  const showOtherDatasetsSectionInDownloadModal =
    showDownloadableSectionInDownloadModal && other.length > 0

  const docsLinksVisibleInDownloadModal =
    showDownloadableSectionInDownloadModal || showOtherDatasetsSectionInDownloadModal

  // Docs button only when the download modal cannot list dataset doc links (login promo,
  // export not set up, or permitted but no downloadable section to anchor "Weitere Datensätze").
  const showDocumentationButton = !docsLinksVisibleInDownloadModal && all.length > 0

  return {
    showDownloadableSectionInDownloadModal,
    showOtherDatasetsSectionInDownloadModal,
    showDocumentationButton,
    docsLinksVisibleInDownloadModal,
    downloadable,
    other,
    all,
  }
}

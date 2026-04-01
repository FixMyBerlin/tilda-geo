import type { SourceExportApiIdentifier } from '../export/exportIdentifier'
import { exportConfigsTilda } from './exportConfigsTilda.const'
import { exportConfigssTildaParking } from './exportsTildaParking.const'

export type MapDataExportConfig = {
  id: SourceExportApiIdentifier
  title: string
  desc: string
  attributionHtml: string
  licence: 'ODbL' | undefined
}

export const exportConfigs: MapDataExportConfig[] = [
  ...exportConfigssTildaParking,
  ...exportConfigsTilda,
]

export type ExportId = (typeof exportConfigs)[number]['id']

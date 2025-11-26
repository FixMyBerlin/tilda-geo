import { SourceExportApiIdentifier } from '../export/exportIdentifier'
import { exportsTilda } from './exportsTilda.const'
import { exportsTildaParking } from './exportsTildaParking.const'

export type MapDataExport = {
  id: SourceExportApiIdentifier
  title: string
  desc: string
  attributionHtml: string
  licence: 'ODbL' | undefined
}

export const exports: MapDataExport[] = [...exportsTildaParking, ...exportsTilda]

export type ExportId = (typeof exports)[number]['id']

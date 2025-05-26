import { $, sql } from 'bun'
import { OSM_DOWNLOAD_DIR, OSM_FILTERED_DIR, PERSISTENT_DIR } from '../constants/directories.const'
import { initializeCustomFunctionsDataTables, initializeSchemaData } from '../dataTables/dataTables'
import { initializeCustomFunctionDiffing, initializeSchemaBackup } from '../diffing/diffing'
import { downloadPseudoTagsData } from '../pseudoTags/downloadPseudoTagsData'
import { initializeLuaPackagePath } from '../utils/initializeLuaPackagePath'
import { initializeMetadataTable } from './metadata'

/** Initialize Folder, Schema, Custom SQL Functions, Tables */
export async function initialize() {
  await $`mkdir -p ${OSM_DOWNLOAD_DIR} ${OSM_FILTERED_DIR} ${PERSISTENT_DIR}`

  await sql`CREATE EXTENSION IF NOT EXISTS postgis`
  await sql`CREATE EXTENSION IF NOT EXISTS pgRouting`

  // See ./diffing
  await initializeSchemaBackup()
  await initializeCustomFunctionDiffing()

  // See ../dataTables
  await initializeSchemaData()
  await initializeCustomFunctionsDataTables()

  // Meta Data
  await initializeMetadataTable()

  // osm2pgsql LUA
  await initializeLuaPackagePath('runProcessing')

  // See ../pseudoTags
  await downloadPseudoTagsData()

  return true
}

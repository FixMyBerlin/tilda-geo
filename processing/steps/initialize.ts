import { $, sql } from 'bun'
import { HASH_DIR, OSM_DOWNLOAD_DIR, OSM_FILTERED_DIR } from '../constants/directories.const'
import { initializeCustomFunctionsDataTables, initializeSchemaData } from '../dataTables/dataTables'
import {
  initializeCustomFunctionDiffing,
  initializeDiffingReferenceSchema,
} from '../diffing/diffing'
import { downloadPseudoTagsData } from '../pseudoTags/downloadPseudoTagsData'
import { initializeLuaPackagePath } from '../utils/initializeLuaPackagePath'
import { isDev } from '../utils/isDev'
import { logPadded } from '../utils/logging'
import { params } from '../utils/parameters'
import { initializeMetadataTable } from './metadata'

/** Initialize Folder, Schema, Custom SQL Functions, Tables */
export async function initialize() {
  logPadded('Processing: Initialize')
  if (isDev) {
    console.log('Current params:', JSON.stringify(params))
  }

  await $`mkdir -p ${OSM_DOWNLOAD_DIR} ${OSM_FILTERED_DIR} ${HASH_DIR}`

  await sql`CREATE EXTENSION IF NOT EXISTS postgis`
  await sql`CREATE EXTENSION IF NOT EXISTS pgRouting`
  await sql`CREATE EXTENSION IF NOT EXISTS btree_gist`

  // Check lua packages:
  if (isDev) {
    console.log('[DEV] Initialize: Installed Lua Packages:')
    await $`luarocks list`
  }

  // See ./diffing
  await initializeDiffingReferenceSchema()
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

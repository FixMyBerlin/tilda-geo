import { $, sql } from 'bun'
import { HASH_DIR, OSM_DOWNLOAD_DIR, OSM_FILTERED_DIR } from '../constants/directories.const'
import { initializeCustomFunctionsDataTables, initializeSchemaData } from '../dataTables/dataTables'
import {
  initializeCustomFunctionDiffing,
  initializeDiffingReferenceSchema,
} from '../diffing/diffing'
import { downloadPseudoTagsData } from '../pseudoTags/downloadPseudoTagsData'
import { logPadded } from '../utils/logging'
import { initializeAggregatedLengthsTable } from './afterthoughts/initializeAggregatedLengths'
import { initializeMetadataTable } from './metadata'

const DEBUG_LUA = false

/** Initialize Folder, Schema, Custom SQL Functions, Tables */
export async function initialize() {
  logPadded('Processing: Initialize')

  await $`mkdir -p ${OSM_DOWNLOAD_DIR} ${OSM_FILTERED_DIR} ${HASH_DIR}`

  await sql`CREATE EXTENSION IF NOT EXISTS postgis`
  await sql`CREATE EXTENSION IF NOT EXISTS btree_gist`

  // Check lua packages:
  if (DEBUG_LUA) {
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
  await initializeAggregatedLengthsTable()

  // See ../pseudoTags
  await downloadPseudoTagsData()

  return true
}

import { $, sql } from 'bun'
import { berlinTimeString } from '../utils/berlinTime'
import { filteredFilePath } from './filter'

/**
 * Create the metadata table in the database. If already exists, does nothing.
 * @returns the Promise of the query
 */
export async function initializeMetadataTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS public.meta (
      id SERIAL PRIMARY KEY,
      processed_at TIMESTAMP,
      processing_duration TIME,
      osm_data_from TIMESTAMP
    )`
  return true
}

/**
 * Get the timestamp from the given OSM file. Uses osmium fileinfo to get the timestamp.
 * @param fileName the file name to take the timestamp from
 * @returns the time stamp as a string
 */
export async function getFileTimestamp(fileName: string) {
  try {
    const timestamp =
      await $`osmium fileinfo ${filteredFilePath(fileName)} -g header.option.timestamp`.text()
    return timestamp.trim()
  } catch (error) {
    throw new Error(`Failed to get timestamp from file "${fileName}": ${error}`)
  }
}

/**
 * Write the runs metadata to the database.
 * @param fileName the file that was used in this run
 * @param processingDurationMS the time the processing took in milliseconds
 * @returns the Promise of the query
 */
export async function writeMetadata(fileName: string, processingDurationMS: number) {
  const processingDuration = new Date(processingDurationMS).toISOString().slice(11, 19) // Extract HH:MM:SS from the ISO string

  const data = {
    processed_at: new Date(),
    processing_duration: processingDuration,
    osm_data_from: new Date(await getFileTimestamp(fileName)),
  }

  console.log(
    'Processing:',
    'Writing meta data',
    JSON.stringify({ ...data, osm_data_from_localtime: berlinTimeString(data.osm_data_from) }),
  )
  return sql`INSERT INTO public.meta ${sql(data)}`
}

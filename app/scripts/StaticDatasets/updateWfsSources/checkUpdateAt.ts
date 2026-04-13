import type { MetaData } from '../types'
import { import_ } from '../utils/import_'
import { green, red, yellow } from '../utils/log'

const getMetadatUrl = async (url: string) => {
  const fetchUrl = `${url}?REQUEST=GetCapabilities&SERVICE=wfs`
  const response = await fetch(fetchUrl)
  if (!response.ok) {
    throw new Error(`  Failed to fetch WFS capabilities: ${response.statusText}`)
  }

  const xml = await response.text()
  const regex = /<MetadataURL[^>]*xlink:href="([^"]+)"/
  const match = xml.match(regex)

  if (!match?.[1]) {
    yellow('  Metadata URL not found', url)
    return undefined
  }
  const cleanUrl = match[1].replace(/&amp;/g, '&')
  green('  Metadata URL found', cleanUrl)
  return cleanUrl
}

const getDate = async (url: string | undefined) => {
  if (!url) return undefined

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch WFS capabilities: ${response.statusText}`)
  }

  const xml = await response.text()
  // const regex = /<gco:Date[^>]*>([^<]+)<\/gco:Date>/g
  const regex =
    /<gmd:date>\s*<gmd:CI_Date>\s*<gmd:date>\s*<gco:Date[^>]*>([^<]+)<\/gco:Date>\s*<\/gmd:date>\s*<gmd:dateType>\s*<gmd:CI_DateTypeCode[^>]*codeListValue="revision"[^>]*>\s*<\/gmd:dateType>\s*<\/gmd:CI_Date>\s*<\/gmd:date>/g
  const matches = Array.from(xml.matchAll(regex))

  const lastMatch = matches?.at(-1)
  const date = lastMatch?.[1]
  if (!date) {
    yellow('  No Date found on', url)
    return undefined
  }
  if (matches?.length > 1) {
    red(
      '  Multiple dates found, we need to pick the one with `codeListValue="revision"`',
      matches.map((m) => m[1]),
      url,
    )
  }
  green('  Date found', date)
  return date
}

export const checkUpdatedAt = async (wfsUrl: string, datasetFolderPath: string) => {
  console.log('  Trying to get update date')

  try {
    const metadataUrl = await getMetadatUrl(wfsUrl)
    const date = await getDate(metadataUrl)

    if (date) {
      const meta = await import_<MetaData>(datasetFolderPath, 'meta', 'data')
      const metaDates = meta?.configs.map((c) => c.updatedAt)
      const outdatedDates = metaDates?.filter((d) => d !== date)
      if (outdatedDates?.length) {
        red('  Some `meta.ts` have outdated `config.updatedAt`', outdatedDates)
      } else {
        green('  meta.ts `updatedAt` are all correct', metaDates)
      }
    }
  } catch (error) {
    red('  Error while trying to fetch the update date', error)
  }
}

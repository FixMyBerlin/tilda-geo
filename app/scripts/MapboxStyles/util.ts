import { styleText } from 'node:util'

export type MapboxStyleMetadata = {
  metadata: { 'mapbox:groups': Record<string, { name: string; collapsed: boolean }> }
  layers: unknown[]
  modified: string
  version: number
  id: string
  owner: string
  name: string
  sprite: string
}

export const fetchStyle = async (key: string, url: string, folder: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    console.error('Fetch failed', { response, url })
    process.exit()
  }

  const data = (await response.json()) as unknown
  await Bun.write(`${folder}/raw-api-response_${key}.json`, JSON.stringify(data, null, 2))
  return data as MapboxStyleMetadata
}

export async function saveJson(filename, data) {
  await Bun.write(filename, JSON.stringify(data, null, 2))
}

// We want our data sorted so we have minimal change in our Git history

export function sortObject<T>(object: Record<string, T>): Record<string, T> {
  const objectAsArray = Object.entries(object)
  objectAsArray.sort((a, b) => a[0].localeCompare(b[0]))
  return Object.fromEntries(objectAsArray) as Record<string, T>
}

export const log = (title: string | object, object: unknown = '-') => {
  console.log(styleText(['inverse', 'bold'], ` ${title}${object === '-' ? '' : ':'} `), object)
}

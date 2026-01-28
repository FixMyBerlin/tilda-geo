import { styleText } from 'node:util'

export const fetchStyle = async (key: string, url: string, folder: string) => {
  const fetchStyle = await fetch(url)
  if (!fetchStyle.ok) {
    console.error('Fetch failed', { fetchStyle, url })
    process.exit()
  }
  const data: any = await fetchStyle.json()
  await Bun.write(`${folder}/raw-api-response_${key}.json`, JSON.stringify(data, null, 2))
  return data
}

export async function saveJson(filename, data) {
  await Bun.write(filename, JSON.stringify(data, null, 2))
}

// We want our data sorted so we have minimal change in our Git history
export function sortObject(object: Record<string, any>) {
  const objectAsArray = Object.entries(object)
  objectAsArray.sort((a, b) => a[0].localeCompare(b[0]))
  return Object.fromEntries(objectAsArray)
}

export const log = (title: string | Object, object: any = '-') => {
  console.log(styleText(['inverse', 'bold'], ` ${title}${object === '-' ? '' : ':'} `), object)
}

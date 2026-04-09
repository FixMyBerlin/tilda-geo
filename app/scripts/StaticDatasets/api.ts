import type { Prisma } from '@prisma/client'
import { red } from './utils/log'

export type StaticDatasetsApiConfig = {
  apiRootUrl: string
  atlasApiKey: string
}

async function checkResponse(request: Request, response: Response) {
  if (!response.ok) {
    const { status, statusText } = response
    red(`ERROR: ${request.url} - ${status} - ${statusText}`)
    red(JSON.stringify(await response.json(), null, 2))
    process.exit(1)
  }
}

export const getRegions = async (api: StaticDatasetsApiConfig) => {
  const url = `${api.apiRootUrl}/regions?apiKey=${encodeURIComponent(api.atlasApiKey)}`
  const request = new Request(url)
  const response = await fetch(request)
  await checkResponse(request, response)
  return (await response.json()).map((region) => ({
    id: region.id,
    slug: region.slug,
  }))
}

type UploadData = {
  uploadSlug: string
  regionSlugs: string[]
  isPublic: boolean
  hideDownloadLink: boolean

  configs: Record<string, unknown>[]
  systemLayer: boolean
} & Pick<
  Prisma.UploadCreateInput,
  // Types could be narrowed more. See schema.prisma and app/scripts/StaticDatasets/types.ts
  | 'pmtilesUrl'
  | 'geojsonUrl'
  | 'githubUrl'
  | 'mapRenderFormat'
  | 'mapRenderUrl'
  | 'externalSourceUrl'
  | 'cacheTtlSeconds'
>

export const createUpload = async (api: StaticDatasetsApiConfig, data: UploadData) => {
  const request = new Request(`${api.apiRootUrl}/uploads/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: api.atlasApiKey,
      ...data,
    }),
  })
  const response = await fetch(request)
  await checkResponse(request, response)
}

export const deleteAllUploads = async (api: StaticDatasetsApiConfig) => {
  const request = new Request(`${api.apiRootUrl}/uploads/delete-all`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: api.atlasApiKey,
    }),
  })
  const response = await fetch(request)
  await checkResponse(request, response)
}

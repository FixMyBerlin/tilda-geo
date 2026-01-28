import { Prisma } from '@prisma/client'
import invariant from 'tiny-invariant'
import { red } from './utils/log'

const getApiRootUrl = () => {
  const apiRootUrl = process.env.API_ROOT_URL
  invariant(apiRootUrl?.startsWith('http'), 'API_ROOT_URL missing.')
  return apiRootUrl
}

export const getRegionsUrl = () => `${getApiRootUrl()}/regions`
export const createUploadUrl = () => `${getApiRootUrl()}/uploads/create`
export const deleteAllUploadsUrl = () => `${getApiRootUrl()}/uploads/delete-all`

const addApiKey = (url) =>
  url + '?' + new URLSearchParams({ apiKey: process.env.ATLAS_API_KEY! }).toString()

async function checkResponse(request: Request, response: Response) {
  if (!response.ok) {
    const { status, statusText } = response
    red(`ERROR: ${request.url} - ${status} - ${statusText}`)
    red(JSON.stringify(await response.json(), null, 2))
    process.exit(1)
  }
}

export const getRegions = async (): Promise<{ id: number; slug: string }[]> => {
  const url = addApiKey(getRegionsUrl())
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
  configs: Record<string, any>[]
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

export const createUpload = async (data: UploadData) => {
  const request = new Request(createUploadUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: process.env.ATLAS_API_KEY!,
      ...data,
    }),
  })
  const response = await fetch(request)
  await checkResponse(request, response)
}

export const deleteAllUploads = async () => {
  const request = new Request(deleteAllUploadsUrl(), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: process.env.ATLAS_API_KEY!,
    }),
  })
  const response = await fetch(request)
  await checkResponse(request, response)
}

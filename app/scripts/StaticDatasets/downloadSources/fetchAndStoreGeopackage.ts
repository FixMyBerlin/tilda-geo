import { WfsUrl } from './createWfsUrl'

export const fetchAndStoreGeopackage = async (wfsUrl: WfsUrl, geoPackageFilename: string) => {
  const response = await fetch(wfsUrl, {
    mode: 'cors',
    redirect: 'follow',
  })

  if (!response.ok) {
    console.error(response.statusText, { statusCode: response.status, url: wfsUrl, response })
    throw new Error(response.statusText)
  }

  await Bun.write(geoPackageFilename, response)

  return geoPackageFilename
}

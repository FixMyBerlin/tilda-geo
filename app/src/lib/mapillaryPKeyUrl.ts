/** Masterportal GFI: `href` with `%value%` replaced by the feature attribute value. */
export const mapillaryPKeyUrlGfiHrefTemplate =
  'https://www.mapillary.com/app/?pKey=%value%&focus=photo&z=15' as const

export const mapillaryKeyUrl = (key: number | string | undefined) => {
  if (key === undefined || key === null || key === '') return undefined

  return `https://www.mapillary.com/app/?pKey=${key}&focus=photo&z=15`
}

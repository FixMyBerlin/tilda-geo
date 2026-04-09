import {
  type StaticDatasetUploadFormat,
  staticDatasetUploadFormats,
} from '@/server/api/uploads/staticDatasetUploadFormats.const'
import type { EnvironmentValues } from '@/server/envSchema'
import { getAppBaseUrl } from './getAppBaseUrl'

const staticDatasetSlugTrailingExtensionRe = new RegExp(
  `\\.(${staticDatasetUploadFormats.join('|')})$`,
)

const pathForStaticDataset = (staticDatasetSlug: string, format: StaticDatasetUploadFormat) => {
  const baseName = staticDatasetSlug.replace(staticDatasetSlugTrailingExtensionRe, '')
  return `/api/uploads/${baseName}.${format}`
}

export const getStaticDatasetUrl = (
  staticDatasetSlug: string,
  format: StaticDatasetUploadFormat,
) => {
  return getAppBaseUrl(pathForStaticDataset(staticDatasetSlug, format))
}

export const getStaticDatasetUrlForEnvironment = (
  staticDatasetSlug: string,
  format: StaticDatasetUploadFormat,
  environment: EnvironmentValues,
) => {
  return getAppBaseUrl(pathForStaticDataset(staticDatasetSlug, format), environment)
}

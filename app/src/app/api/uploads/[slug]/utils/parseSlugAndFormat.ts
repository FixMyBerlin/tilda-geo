import { corsHeaders } from '../../../_util/cors'

type ParseSlugAndFormatOptions = {
  slug: string
  allowedFormats: string[]
  fallbackFormat?: string
}

export function parseSlugAndFormat(options: ParseSlugAndFormatOptions) {
  const { slug, allowedFormats, fallbackFormat } = options
  const lastDotIndex = slug.lastIndexOf('.')
  let baseName: string
  let extension: string

  if (lastDotIndex === -1) {
    if (fallbackFormat) {
      // No file extension found - use fallback (for backwards compatibility)
      baseName = slug
      extension = fallbackFormat
    } else {
      // No fallback allowed - format required
      return {
        success: false,
        response: Response.json(
          {
            statusText: 'Bad Request',
            message: `File format required. Use ${allowedFormats.map((f) => `.${f}`).join(', ')}`,
          },
          { status: 400, headers: corsHeaders },
        ),
      }
    }
  } else {
    baseName = slug.substring(0, lastDotIndex)
    extension = slug.substring(lastDotIndex + 1).toLowerCase()

    // Validate file extension when provided
    if (!allowedFormats.includes(extension)) {
      return {
        success: false,
        response: Response.json(
          {
            statusText: 'Bad Request',
            message: `Unsupported file type. Use ${allowedFormats.map((f) => `.${f}`).join(', ')}`,
          },
          { status: 400, headers: corsHeaders },
        ),
      }
    }
  }

  return {
    success: true,
    result: {
      baseName,
      extension,
    },
  }
}

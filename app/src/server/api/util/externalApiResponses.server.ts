import { z } from 'zod'
import { externalApiCors } from '@/server/api/util/externalApiCors.server'
import { AuthorizationError } from '@/server/auth/errors'

/** Machine-readable `error` values of the external notes API; see docs/External-Notes-API.md. */
type ExternalApiErrorCode =
  | 'origin_not_allowed'
  | 'rate_limited'
  | 'missing_token'
  | 'invalid_osm_token'
  | 'osm_unavailable'
  | 'no_tilda_user'
  | 'invalid_token'
  | 'token_expired'
  | 'not_member'
  | 'region_not_found'
  | 'folder_not_found'
  | 'note_not_found'
  | 'invalid_input'
  | 'forbidden'
  | 'internal_error'

export class ExternalApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ExternalApiErrorCode,
    message: string,
    readonly info?: unknown,
  ) {
    super(message)
    this.name = 'ExternalApiError'
  }
}

function errorBody(error: ExternalApiError) {
  return {
    error: error.code,
    message: error.message,
    ...(error.info === undefined ? {} : { info: error.info }),
  }
}

function toExternalApiError(error: unknown) {
  if (error instanceof ExternalApiError) return error
  if (error instanceof z.ZodError) {
    return new ExternalApiError(400, 'invalid_input', 'Invalid input', z.flattenError(error))
  }
  // The notes functions repeat the member checks; the guard answers the expected cases before.
  if (error instanceof AuthorizationError) {
    return new ExternalApiError(403, 'forbidden', error.message)
  }
  console.error('External API: unexpected error', error)
  return new ExternalApiError(500, 'internal_error', 'An unexpected error occurred')
}

/**
 * Runs one external notes API request: rejects origins that are not on the allow-list, turns the
 * handler's result into JSON, maps errors to `{ error, message }` and adds the CORS headers.
 */
export async function handleExternalApiRequest(
  request: Request,
  handler: () => Promise<{ status: number; body: unknown }>,
) {
  const cors = externalApiCors(request)
  if (!cors.allowed) {
    return Response.json(
      errorBody(new ExternalApiError(403, 'origin_not_allowed', 'Origin not allowed')),
      { status: 403 },
    )
  }
  // Answers depend on the Bearer token; they must never be served from a cache.
  const headers = { ...cors.headers, 'Cache-Control': 'no-store' }
  try {
    const { status, body } = await handler()
    return Response.json(body, { status, headers })
  } catch (error) {
    const apiError = toExternalApiError(error)
    return Response.json(errorBody(apiError), { status: apiError.status, headers })
  }
}

export function bearerToken(request: Request) {
  const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export async function jsonBody(request: Request) {
  try {
    return (await request.json()) as unknown
  } catch {
    throw new ExternalApiError(400, 'invalid_input', 'Invalid JSON body')
  }
}

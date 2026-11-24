import { z } from 'zod'
import { noStoreHeaders } from '@/server/api/util/cacheHeaders.server'
import { corsHeaders, preflightResponse } from '@/server/api/util/cors'
import { AuthorizationError } from '@/server/auth/errors'

/**
 * Machine-readable `error` values of the external API (token exchange, notes, uploads with a
 * token); see docs/External-API-Token.md.
 */
type ExternalApiErrorCode =
  | 'rate_limited'
  | 'missing_token'
  | 'invalid_osm_token'
  | 'osm_unavailable'
  | 'no_tilda_user'
  | 'invalid_token'
  | 'token_expired'
  | 'not_member'
  | 'token_access_disabled'
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
    /** Extra response headers of this error, e.g. `Retry-After`. */
    readonly headers?: Record<string, string>,
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
 * The JSON error answer with the headers of the external API (CORS, never cached). A 401 names the
 * scheme (`WWW-Authenticate`), a 429 says when to retry.
 */
export function externalApiErrorResponse(error: unknown, headers?: HeadersInit) {
  const apiError = toExternalApiError(error)
  const responseHeaders = new Headers(headers)
  for (const [name, value] of Object.entries({
    ...corsHeaders,
    ...noStoreHeaders,
    ...apiError.headers,
  })) {
    responseHeaders.set(name, value)
  }
  if (apiError.status === 401) responseHeaders.set('WWW-Authenticate', 'Bearer')
  return Response.json(errorBody(apiError), { status: apiError.status, headers: responseHeaders })
}

/** Preflight of the token exchange and the notes API. The uploads route has its own. */
export const externalApiPreflightResponse = () =>
  preflightResponse({
    methods: 'GET, POST, PATCH, OPTIONS',
    allowHeaders: 'Authorization, Content-Type',
  })

/**
 * Runs one request of the external API (notes API and token exchange): turns the handler's result into JSON, maps errors to
 * `{ error, message }` and adds the CORS headers.
 */
export async function handleExternalApiRequest(
  handler: () => Promise<{ status: number; body: unknown }>,
) {
  try {
    const { status, body } = await handler()
    // Answers depend on the Bearer token; they must never be served from a cache.
    return Response.json(body, { status, headers: { ...corsHeaders, ...noStoreHeaders } })
  } catch (error) {
    return externalApiErrorResponse(error)
  }
}

export async function jsonBody(request: Request) {
  try {
    return (await request.json()) as unknown
  } catch {
    throw new ExternalApiError(400, 'invalid_input', 'Invalid JSON body')
  }
}

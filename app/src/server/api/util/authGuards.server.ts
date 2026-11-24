import { AuthorizationError } from '@/server/auth/errors'
import type { ExternalApiTokenScope } from '@/server/auth/externalApiToken.const'
import { bearerToken, requireExternalSession } from '@/server/auth/externalSession.server'
import { getAppSession, requireAdmin } from '@/server/auth/session.server'
import { isAdminOrRegionMember } from '@/server/authorization/isAdminOrRegionMember.server'
import { forbiddenJson, unauthorizedJson } from './apiJsonResponses.server'
import { noStoreHeaders } from './cacheHeaders.server'
import { ExternalApiError, externalApiErrorResponse } from './externalApiResponses.server'

type GuardRegionMembershipInput = {
  headers: Headers
  regionIds: number[]
  responseHeaders?: HeadersInit
}

export async function guardAdmin(headers: Headers, responseHeaders?: HeadersInit) {
  try {
    await requireAdmin(headers)
    return null
  } catch (error) {
    if (!(error instanceof AuthorizationError)) {
      throw error
    }

    if (error.message === 'Not authenticated') {
      return unauthorizedJson({ headers: responseHeaders })
    }

    return forbiddenJson({ headers: responseHeaders })
  }
}

/** Cookie session: admin or member of one of the regions. Errors are `{ statusText, message }`, `no-store`. */
export async function guardRegionMembership(input: GuardRegionMembershipInput) {
  const errorHeaders = new Headers(input.responseHeaders)
  for (const [name, value] of Object.entries(noStoreHeaders)) errorHeaders.set(name, value)

  const session = await getAppSession(input.headers)
  if (!session?.userId) {
    return unauthorizedJson({ headers: errorHeaders })
  }

  if (!(await isAdminOrRegionMember(session, input.regionIds))) {
    return forbiddenJson({ headers: errorHeaders })
  }

  return null
}

/**
 * Region member files that a browser app on another origin may read with a TILDA external API
 * token. Decides itself how the request signs in and how an error looks:
 *
 * - `Authorization: Bearer …`: the token is used on its own (no cookie fallback), checked for
 *   `tokenScope`, then the member rule of the cookie. Errors are the external API errors
 *   `{ error, message }` (docs/External-API-Token.md). With `tokenAccess: false` a valid token of a
 *   member is refused with 403 `token_access_disabled` (after the member check, so an outsider
 *   learns nothing about the file).
 * - Any other request (no header, `Basic …`): the cookie session, errors are `{ statusText, message }`.
 *
 * Returns the error response, or null when access is granted.
 */
export async function guardRegionMembershipBySessionOrToken(input: {
  request: Request
  regionIds: number[]
  tokenScope: ExternalApiTokenScope
  /** Does this file accept external API tokens at all (e.g. `MapDatasetUpload.externalTokenAccess`)? */
  tokenAccess: boolean
  responseHeaders?: HeadersInit
}) {
  if (bearerToken(input.request) === null) {
    return guardRegionMembership({
      headers: input.request.headers,
      regionIds: input.regionIds,
      responseHeaders: input.responseHeaders,
    })
  }

  try {
    const { session } = await requireExternalSession(input.request, input.tokenScope)
    if (!(await isAdminOrRegionMember(session, input.regionIds))) {
      throw new ExternalApiError(403, 'not_member', 'Not a member of a region of this file')
    }
    if (!input.tokenAccess) {
      throw new ExternalApiError(
        403,
        'token_access_disabled',
        'This file is not available with an external API token',
      )
    }
    return null
  } catch (error) {
    return externalApiErrorResponse(error, input.responseHeaders)
  }
}

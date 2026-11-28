import { UserRoleEnum } from '@/prisma/generated/client'
import { verifyAdminApiToken } from '@/server/admin/adminApiTokens.server'
import {
  failedAuthRateLimitKey,
  failedAuthRetryAfterSeconds,
  getClientIp,
  isFailedAuthRateLimited,
  recordFailedAuth,
} from '@/server/api/util/failedAuthRateLimit.server'
import type { AuditChangeSource } from '@/server/audit/auditChangeSources.const'
import { bearerToken } from '@/server/auth/externalSession.server'
import type { AdminApiCaller } from '@/server/auth/memberCaller.server'

export type AdminApiAuth = {
  tokenId: string
  createdById: string
  changeSource: Extract<AuditChangeSource, 'API'>
}

type GuardResult =
  | { access: true; auth: AdminApiAuth; response: null }
  | { access: false; auth: null; response: Response }

/**
 * Authenticate an admin REST API request via `Authorization: Bearer <token>` (AdminApiToken).
 * Mirrors guardEndpoint's `{ access, response }` shape. The resolved auth carries the audit
 * attribution (userId = token owner, changeSource API, adminTokenId) for write endpoints.
 */
export async function guardAdminApi(request: Request): Promise<GuardResult> {
  // Verified first, like the external API: a valid token works even when the IP is limited
  // (a bad client behind the same NAT must not lock out the admin); only failed attempts get 429.
  const token = bearerToken(request)
  const verified = token ? await verifyAdminApiToken(token) : null
  if (verified) {
    return {
      access: true,
      auth: {
        tokenId: verified.tokenId,
        createdById: verified.createdById,
        changeSource: 'API',
      },
      response: null,
    }
  }

  const rateLimitKey = failedAuthRateLimitKey(request, 'admin')
  if (rateLimitKey && isFailedAuthRateLimited(rateLimitKey)) {
    return {
      access: false,
      auth: null,
      response: Response.json(
        { message: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(failedAuthRetryAfterSeconds(rateLimitKey)) },
        },
      ),
    }
  }
  if (rateLimitKey) recordFailedAuth(rateLimitKey)
  return {
    access: false,
    auth: null,
    response: Response.json({ message: 'Unauthorized' }, { status: 401 }),
  }
}

/** Audit context for an admin REST API write — attributes to the token owner with API source. */
export function adminApiAuditContext(auth: AdminApiAuth, request: Request) {
  return {
    userId: auth.createdById,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get('user-agent'),
    metadata: { changeSource: auth.changeSource, adminTokenId: auth.tokenId },
  }
}

/**
 * The token owner as caller of member functions (notes, Prüflisten, QA). `verifyAdminApiToken` only
 * accepts tokens whose owner is still an ADMIN, so the role is known without another lookup.
 */
export function adminApiMemberCaller(auth: AdminApiAuth, request: Request) {
  return {
    headers: request.headers,
    session: { userId: auth.createdById, role: UserRoleEnum.ADMIN },
    adminTokenId: auth.tokenId,
  } satisfies AdminApiCaller
}

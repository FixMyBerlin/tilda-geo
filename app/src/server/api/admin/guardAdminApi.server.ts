import { verifyAdminApiToken } from '@/server/admin/adminApiTokens.server'
import {
  getClientIp,
  isAdminApiAuthRateLimited,
  recordFailedAdminApiAuth,
} from '@/server/api/admin/adminApiAuthRateLimit.server'
import type { AuditChangeSource } from '@/server/audit/auditChangeSources.const'

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
  const clientIp = getClientIp(request)
  if (isAdminApiAuthRateLimited(clientIp)) {
    return {
      access: false,
      auth: null,
      response: Response.json({ message: 'Too many requests' }, { status: 429 }),
    }
  }

  const header = request.headers.get('authorization') ?? request.headers.get('Authorization')
  const match = header?.match(/^Bearer\s+(.+)$/i)
  if (!match?.[1]) {
    recordFailedAdminApiAuth(clientIp)
    return {
      access: false,
      auth: null,
      response: Response.json({ message: 'Unauthorized' }, { status: 401 }),
    }
  }

  const verified = await verifyAdminApiToken(match[1].trim())
  if (!verified) {
    recordFailedAdminApiAuth(clientIp)
    return {
      access: false,
      auth: null,
      response: Response.json({ message: 'Unauthorized' }, { status: 401 }),
    }
  }

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

/** Audit context for an admin REST API write — attributes to the token owner with API source. */
export function adminApiAuditContext(auth: AdminApiAuth, request: Request) {
  return {
    userId: auth.createdById,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get('user-agent'),
    metadata: { changeSource: auth.changeSource, adminTokenId: auth.tokenId },
  }
}

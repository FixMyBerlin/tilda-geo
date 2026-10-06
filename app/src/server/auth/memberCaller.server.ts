import { UserRoleEnum } from '@/prisma/generated/client'
import { apiJsonMessages } from '@/server/api/util/apiJsonResponses.server'
import { clientIpFromHeaders } from '@/server/api/util/clientIp.server'
import { adminFormAuditContext, memberFormAuditContext } from '@/server/audit/auditContext.server'
import { AuthorizationError } from '@/server/auth/errors'
import { getAppSession, requireAdmin, requireAuth } from '@/server/auth/session.server'
import type { SessionActor } from '@/server/auth/types'

/** A request to `/api/notes/*`: the session comes from a verified ExternalApiToken. */
export type ExternalNotesCaller = {
  headers: Headers
  session: SessionActor
  tokenId: string
}

/** A request to `/mcp`: the session is the (admin) owner of a verified AdminApiToken. */
export type AdminApiCaller = {
  headers: Headers
  session: SessionActor
  adminTokenId: string
}

/**
 * Who calls a member function (notes, Prüflisten): the request headers of our own frontend
 * (session from the cookie), an external API request, or the admin MCP. All end up as a session
 * that the same member checks run against.
 */
export type MemberCaller = Headers | ExternalNotesCaller | AdminApiCaller

export async function requireMemberSession(caller: MemberCaller): Promise<SessionActor> {
  return caller instanceof Headers ? requireAuth(caller) : caller.session
}

export async function getMemberSession(caller: MemberCaller): Promise<SessionActor | null> {
  return caller instanceof Headers ? getAppSession(caller) : caller.session
}

/** For the admin-only functions of notes and Prüflisten (region links of folders and lists). */
export async function requireAdminSession(caller: MemberCaller): Promise<SessionActor> {
  if (caller instanceof Headers) return requireAdmin(caller)
  if (caller.session.role !== UserRoleEnum.ADMIN) {
    throw new AuthorizationError(apiJsonMessages.adminAccessRequired)
  }
  return caller.session
}

function tokenAuditContext(caller: ExternalNotesCaller | AdminApiCaller, userId: string) {
  return {
    userId,
    ipAddress: clientIpFromHeaders(caller.headers),
    userAgent: caller.headers.get('user-agent'),
    metadata:
      'adminTokenId' in caller
        ? { changeSource: 'API' as const, adminTokenId: caller.adminTokenId }
        : { changeSource: 'EXTERNAL_API' as const, externalTokenId: caller.tokenId },
  }
}

export function memberAuditContext(caller: MemberCaller, userId: string) {
  if (caller instanceof Headers) return memberFormAuditContext(caller, userId)
  return tokenAuditContext(caller, userId)
}

export function adminAuditContext(caller: MemberCaller, userId: string) {
  if (caller instanceof Headers) return adminFormAuditContext(caller, userId)
  return tokenAuditContext(caller, userId)
}

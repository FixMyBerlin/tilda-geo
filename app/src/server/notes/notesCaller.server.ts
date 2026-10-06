import { clientIpFromHeaders } from '@/server/api/util/clientIp.server'
import { memberFormAuditContext } from '@/server/audit/auditContext.server'
import { getAppSession, requireAuth } from '@/server/auth/session.server'
import type { SessionActor } from '@/server/auth/types'

/** A request to `/api/notes/*`: the session comes from a verified ExternalApiToken. */
export type ExternalNotesCaller = {
  headers: Headers
  session: SessionActor
  tokenId: string
}

/**
 * Who calls a notes function: the request headers of our own frontend (session from the cookie),
 * or an external API request. Both end up as a session that the same member checks run against.
 */
export type NotesCaller = Headers | ExternalNotesCaller

export async function requireNotesSession(caller: NotesCaller): Promise<SessionActor> {
  return caller instanceof Headers ? requireAuth(caller) : caller.session
}

export async function getNotesSession(caller: NotesCaller): Promise<SessionActor | null> {
  return caller instanceof Headers ? getAppSession(caller) : caller.session
}

export function notesAuditContext(caller: NotesCaller, userId: string) {
  if (caller instanceof Headers) return memberFormAuditContext(caller, userId)
  return {
    userId,
    ipAddress: clientIpFromHeaders(caller.headers),
    userAgent: caller.headers.get('user-agent'),
    metadata: { changeSource: 'EXTERNAL_API' as const, externalTokenId: caller.tokenId },
  }
}

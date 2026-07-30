import { AsyncLocalStorage } from 'node:async_hooks'
import { clientIpFromHeaders } from '@/server/api/util/clientIp.server'
import type { AuditLogMetadata } from '@/server/audit/auditLogMetadata.schema'

export type AuditContext = {
  userId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: AuditLogMetadata
}

/**
 * Request-scoped actor/source for Prisma audit rows (see `getContext` in prismaAuditExtensions.server).
 *
 * Why AsyncLocalStorage: the audit extension calls `getAuditContext()` deep inside Prisma writes.
 * Call sites wrap those writes with `runWithAuditContextAsync` so we don't thread userId / IP /
 * changeSource through every mutation. ALS binds the context to the current async call chain
 * (this request/job only — not process-global, not leaked across concurrent requests).
 */
const auditContextStorage = new AsyncLocalStorage<AuditContext>()

/** Reads the context set by the nearest `runWithAuditContextAsync`; `{}` if none (unattributed write). */
export function getAuditContext(): AuditContext {
  return auditContextStorage.getStore() ?? {}
}

/** Run `fn` with `context` visible to all nested awaits / Prisma writes via `getAuditContext`. */
export async function runWithAuditContextAsync<T>(
  context: AuditContext,
  fn: () => Promise<T>,
): Promise<T> {
  return auditContextStorage.run(context, fn)
}

/** Audit context for admin UI form writes — attributes to the signed-in admin. */
export function adminFormAuditContext(headers: Headers, userId: string) {
  return {
    userId,
    // Rightmost forwarded hop, NOT the client-spoofable leftmost / raw header — see clientIpFromHeaders.
    ipAddress: clientIpFromHeaders(headers),
    userAgent: headers.get('user-agent'),
    metadata: { changeSource: 'ADMIN_FORM' as const },
  }
}

/** Member-facing UI writes (notes, profile, QA evaluations, region access tracking). */
export function memberFormAuditContext(headers: Headers, userId: string) {
  return {
    userId,
    ipAddress: clientIpFromHeaders(headers),
    userAgent: headers.get('user-agent'),
    metadata: { changeSource: 'MEMBER_FORM' as const },
  }
}

/** API-key / machine writes without a user actor (reuse changeSource API). */
export function systemApiAuditContext(headers: Headers) {
  return {
    ipAddress: clientIpFromHeaders(headers),
    userAgent: headers.get('user-agent'),
    metadata: { changeSource: 'API' as const },
  }
}

import { auditLogExtension } from '@explita/prisma-audit-log'
import type { PrismaClient } from '@/prisma/generated/client'
import { AUDITED_MODELS } from '@/server/audit/auditAuditedModels.const'
import { getAuditContext } from '@/server/audit/auditContext.server'

/**
 * Prisma audit logging is two cooperating parts:
 *
 * 1. **Automatic AuditLog rows** — this extension (plus the small `recordId` string fix below)
 *    watches create/update/delete on `AUDITED_MODELS` and writes an AuditLog entry for each.
 *    That happens for every write through the shared `db` client; call sites do not opt in.
 *
 * 2. **Actor / source attribution** — `getContext` below reads request-scoped ALS from
 *    `auditContext.server` (`runWithAuditContextAsync` + helpers like `adminFormAuditContext`).
 *    Without a wrap, the AuditLog row is still created but unattributed (`{}`: no userId / IP /
 *    changeSource). Write paths that care about who/what caused the change must set that context.
 */
export function extendWithAuditLog(client: PrismaClient) {
  return (
    client
      // Part 1a — coerce AuditLog.recordId to string (Prisma Int/BigInt ids otherwise mismatch).
      .$extends({
        name: 'auditLogRecordIdFix',
        query: {
          auditLog: {
            async createMany({ args, query }) {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((entry) => ({
                  ...entry,
                  recordId: String(entry.recordId),
                }))
              }
              return query(args)
            },
            async create({ args, query }) {
              if (args.data && 'recordId' in args.data && args.data.recordId != null) {
                args.data = { ...args.data, recordId: String(args.data.recordId) }
              }
              return query(args)
            },
          },
        },
      })
      // Part 1b — @explita/prisma-audit-log: emit AuditLog rows for included models.
      //
      // KNOWN LIMITATION — audit writes are NOT transactional. This extension writes its AuditLog rows
      // via the top-level client captured here, not via the interactive-transaction client. So when a
      // write happens inside `db.$transaction(async (tx) => …)`, the data write is atomic but its audit
      // row commits separately (own connection, outside the tx). Consequences:
      //   - if the transaction rolls back, the data is undone but the audit row stays → the log can
      //     record a change that never happened (e.g. a rolled-back contract create still logs a CREATE).
      //   - if an audit insert itself fails, the library swallows it (console.error) → a real change with
      //     no audit row.
      // Accepted for now: rollbacks are rare and the trail is treated as best-effort. Revisit (patch the
      // extension to be tx-aware, or write audit rows inside the tx) only if audit integrity becomes a
      // hard requirement.
      .$extends(
        auditLogExtension({
          includeModels: [...AUDITED_MODELS],
          // Part 2 — fill actor fields from ALS; empty when the write path did not wrap.
          getContext: () => {
            const ctx = getAuditContext()
            return {
              userId: ctx.userId ?? undefined,
              ipAddress: ctx.ipAddress ?? undefined,
              userAgent: ctx.userAgent ?? undefined,
              metadata: ctx.metadata ?? undefined,
            }
          },

          skip: ({ model, operation, args }) => {
            if (model === 'AuditLog') return true
            if (model === 'Session' && operation === 'update') return true
            if (model === 'AdminApiToken' && operation === 'update') {
              const data = args?.data as Record<string, unknown> | undefined
              if (data && Object.keys(data).length === 1 && 'lastUsedAt' in data) return true
            }
            return false
          },
          maskFields: [
            'password',
            'token',
            'accessToken',
            'refreshToken',
            'hashedToken',
            // better-auth OAuth secrets on audited models: Verification.value holds the OAuth state
            // incl. the PKCE codeVerifier; Account.idToken is an OIDC JWT. Mask so these short-lived
            // secrets don't become durable, admin-readable AuditLog rows.
            'value',
            'idToken',
          ],
        }),
      )
  )
}

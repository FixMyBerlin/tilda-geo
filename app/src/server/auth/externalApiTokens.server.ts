import { createHash, randomBytes } from 'node:crypto'
import {
  EXTERNAL_API_TOKEN_PREFIX,
  EXTERNAL_API_TOKEN_TTL_MS,
  type ExternalApiTokenScope,
} from '@/server/auth/externalApiToken.const'
import type { SessionActor } from '@/server/auth/types'
import db from '@/server/db.server'

const LAST_USED_UPDATE_INTERVAL_MS = 5 * 60 * 1000

/**
 * ExternalApiToken: short-lived Bearer tokens for the external notes API, issued by the token exchange
 * (`exchangeOsmToken`) to a TILDA user who proved their OSM identity. Like AdminApiToken,
 * tokens are high-entropy random strings of which we only store the SHA-256 hash. A token carries
 * a user and a scope, no permissions: role and region membership are read on every request.
 */
function generateToken() {
  return `${EXTERNAL_API_TOKEN_PREFIX}${randomBytes(32).toString('hex')}`
}

function hashExternalApiToken(plaintext: string) {
  return createHash('sha256').update(plaintext).digest('hex')
}

export async function createExternalApiToken(input: {
  userId: string
  scope: ExternalApiTokenScope
}) {
  const now = Date.now()
  // Expired tokens are useless; clearing them here keeps the table small without a cron job.
  await db.externalApiToken.deleteMany({ where: { expiresAt: { lt: new Date(now) } } })

  const token = generateToken()
  const expiresAt = new Date(now + EXTERNAL_API_TOKEN_TTL_MS)
  await db.externalApiToken.create({
    data: {
      hashedToken: hashExternalApiToken(token),
      scope: input.scope,
      expiresAt,
      userId: input.userId,
    },
  })
  // `token` (plaintext) is returned only here — never stored or logged.
  return { token, expiresAt }
}

type VerifiedExternalApiToken =
  | { ok: true; tokenId: string; session: SessionActor }
  | { ok: false; reason: 'invalid' | 'expired' }

/** Verify a presented Bearer token for `scope`. The session's role is the user's current role. */
export async function verifyExternalApiToken(
  plaintext: string,
  scope: ExternalApiTokenScope,
): Promise<VerifiedExternalApiToken> {
  if (!plaintext.startsWith(EXTERNAL_API_TOKEN_PREFIX)) return { ok: false, reason: 'invalid' }

  const row = await db.externalApiToken.findUnique({
    where: { hashedToken: hashExternalApiToken(plaintext) },
    select: {
      id: true,
      scope: true,
      expiresAt: true,
      lastUsedAt: true,
      user: { select: { id: true, role: true } },
    },
  })
  if (!row || row.scope !== scope) return { ok: false, reason: 'invalid' }
  if (row.expiresAt.getTime() <= Date.now()) return { ok: false, reason: 'expired' }

  const shouldTouchLastUsed =
    row.lastUsedAt == null || Date.now() - row.lastUsedAt.getTime() >= LAST_USED_UPDATE_INTERVAL_MS
  if (shouldTouchLastUsed) {
    await db.externalApiToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
  }

  return { ok: true, tokenId: row.id, session: { userId: row.user.id, role: row.user.role } }
}

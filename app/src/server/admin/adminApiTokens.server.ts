import { createHash, randomBytes } from 'node:crypto'
import { UserRoleEnum } from '@/prisma/generated/client'
import { ADMIN_API_TOKEN_PREFIX } from '@/server/admin/adminApiTokenPrefix.const'
import db from '@/server/db.server'
const LAST_USED_UPDATE_INTERVAL_MS = 5 * 60 * 1000

/**
 * AdminApiToken: revocable Bearer tokens for the admin REST API / MCP. Tokens are high-entropy
 * random strings; we store only their SHA-256 hash (a fast hash is appropriate here — unlike
 * passwords, tokens are not low-entropy and not user-chosen). The plaintext is shown once on create.
 */
function generateToken() {
  return `${ADMIN_API_TOKEN_PREFIX}${randomBytes(32).toString('hex')}`
}

function hashToken(plaintext: string) {
  return createHash('sha256').update(plaintext).digest('hex')
}

export async function createAdminApiToken(input: { name: string; createdById: string }) {
  const token = generateToken()
  const row = await db.adminApiToken.create({
    data: { name: input.name, hashedToken: hashToken(token), createdById: input.createdById },
  })
  // `token` (plaintext) is returned only here — never stored or logged.
  return { token, row }
}

export async function listAdminApiTokens() {
  return db.adminApiToken.findMany({
    orderBy: [{ revokedAt: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
      createdBy: {
        select: { id: true, osmName: true, firstName: true, lastName: true, email: true },
      },
    },
  })
}

export async function revokeAdminApiToken(id: string) {
  return db.adminApiToken.update({
    where: { id },
    data: { revokedAt: new Date() },
    select: { id: true },
  })
}

/** Verify a presented Bearer token. Returns the owning context, or null if unknown/revoked/non-admin. */
export async function verifyAdminApiToken(plaintext: string) {
  if (!plaintext.startsWith(ADMIN_API_TOKEN_PREFIX)) return null

  const row = await db.adminApiToken.findUnique({
    where: { hashedToken: hashToken(plaintext) },
    select: {
      id: true,
      createdById: true,
      revokedAt: true,
      lastUsedAt: true,
      createdBy: { select: { role: true } },
    },
  })
  // Reject if the creator is no longer an ADMIN (e.g. demoted) — tokens stay valid until
  // revoked or the owning user's role drops, so we re-check role on every use.
  if (!row || row.revokedAt || row.createdBy.role !== UserRoleEnum.ADMIN) return null

  const shouldTouchLastUsed =
    row.lastUsedAt == null || Date.now() - row.lastUsedAt.getTime() >= LAST_USED_UPDATE_INTERVAL_MS
  if (shouldTouchLastUsed) {
    await db.adminApiToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
  }

  return { tokenId: row.id, createdById: row.createdById }
}

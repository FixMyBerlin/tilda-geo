import * as p from '@clack/prompts'
import { seedLocalAccess } from '../seed-local/seedLocalAccess'
import {
  assertLocalRestoreTarget,
  createUnauditedPrismaClient,
  getLocalTargetDatabaseUrl,
} from './db-helpers'
import {
  buildPseudonymForUser,
  shouldPseudonymizeContactEmail,
  shouldPseudonymizeNames,
} from './pseudonymizeUser'

/** Pseudonymize external users, scrub credentials, then ensure local FMC admins + MCP token. */
export async function sanitizePrismaRestore() {
  const databaseUrl = getLocalTargetDatabaseUrl()
  assertLocalRestoreTarget(databaseUrl)

  const db = createUnauditedPrismaClient()
  try {
    const users = await db.user.findMany({
      select: { id: true, email: true },
      orderBy: { id: 'asc' },
    })

    let pseudonymized = 0
    for (const user of users) {
      const names = shouldPseudonymizeNames(user.email)
      const contactEmail = shouldPseudonymizeContactEmail(user.email)
      if (!names && !contactEmail) continue

      const pseudo = buildPseudonymForUser(user.id)
      await db.user.update({
        where: { id: user.id },
        data: {
          ...(names ? { firstName: pseudo.firstName, lastName: pseudo.lastName } : {}),
          ...(contactEmail ? { email: pseudo.email } : {}),
        },
      })
      pseudonymized += 1
    }

    const deletedTokens = await db.adminApiToken.deleteMany()
    const deletedSessions = await db.session.deleteMany()
    const deletedVerifications = await db.verification.deleteMany()
    const deletedAuditLogs = await db.auditLog.deleteMany()
    const clearedAccounts = await db.account.updateMany({
      where: {},
      data: {
        accessToken: null,
        refreshToken: null,
        idToken: null,
        password: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
      },
    })

    p.note(
      [
        `users pseudonymized: ${pseudonymized}`,
        `AdminApiToken deleted: ${deletedTokens.count}`,
        `Session deleted: ${deletedSessions.count}`,
        `Verification deleted: ${deletedVerifications.count}`,
        `AuditLog deleted: ${deletedAuditLogs.count}`,
        `Account secrets cleared: ${clearedAccounts.count}`,
      ].join('\n'),
      'Prisma restore sanitized',
    )

    await seedLocalAccess(db)
  } finally {
    await db.$disconnect()
  }
}

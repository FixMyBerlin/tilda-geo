import { parseArgs } from 'node:util'
import * as p from '@clack/prompts'
import { z } from 'zod'
import { createUnauditedPrismaClient } from '../db-pull/db-helpers'
import { planAccountTokens } from './planAccountTokens'

const HELP = `encrypt-osm-oauth-tokens

Encrypt the OSM OAuth tokens that were stored in plain text before Better Auth's
encryptOAuthTokens was switched on, and drop the stored idTokens. Idempotent.
Run it only on a database whose app already runs with encryptOAuthTokens. See README.md.

Usage:
  bun scripts/encrypt-osm-oauth-tokens/index.ts --dry-run
  bun scripts/encrypt-osm-oauth-tokens/index.ts

Options:
  --dry-run   Count what would change, write nothing
`

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})
if (values.help) {
  process.stdout.write(HELP)
  process.exit(0)
}
const dryRun = values['dry-run']

const { SESSION_SECRET_KEY: secret } = z
  .object({ SESSION_SECRET_KEY: z.string().min(1) })
  .parse(process.env)

// No audit extension: AuditLog would only get masked rows for a bulk job.
// DEV_PORT_SLOT only applies locally; on the servers it is unset.
const db = createUnauditedPrismaClient()

try {
  const accounts = await db.account.findMany({
    where: {
      providerId: 'osm',
      OR: [
        { accessToken: { not: null } },
        { refreshToken: { not: null } },
        { idToken: { not: null } },
      ],
    },
    select: { id: true, accessToken: true, refreshToken: true, idToken: true },
    orderBy: { id: 'asc' },
  })

  const plans = await Promise.all(
    accounts.map(async (account) => ({ account, plan: await planAccountTokens(account, secret) })),
  )

  const count = (field: 'accessToken' | 'refreshToken', state: string) =>
    plans.filter(({ plan }) => plan[field] === state).length
  const toWrite = plans.filter(({ plan }) => Object.keys(plan.data).length > 0)
  const unreadable = plans.filter(({ plan }) => plan.unreadable)

  p.note(
    [
      `OSM accounts with tokens: ${accounts.length}`,
      `accessToken  plain: ${count('accessToken', 'plain')}, encrypted: ${count('accessToken', 'encrypted')}, unreadable: ${count('accessToken', 'unreadable')}`,
      `refreshToken plain: ${count('refreshToken', 'plain')}, encrypted: ${count('refreshToken', 'encrypted')}, unreadable: ${count('refreshToken', 'unreadable')}`,
      `idToken to drop: ${plans.filter(({ plan }) => 'idToken' in plan.data).length}`,
      `rows to update: ${toWrite.length}`,
    ].join('\n'),
    dryRun ? 'Dry run, nothing written' : 'Plan',
  )

  if (unreadable.length > 0) {
    // Usually a different SESSION_SECRET_KEY than the app's. Writing now would mix two secrets.
    p.log.error(
      `${unreadable.length} account(s) hold a token that looks encrypted but does not decrypt with this SESSION_SECRET_KEY: ${unreadable.map(({ plan }) => plan.id).join(', ')}`,
    )
    process.exitCode = 1
  } else if (!dryRun) {
    let updated = 0
    let changedMeanwhile = 0
    for (const { account, plan } of toWrite) {
      // Match the values we read, so a token written by a sign-in since then is left alone.
      const result = await db.account.updateMany({
        where: {
          id: account.id,
          accessToken: account.accessToken,
          refreshToken: account.refreshToken,
          idToken: account.idToken,
        },
        data: plan.data,
      })
      if (result.count === 1) updated += 1
      else changedMeanwhile += 1
    }
    p.log.success(
      `Updated ${updated} account(s). Skipped (changed meanwhile): ${changedMeanwhile}.`,
    )
  }
} finally {
  await db.$disconnect()
}

import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { isIntegrationDbAvailable } from '../../../test/integrationDb'

const integrationDb = await isIntegrationDbAvailable()
const REGION_SLUG = 'vitest-audit-context-lazy'
const ADMIN_USER_ID = 'vitest-audit-context-lazy-admin'

async function auditRowFor(action: string, recordId: string) {
  return db.auditLog.findFirstOrThrow({
    where: { model: 'Membership', action, recordId },
    orderBy: { createdAt: 'desc' },
  })
}

describe.skipIf(!integrationDb)('runWithAuditContextAsync (integration)', () => {
  let regionId = 0

  beforeAll(async () => {
    await db.membership.deleteMany({ where: { userId: ADMIN_USER_ID } })
    await db.region.deleteMany({ where: { slug: REGION_SLUG } })
    await db.user.deleteMany({ where: { id: ADMIN_USER_ID } })
    await db.user.create({
      data: {
        id: ADMIN_USER_ID,
        email: 'vitest-audit-context-lazy@users.openstreetmap.invalid',
        osmId: 1_900_000_010,
        osmName: 'vitest-audit-context-lazy',
        role: 'ADMIN',
      },
    })
    const region = await db.region.create({ data: { slug: REGION_SLUG } })
    regionId = region.id
  })

  afterAll(async () => {
    await db.membership.deleteMany({ where: { userId: ADMIN_USER_ID } })
    await db.region.deleteMany({ where: { slug: REGION_SLUG } })
    await db.user.deleteMany({ where: { id: ADMIN_USER_ID } })
  })

  // Mutations pass the Prisma call straight through (`() => db.x.create(...)`). PrismaPromise is
  // lazy: the query (and the audit extension's `getContext`) only runs once it is awaited.
  test('attributes writes from a callback that returns the Prisma promise un-awaited', async () => {
    const headers = new Headers({ 'user-agent': 'vitest-audit-context-lazy' })
    const context = adminFormAuditContext(headers, ADMIN_USER_ID)

    const membership = await runWithAuditContextAsync(context, () =>
      db.membership.create({ data: { userId: ADMIN_USER_ID, regionId } }),
    )
    const created = await auditRowFor('CREATE', String(membership.id))
    expect(created.userId).toBe(ADMIN_USER_ID)
    expect(created.metadata).toMatchObject({ changeSource: 'ADMIN_FORM' })

    await runWithAuditContextAsync(context, () =>
      db.membership.delete({ where: { id: membership.id } }),
    )
    const deleted = await auditRowFor('DELETE', String(membership.id))
    expect(deleted.userId).toBe(ADMIN_USER_ID)
    expect(deleted.metadata).toMatchObject({ changeSource: 'ADMIN_FORM' })
  })
})

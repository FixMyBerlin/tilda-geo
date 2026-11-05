import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { isIntegrationDbAvailable } from '../../../test/integrationDb'

const integrationDb = await isIntegrationDbAvailable()
const REGION_SLUG = 'vitest-audit-space-finder'
const USER_ID = 'vitest-audit-space-finder-user'

const studyArea = {
  type: 'Polygon',
  coordinates: [
    [
      [13.4, 52.5],
      [13.41, 52.5],
      [13.41, 52.51],
      [13.4, 52.5],
    ],
  ],
}

async function auditRowsFor(
  model: 'SpaceFinderArea' | 'SpaceFinderVariant' | 'SpaceFinderJob',
  recordId: number,
) {
  return db.auditLog.findMany({
    where: { model, recordId: String(recordId) },
    orderBy: { createdAt: 'asc' },
  })
}

describe.skipIf(!integrationDb)('SpaceFinderArea audit (integration)', () => {
  let regionId = 0

  beforeAll(async () => {
    await db.region.deleteMany({ where: { slug: REGION_SLUG } })
    await db.user.deleteMany({ where: { id: USER_ID } })
    await db.user.create({
      data: {
        id: USER_ID,
        email: 'vitest-audit-space-finder@users.openstreetmap.invalid',
        osmId: 1_900_000_020,
        osmName: 'vitest-audit-space-finder',
      },
    })
    const region = await db.region.create({ data: { slug: REGION_SLUG } })
    regionId = region.id
  })

  afterAll(async () => {
    await db.spaceFinderArea.deleteMany({ where: { regionId } })
    await db.region.deleteMany({ where: { slug: REGION_SLUG } })
    await db.user.deleteMany({ where: { id: USER_ID } })
  })

  test('keeps GeoJSON and census figures out of the rows, skips census-only updates', async () => {
    const context = memberFormAuditContext(new Headers(), USER_ID)
    const area = await runWithAuditContextAsync(context, () =>
      db.spaceFinderArea.create({
        data: {
          regionId,
          createdById: USER_ID,
          title: 'Gebiet',
          studyArea,
          userDatasets: [{ id: 'd1', name: 'Eigene', mode: 'bonus', geojson: {} }],
        },
      }),
    )
    await runWithAuditContextAsync(context, () =>
      db.spaceFinderArea.update({
        where: { id: area.id },
        data: { censusSaettigungEw: 12, censusComputedAt: new Date() },
      }),
    )
    await runWithAuditContextAsync(context, () =>
      db.spaceFinderArea.update({
        where: { id: area.id },
        data: {
          studyArea: { ...studyArea, coordinates: [] },
          title: 'Gebiet 2',
          inputUpdatedAt: new Date(),
        },
      }),
    )

    const rows = await auditRowsFor('SpaceFinderArea', area.id)
    expect(rows.map((row) => row.action)).toEqual(['CREATE', 'UPDATE'])
    expect(rows[0]?.userId).toBe(USER_ID)
    expect(rows[0]?.metadata).toMatchObject({ changeSource: 'MEMBER_FORM' })
    expect(rows[0]?.newData).not.toHaveProperty('userDatasets')
    expect(rows[0]?.newData).not.toHaveProperty('censusSaettigungEw')
    expect(rows[0]?.newData).toMatchObject({ title: 'Gebiet', studyArea })
    expect(rows[1]?.changedFields).toEqual(
      expect.arrayContaining(['title', 'studyArea', 'inputUpdatedAt']),
    )
  })

  // createSpaceFinderAreaFn creates the first variant in the same transaction as the area.
  test('logs a variant created through the transaction client', async () => {
    const context = memberFormAuditContext(new Headers(), USER_ID)
    const variant = await runWithAuditContextAsync(context, () =>
      db.$transaction(async (tx) => {
        const area = await tx.spaceFinderArea.create({
          data: { regionId, createdById: USER_ID, title: 'Gebiet tx', studyArea },
        })
        return tx.spaceFinderVariant.create({
          data: { areaId: area.id, createdById: USER_ID, title: 'Variante 1', factorConfig: {} },
        })
      }),
    )

    const rows = await auditRowsFor('SpaceFinderVariant', variant.id)
    expect(rows.map((row) => row.action)).toEqual(['CREATE'])
    expect(rows[0]?.userId).toBe(USER_ID)
    expect(rows[0]?.metadata).toMatchObject({ changeSource: 'MEMBER_FORM' })
    expect(rows[0]?.newData).toMatchObject({ title: 'Variante 1', areaId: variant.areaId })
  })

  test('logs the start of a run, not the status updates', async () => {
    const context = memberFormAuditContext(new Headers(), USER_ID)
    const area = await db.spaceFinderArea.create({
      data: { regionId, createdById: USER_ID, title: 'Gebiet run', studyArea },
    })
    const variant = await db.spaceFinderVariant.create({
      data: { areaId: area.id, createdById: USER_ID, title: 'Variante run', factorConfig: {} },
    })
    const job = await runWithAuditContextAsync(context, () =>
      db.spaceFinderJob.create({
        data: { variantId: variant.id, status: 'QUEUED' },
        select: { id: true, status: true, variantId: true },
      }),
    )
    await db.spaceFinderJob.update({
      where: { id: job.id },
      data: { status: 'RUNNING', progress: 50 },
    })

    const rows = await auditRowsFor('SpaceFinderJob', job.id)
    expect(rows.map((row) => row.action)).toEqual(['CREATE'])
    expect(rows[0]?.userId).toBe(USER_ID)
    expect(rows[0]?.metadata).toMatchObject({ changeSource: 'MEMBER_FORM' })
    expect(rows[0]?.newData).toMatchObject({ variantId: variant.id, status: 'QUEUED' })
  })
})

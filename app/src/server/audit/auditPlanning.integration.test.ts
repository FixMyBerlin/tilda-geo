import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { isIntegrationDbAvailable } from '../../../test/integrationDb'

const integrationDb = await isIntegrationDbAvailable()
const REGION_SLUG = 'vitest-audit-planning'
const USER_ID = 'vitest-audit-planning-user'

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

async function auditRowsFor(model: 'PlanningArea' | 'PlanningVariant', recordId: number) {
  return db.auditLog.findMany({
    where: { model, recordId: String(recordId) },
    orderBy: { createdAt: 'asc' },
  })
}

describe.skipIf(!integrationDb)('PlanningArea audit (integration)', () => {
  let regionId = 0

  beforeAll(async () => {
    await db.region.deleteMany({ where: { slug: REGION_SLUG } })
    await db.user.deleteMany({ where: { id: USER_ID } })
    await db.user.create({
      data: {
        id: USER_ID,
        email: 'vitest-audit-planning@users.openstreetmap.invalid',
        osmId: 1_900_000_020,
        osmName: 'vitest-audit-planning',
      },
    })
    const region = await db.region.create({ data: { slug: REGION_SLUG } })
    regionId = region.id
  })

  afterAll(async () => {
    await db.planningArea.deleteMany({ where: { regionId } })
    await db.region.deleteMany({ where: { slug: REGION_SLUG } })
    await db.user.deleteMany({ where: { id: USER_ID } })
  })

  test('keeps GeoJSON and census figures out of the rows, skips census-only updates', async () => {
    const context = memberFormAuditContext(new Headers(), USER_ID)
    const area = await runWithAuditContextAsync(context, () =>
      db.planningArea.create({
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
      db.planningArea.update({
        where: { id: area.id },
        data: { censusSaettigungEw: 12, censusComputedAt: new Date() },
      }),
    )
    await runWithAuditContextAsync(context, () =>
      db.planningArea.update({
        where: { id: area.id },
        data: {
          studyArea: { ...studyArea, coordinates: [] },
          title: 'Gebiet 2',
          inputUpdatedAt: new Date(),
        },
      }),
    )

    const rows = await auditRowsFor('PlanningArea', area.id)
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

  // createPlanningAreaFn creates the first variant in the same transaction as the area.
  test('logs a variant created through the transaction client', async () => {
    const context = memberFormAuditContext(new Headers(), USER_ID)
    const variant = await runWithAuditContextAsync(context, () =>
      db.$transaction(async (tx) => {
        const area = await tx.planningArea.create({
          data: { regionId, createdById: USER_ID, title: 'Gebiet tx', studyArea },
        })
        return tx.planningVariant.create({
          data: { areaId: area.id, createdById: USER_ID, title: 'Variante 1', factorConfig: {} },
        })
      }),
    )

    const rows = await auditRowsFor('PlanningVariant', variant.id)
    expect(rows.map((row) => row.action)).toEqual(['CREATE'])
    expect(rows[0]?.userId).toBe(USER_ID)
    expect(rows[0]?.metadata).toMatchObject({ changeSource: 'MEMBER_FORM' })
    expect(rows[0]?.newData).toMatchObject({ title: 'Variante 1', areaId: variant.areaId })
  })
})

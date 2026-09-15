import { describe, expect, test } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/client'
import { formatAuditLogUser } from './formatAuditLogUser'

const user = {
  osmName: '95gasann',
  osmId: 12326933,
  firstName: 'Anna' as string | null,
  lastName: 'Muster' as string | null,
  email: 'anna@example.com',
  role: UserRoleEnum.USER,
}

describe('formatAuditLogUser', () => {
  test('prefers first + last name over OSM username', () => {
    expect(formatAuditLogUser({ userId: 'u1', user })).toBe('Anna Muster')
  })

  test('falls back to OSM username when name is empty', () => {
    expect(
      formatAuditLogUser({
        userId: 'u1',
        user: { ...user, firstName: null, lastName: null },
      }),
    ).toBe('95gasann')
  })

  test('returns em dash without userId', () => {
    expect(formatAuditLogUser({ userId: null, user: null })).toBe('—')
  })
})

import { describe, expect, test } from 'vitest'
import { buildUsersAndMembershipsWhere } from './buildUsersAndMembershipsWhere.server'

describe('buildUsersAndMembershipsWhere', () => {
  test('returns no filter for missing or blank queries', () => {
    expect(buildUsersAndMembershipsWhere({})).toEqual({})
    expect(buildUsersAndMembershipsWhere({ q: '   ', regionSlug: ' ' })).toEqual({})
  })

  test('requires every term to match some field, case-insensitively', () => {
    const where = buildUsersAndMembershipsWhere({ q: '  Anna   Müller ' })
    expect(where.AND).toHaveLength(2)
    const [first, second] = where.AND as Array<{ OR: Array<Record<string, unknown>> }>
    expect(first?.OR).toContainEqual({ firstName: { contains: 'Anna', mode: 'insensitive' } })
    expect(second?.OR).toContainEqual({ lastName: { contains: 'Müller', mode: 'insensitive' } })
    expect(second?.OR).toContainEqual({
      memberships: { some: { region: { slug: { contains: 'Müller', mode: 'insensitive' } } } },
    })
  })

  test('limits to members of the region, combined with the search terms', () => {
    expect(buildUsersAndMembershipsWhere({ regionSlug: 'bb' })).toEqual({
      AND: [{ memberships: { some: { region: { slug: 'bb' } } } }],
    })

    const where = buildUsersAndMembershipsWhere({ q: 'anna', regionSlug: 'bb' })
    expect(where.AND).toHaveLength(2)
    expect((where.AND as unknown[])[1]).toEqual({
      memberships: { some: { region: { slug: 'bb' } } },
    })
  })
})

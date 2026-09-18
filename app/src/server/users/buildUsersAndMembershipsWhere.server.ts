import type { Prisma } from '@/prisma/generated/client'
import { usersInRegionWhere } from '@/server/regions/regionScopedWhere'
import { optionalTrimmed, searchTerms } from '@/server/utils/searchString'

type Input = {
  q?: string
  /** `?regionSlug=`: only users with a membership in this region. */
  regionSlug?: string
}

/**
 * `?q=` + `?regionSlug=` filter for the memberships list. `q` matches name, email or membership
 * region slug, case-insensitively. Every whitespace-separated term must match some field, so a full
 * name like „Anna Müller“ finds the user although first and last name are separate columns.
 */
export function buildUsersAndMembershipsWhere({ q, regionSlug }: Input): Prisma.UserWhereInput {
  const terms = searchTerms(q)
  const slug = optionalTrimmed(regionSlug)

  const clauses: Prisma.UserWhereInput[] = terms.map((term) => {
    const contains = { contains: term, mode: 'insensitive' } as const
    return {
      OR: [
        { osmName: contains },
        { firstName: contains },
        { lastName: contains },
        { email: contains },
        { memberships: { some: { region: { slug: contains } } } },
      ],
    }
  })
  if (slug) clauses.push(usersInRegionWhere(slug))

  return clauses.length ? { AND: clauses } : {}
}

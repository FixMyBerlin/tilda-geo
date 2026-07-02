import { UserRoleEnum } from '@/prisma/generated/client'
import { AuthorizationError } from '@/server/auth/errors'
import { getAppSession, requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { forbiddenJson, unauthorizedJson } from './apiJsonResponses.server'

type GuardRegionMembershipInput = {
  headers: Headers
  regionIds: number[]
  responseHeaders?: HeadersInit
}

export async function guardAdmin(headers: Headers, responseHeaders?: HeadersInit) {
  try {
    await requireAdmin(headers)
    return null
  } catch (error) {
    if (!(error instanceof AuthorizationError)) {
      throw error
    }

    if (error.message === 'Not authenticated') {
      return unauthorizedJson({ headers: responseHeaders })
    }

    return forbiddenJson({ headers: responseHeaders })
  }
}

export async function guardRegionMembership(input: GuardRegionMembershipInput) {
  const session = await getAppSession(input.headers)
  if (!session?.userId) {
    return unauthorizedJson({ headers: input.responseHeaders })
  }

  if (session.role === UserRoleEnum.ADMIN) {
    return null
  }

  const membershipExists = !!(await db.membership.count({
    where: {
      userId: session.userId,
      regionId: { in: input.regionIds },
    },
  }))

  if (!membershipExists) {
    return forbiddenJson({ headers: input.responseHeaders })
  }

  return null
}

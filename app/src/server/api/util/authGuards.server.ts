import { RegionStatus, UserRoleEnum } from '@/prisma/generated/client'
import { AuthorizationError } from '@/server/auth/errors'
import { getAppSession, requireAdmin } from '@/server/auth/session.server'
import { checkRegionAuthorization } from '@/server/authorization/checkRegionAuthorization.server'
import db from '@/server/db.server'
import { forbiddenJson, unauthorizedJson } from './apiJsonResponses.server'
import { compareApiKeyTimingSafe } from './checkApiKey.server'

type GuardRegionMembershipInput = {
  headers: Headers
  regionIds: number[]
  responseHeaders?: HeadersInit
}

type ResolveRegionAccessStatusInput = {
  headers: Headers
  regionSlug: string
  apiKey?: string
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

export async function resolveRegionAccessStatus(input: ResolveRegionAccessStatusInput) {
  if (compareApiKeyTimingSafe(input.apiKey)) {
    return 200
  }

  const session = await getAppSession(input.headers)
  const authorization = await checkRegionAuthorization(session, input.regionSlug)
  if (authorization.isAuthorized) {
    return 200
  }

  const region = await db.region.findFirst({
    where: { slug: input.regionSlug },
    select: { status: true },
  })

  if (!region || region.status === RegionStatus.DEACTIVATED) {
    return 404
  }

  return 403
}

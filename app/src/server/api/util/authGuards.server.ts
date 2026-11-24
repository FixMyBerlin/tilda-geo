import { UserRoleEnum } from '@/prisma/generated/client'
import { requireExternalSession } from '@/server/api/auth/osmToken.server'
import { AuthorizationError } from '@/server/auth/errors'
import { getAppSession, requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { forbiddenJson, unauthorizedJson } from './apiJsonResponses.server'
import {
  bearerToken,
  ExternalApiError,
  externalApiErrorResponse,
} from './externalApiResponses.server'

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

async function isAdminOrRegionMember(
  session: { userId: string; role: UserRoleEnum },
  regionIds: number[],
) {
  if (session.role === UserRoleEnum.ADMIN) return true

  return !!(await db.membership.count({
    where: { userId: session.userId, regionId: { in: regionIds } },
  }))
}

export async function guardRegionMembership(input: GuardRegionMembershipInput) {
  const session = await getAppSession(input.headers)
  if (!session?.userId) {
    return unauthorizedJson({ headers: input.responseHeaders })
  }

  if (!(await isAdminOrRegionMember(session, input.regionIds))) {
    return forbiddenJson({ headers: input.responseHeaders })
  }

  return null
}

/** The request brings an `Authorization: Bearer` header, so it is meant to use a token, not the cookie. */
export function hasBearerToken(request: Request) {
  return bearerToken(request) !== null
}

/**
 * Same member rule as `guardRegionMembership`, for a TILDA external API token of scope `uploads`
 * (Bearer, no cookie). Errors are the external API errors (`{ error, message }`), see
 * docs/External-Notes-API.md.
 */
export async function guardRegionMembershipBearer(input: {
  request: Request
  regionIds: number[]
  responseHeaders?: HeadersInit
}) {
  try {
    const { session } = await requireExternalSession(input.request, 'uploads')
    if (!(await isAdminOrRegionMember(session, input.regionIds))) {
      throw new ExternalApiError(403, 'not_member', 'Not a member of a region of this upload')
    }
    return null
  } catch (error) {
    return externalApiErrorResponse(error, input.responseHeaders)
  }
}

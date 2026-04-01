import { UserRoleEnum } from '@prisma/client'
import { auth } from './auth.server'
import { AuthorizationError } from './errors'

type Session = typeof auth.$Infer.Session

export async function getSession(headers: Headers) {
  const result = await auth.api.getSession({ headers })
  // Type assertion needed: Better Auth's getSession return type doesn't perfectly match
  // our Session type (from auth.$Infer.Session), even though customSession plugin ensures
  // role is always present at runtime. The assertion bridges this type gap.
  return result as Session | null
}

export async function getFreshSession(headers: Headers) {
  const result = await auth.api.getSession({
    headers,
    query: {
      disableCookieCache: true,
    },
  })
  // Role/authorization checks should not trust stale cookie-cached session data.
  return result as Session | null
}

export async function getAppSession(headers: Headers) {
  const session = await getSession(headers)
  if (!session) {
    return null
  }
  return {
    userId: session.user.id,
    user: session.user,
    role: session.role,
  }
}

export async function requireAuth(headers: Headers) {
  const session = await getSession(headers)
  if (!session) {
    throw new AuthorizationError('Not authenticated')
  }
  // customSession plugin always returns role (defaults to USER), so it's always present
  return {
    userId: session.user.id,
    user: session.user,
    role: session.role,
  }
}

export async function requireAdmin(headers: Headers) {
  const session = await getFreshSession(headers)
  if (!session) {
    throw new AuthorizationError('Not authenticated')
  }
  if (session.role !== UserRoleEnum.ADMIN) {
    throw new AuthorizationError('Admin access required')
  }
  return {
    userId: session.user.id,
    user: session.user,
    role: session.role,
  }
}

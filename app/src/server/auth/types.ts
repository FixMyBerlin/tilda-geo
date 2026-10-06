import type { UserRoleEnum } from '@/prisma/generated/client'
import type { auth } from './auth.server'

// Use Better Auth's inferred Session type which includes customSession role field
type Session = typeof auth.$Infer.Session

export type AppSession = {
  userId: string
  user: Session['user']
  role: UserRoleEnum
}

/**
 * What the authorization checks read from a session. Also built from an external API token
 * (external notes API), which has no Better Auth session behind it.
 */
export type SessionActor = Pick<AppSession, 'userId' | 'role'>

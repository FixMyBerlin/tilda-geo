import type { UserRoleEnum } from '@/prisma/generated/client'
import type { auth } from './auth.server'

// Use Better Auth's inferred Session type which includes customSession role field
type Session = typeof auth.$Infer.Session

export type AppSession = {
  userId: string
  user: Session['user']
  role: UserRoleEnum
}

export type SessionWithRole = Session & { role: UserRoleEnum }

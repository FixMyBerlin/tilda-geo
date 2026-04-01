import type { User } from '@prisma/client'
import type { CurrentUser } from '@/server/users/queries/getCurrentUser.server'

type Props = (Partial<CurrentUser> | Partial<User>) & {
  firstName?: string | null
  lastName?: string | null
}

export const getFullname = (user: Props) => {
  if (!user) return null

  return [user.firstName, user.lastName].filter(Boolean).join(' ')
}

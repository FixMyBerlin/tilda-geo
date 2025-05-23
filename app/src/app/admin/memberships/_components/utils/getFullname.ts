import { CurrentUser } from '@/src/server/users/queries/getCurrentUser'
import { User } from '@prisma/client'

type Props = (Partial<CurrentUser> | Partial<User>) & {
  firstName?: string | null
  lastName?: string | null
}

export const getFullname = (user: Props) => {
  if (!user) return null

  return [user.firstName, user.lastName].filter(Boolean).join(' ')
}

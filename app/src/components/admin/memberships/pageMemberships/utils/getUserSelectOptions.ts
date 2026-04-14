import { hasContactEmail } from '@/components/shared/utils/osmPlaceholderEmail'
import type { User } from '@/prisma/generated/browser'
import { getFullname } from './getFullname'

export type UserSelectOptions = (Partial<User> & Required<Pick<User, 'id' | 'email'>>)[]

export const getUserSelectOptions = (users: UserSelectOptions) => {
  const result: [number | string, string][] = [['', '(Keine Auswahl)']]
  users.forEach((u) => {
    result.push([
      u.id,
      [`OSM: ${u.osmName}`, getFullname(u), hasContactEmail(u.email) ? u.email : null]
        .filter(Boolean)
        .join(' – '),
    ])
  })
  return result
}

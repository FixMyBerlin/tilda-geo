import { Prettify } from '@/src/app/_components/types/types'
import { User } from '@prisma/client'
import { getFullname } from './getFullname'

export type UserSelectOptions = Prettify<(Partial<User> & Required<Pick<User, 'id' | 'email'>>)[]>

export const getUserSelectOptions = (users: UserSelectOptions) => {
  const result: [number | string, string][] = [['', '(Keine Auswahl)']]
  users.forEach((u) => {
    result.push([u.id, [`OSM: ${u.osmName}`, getFullname(u), u.email].filter(Boolean).join(' – ')])
  })
  return result
}

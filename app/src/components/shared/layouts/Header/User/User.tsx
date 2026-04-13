import { useQuery } from '@tanstack/react-query'
import { currentUserQueryOptions } from '@/server/users/currentUserQueryOptions'
import { RemoveCookie } from './RemoveCookie'
import { UserLoggedIn } from './UserLoggedIn'
import { UserLoggedOut } from './UserLoggedOut'

export const User = () => {
  const { data } = useQuery(currentUserQueryOptions())
  const user = data?.user ?? null
  return (
    <>
      {user ? <UserLoggedIn user={user} /> : <UserLoggedOut />}
      <RemoveCookie />
    </>
  )
}

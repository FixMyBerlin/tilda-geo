import { useQuery } from '@tanstack/react-query'
import { currentUserQueryOptions } from '@/server/users/currentUserQueryOptions'
import { ContactProfilePromptModal } from './ContactProfilePromptModal'
import { RemoveCookie } from './RemoveCookie'
import { UserLoggedIn } from './UserLoggedIn'
import { UserLoggedOut } from './UserLoggedOut'

export const User = () => {
  const { data } = useQuery(currentUserQueryOptions())
  const user = data?.user ?? null
  return (
    <>
      {user ? <UserLoggedIn user={user} /> : <UserLoggedOut />}
      {user ? <ContactProfilePromptModal key={user.id} user={user} /> : null}
      <RemoveCookie />
    </>
  )
}

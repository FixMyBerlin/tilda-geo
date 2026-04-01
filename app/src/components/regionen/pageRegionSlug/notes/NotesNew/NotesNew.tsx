import { authClient } from '@/components/shared/auth/auth-client'
import { NotesNewLoginNotice } from './NotesNewLoginNotice'
import { NotesNewModal } from './NotesNewModal'

type Props = { visible: boolean; title: string; children: React.ReactNode }

export const NotesNew = ({ visible, title, children }: Props) => {
  const { data: session } = authClient.useSession()
  // Check if user has OSM account linked (Better Auth stores this in account)
  const isAuthenticated = Boolean(session?.user)

  if (!visible) return null

  return (
    <NotesNewModal>
      {!isAuthenticated && <NotesNewLoginNotice />}
      {isAuthenticated && (
        <div>
          <h1 className="sr-only">{title}</h1>
          <div className="grid h-full sm:grid-cols-2">{children}</div>
        </div>
      )}
    </NotesNewModal>
  )
}

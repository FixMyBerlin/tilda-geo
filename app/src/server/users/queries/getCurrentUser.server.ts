import { getAppSession } from '@/server/auth/session.server'
import db from '@/server/db.server'

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>

export async function getCurrentUser(headers: Headers) {
  const appSession = await getAppSession(headers)

  if (!appSession?.userId) return null

  const user = await db.user.findFirst({
    where: { id: appSession.userId },
    select: {
      id: true,
      osmId: true,
      osmName: true,
      osmAvatar: true,
      osmDescription: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  })

  return user
}

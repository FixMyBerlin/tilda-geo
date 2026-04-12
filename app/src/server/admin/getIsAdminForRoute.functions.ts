import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { UserRoleEnum } from '@/prisma/generated/client'
import { getFreshSession } from '@/server/auth/session.server'

export const getIsAdminFn = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getFreshSession(getRequestHeaders())
  const isLoggedIn = !!session
  const isAdmin = session?.role === UserRoleEnum.ADMIN
  return { isAdmin, isLoggedIn }
})

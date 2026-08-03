import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { cookieName } from '@/server/auth/cookieName.const'

export const getRedirectCookieFn = createServerFn({ method: 'GET' }).handler(() => {
  const redirectUrl = getCookie(cookieName)
  return { redirectUrl: redirectUrl && redirectUrl !== '/' ? redirectUrl : null }
})

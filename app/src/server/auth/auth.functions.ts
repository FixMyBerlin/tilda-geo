import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { cookieName } from '@/server/auth/cookieName.const'

export const getRedirectCookieFn = createServerFn({ method: 'GET' }).handler(() => {
  const headers = getRequestHeaders()
  const cookies = headers.get('cookie')
  const redirectUrl = cookies
    ?.split(';')
    .find((c) => c.trim().startsWith(`${cookieName}=`))
    ?.split('=')[1]

  return { redirectUrl: redirectUrl && redirectUrl !== '/' ? redirectUrl : null }
})

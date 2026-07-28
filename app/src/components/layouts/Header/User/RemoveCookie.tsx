import Cookies from 'js-cookie'
import { useEffect } from 'react'
import { cookieName } from '@/server/auth/cookieName.const'

export const RemoveCookie = () => {
  useEffect(function removeAuthCookieOnMount() {
    Cookies.remove(cookieName)
  }, [])
  return null
}

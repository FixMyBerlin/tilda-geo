import { useSignInUrl } from '@/components/shared/hooks/useSignInUrl'

export const UserLoggedOut = () => {
  const signInHref = useSignInUrl()

  return (
    <a
      href={signInHref}
      className="inline-flex items-center justify-center rounded-md p-2 text-gray-200 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset sm:ml-6 sm:border sm:border-gray-500"
    >
      Anmelden
    </a>
  )
}

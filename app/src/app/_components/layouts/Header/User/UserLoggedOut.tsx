import { useStartUserLogin } from '@/src/app/_hooks/useStartUserLogin'
// import { UserIcon } from '@heroicons/react/24/outline'

export const UserLoggedOut = () => {
  const handleLogin = useStartUserLogin()

  return (
    <button
      className="inline-flex items-center justify-center rounded-md p-2 text-gray-200 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset sm:ml-6 sm:border sm:border-gray-500"
      onClick={handleLogin}
    >
      {/* <UserIcon className="h-6 w-6" aria-hidden="true" /> */}
      Anmelden
    </button>
  )
}

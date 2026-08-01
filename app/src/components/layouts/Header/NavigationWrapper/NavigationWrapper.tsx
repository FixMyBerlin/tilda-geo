import { twJoin } from 'tailwind-merge'

type Props = { children: React.ReactNode; className?: string }

export const NavigationWrapper = ({ children, className }: Props) => {
  return (
    <nav
      className={twJoin(
        'z-10 w-full bg-gray-800 px-4 shadow-xl sm:px-6 lg:px-8 print:hidden',
        className,
      )}
    >
      {children}
    </nav>
  )
}

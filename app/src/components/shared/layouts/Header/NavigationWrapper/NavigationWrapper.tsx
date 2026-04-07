type Props = { children: React.ReactNode }

export const NavigationWrapper = ({ children }: Props) => {
  return <nav className="z-10 w-full bg-gray-800 px-4 shadow-xl sm:px-6 lg:px-8">{children}</nav>
}

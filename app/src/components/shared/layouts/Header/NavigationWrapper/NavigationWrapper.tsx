type Props = { children: React.ReactNode }

export const NavigationWrapper = ({ children }: Props) => {
  return (
    <nav className="z-10 bg-gray-800 shadow-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </nav>
  )
}

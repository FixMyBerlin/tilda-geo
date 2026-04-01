import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useRouter } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import type { PrimaryNavigationProps } from '../types'
import { User } from '../User/User'

type Props = PrimaryNavigationProps & {
  logo: React.ReactElement
}

export const NavigationMobile = ({ primaryNavigation, secondaryNavigation, logo: Logo }: Props) => {
  const pathname = useRouter().state.location.pathname

  return (
    <Disclosure as="div" className="flex flex-col sm:hidden">
      {({ open }) => (
        <>
          <div className="relative flex min-h-16 items-center justify-between sm:h-16">
            <div className="flex flex-1 items-center justify-start sm:items-stretch">
              <div className="flex flex-1 shrink-0 items-center">{Logo}</div>
            </div>
            <div className="flex items-center space-x-2">
              <User />
              <DisclosureButton className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset">
                <span className="sr-only">Hauptmenü öffnen</span>
                {open ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </DisclosureButton>
            </div>
          </div>

          <DisclosurePanel className="divide-y-2 divide-gray-900">
            <div className="space-y-1 pt-2 pb-3">
              {primaryNavigation.map((item) => {
                if ('to' in item) {
                  const pathWithHash = item.hash ? `${item.to}#${item.hash}` : item.to
                  const current = pathname === item.to
                  return (
                    <DisclosureButton
                      key={item.name}
                      as="a"
                      href={pathWithHash}
                      className={twJoin(
                        current
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                        'block rounded-md px-3 py-2 text-base font-medium',
                      )}
                      aria-current={current ? 'page' : undefined}
                    >
                      {item.name}
                    </DisclosureButton>
                  )
                }
                return (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={twJoin(
                      'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'block rounded-md px-3 py-2 text-base font-medium',
                    )}
                  >
                    {item.name}
                  </DisclosureButton>
                )
              })}
            </div>

            {secondaryNavigation.map((group) => {
              return (
                <div key={group.map((item) => item.to).join(',')} className="space-y-1 pt-2 pb-3">
                  {group.map((item) => {
                    const pathWithHash = item.hash ? `${item.to}#${item.hash}` : item.to
                    const current = pathname === item.to
                    return (
                      <DisclosureButton
                        key={item.name}
                        as="a"
                        href={pathWithHash}
                        className={twJoin(
                          current
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                          'block rounded-md px-3 py-2 text-base font-medium',
                        )}
                        aria-current={current ? 'page' : undefined}
                      >
                        {item.name}
                      </DisclosureButton>
                    )
                  })}
                </div>
              )
            })}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}

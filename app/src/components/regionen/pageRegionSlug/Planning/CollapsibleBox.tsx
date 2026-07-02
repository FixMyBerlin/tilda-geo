import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'

/**
 * Auf-/zuklappbare Box mit Titelzeile. Basis für die nummerierten `WizardStep`s und die
 * Szenarien-Liste, damit beide im Planungspanel identisch aussehen und sich gleich verhalten.
 * `leading` erlaubt ein optionales Element (z.B. die Schritt-Nummer) links vom Titel.
 */
export const CollapsibleBox = ({
  title,
  leading,
  defaultOpen = true,
  children,
}: {
  title: React.ReactNode
  leading?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Disclosure as="div" className="rounded border border-gray-200">
      <DisclosureButton
        as="div"
        onClick={() => setOpen((v) => !v)}
        className={twJoin(
          'flex w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50',
          open ? 'border-b border-gray-200' : '',
        )}
      >
        {leading}
        <span className="flex-1">{title}</span>
        <ChevronRightIcon
          className={twJoin('size-4 text-gray-500 transition-transform', open ? 'rotate-90' : '')}
        />
      </DisclosureButton>

      <Transition
        show={open}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <DisclosurePanel static className="flex flex-col gap-3 p-2.5 text-sm">
          {children}
        </DisclosurePanel>
      </Transition>
    </Disclosure>
  )
}

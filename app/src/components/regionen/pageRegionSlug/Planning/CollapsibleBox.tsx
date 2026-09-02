import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { planningDisclosureBoxClass, planningDisclosureHeaderClass } from './planningPanelStyles'

/**
 * Chevron der Klapp-Boxen. Zugeklappt sitzt er in einem weißen Chip — zusammen mit dem gefüllten
 * Kopf (siehe `planningDisclosureHeaderClass`) ist die Zeile so auch ohne sichtbaren Inhalt klar
 * als aufklappbar zu erkennen.
 */
export const DisclosureChevron = ({ open }: { open: boolean }) => (
  <span
    className={twJoin(
      'flex size-5 shrink-0 items-center justify-center rounded-full transition-colors',
      open ? 'text-gray-500' : 'border border-gray-300 bg-white text-gray-700 shadow-sm',
    )}
  >
    <ChevronRightIcon className={twJoin('size-4 transition-transform', open && 'rotate-90')} />
  </span>
)

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
    <Disclosure as="div" className={planningDisclosureBoxClass(open)}>
      <DisclosureButton
        as="div"
        onClick={() => setOpen((v) => !v)}
        className={planningDisclosureHeaderClass(open)}
      >
        {leading}
        <span className="flex-1">{title}</span>
        <DisclosureChevron open={open} />
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

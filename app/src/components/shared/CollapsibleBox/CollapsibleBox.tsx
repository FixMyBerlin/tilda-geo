import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { collapsibleBoxClass, collapsibleBoxHeaderClass } from './collapsibleBoxStyles'

/**
 * Chevron of the collapsible boxes. Collapsed, it sits in a white chip — together with the filled
 * header (see `collapsibleBoxHeaderClass`) the row is clearly expandable even without visible
 * content.
 */
export const CollapsibleBoxChevron = ({ open }: { open: boolean }) => (
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
 * Collapsible box with a title row. Base for the Flächenfinder sections, so they look and behave
 * the same in the planning panel.
 */
export const CollapsibleBox = ({
  title,
  defaultOpen = true,
  onOpenChange,
  children,
}: {
  title: React.ReactNode
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Disclosure as="div" className={collapsibleBoxClass(open)}>
      <DisclosureButton
        onClick={() => {
          setOpen(!open)
          onOpenChange?.(!open)
        }}
        className={collapsibleBoxHeaderClass(open)}
      >
        <span className="flex-1">{title}</span>
        <CollapsibleBoxChevron open={open} />
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

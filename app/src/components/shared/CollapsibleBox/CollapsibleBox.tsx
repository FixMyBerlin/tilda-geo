import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { useState } from 'react'
import { DisclosureChevron } from '@/components/shared/DisclosureChevron/DisclosureChevron'
import { collapsibleBoxClass, collapsibleBoxHeaderClass } from './collapsibleBoxStyles'

/** Chevron of the collapsible boxes — the shared TILDA disclosure chevron at the row's end. */
export const CollapsibleBoxChevron = ({ open }: { open: boolean }) => (
  <DisclosureChevron open={open} side="trailing" className="size-5 text-gray-500" />
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

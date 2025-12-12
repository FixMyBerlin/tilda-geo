import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { InformationCircleIcon as InformationCircleIconOutline } from '@heroicons/react/24/outline'
import { InformationCircleIcon } from '@heroicons/react/24/solid'

export const ValueDisclosure = ({ children }: { children: React.ReactNode }) => {
  return (
    <Disclosure>
      {({ open }) => (
        <div
          className={
            // We could just use the plugin from https://headlessui.com/react/disclosure#using-data-attributes
            // But I didn't want to add another dependency just for this one time…
            open
              ? '[&_[data-active-icon=closed]]:hidden [&_[data-active-icon=open]]:block'
              : '[&_[data-active-icon=closed]]:block [&_[data-active-icon=open]]:hidden'
          }
        >
          {children}
        </div>
      )}
    </Disclosure>
  )
}

export const ValueDisclosureButton = ({
  children,
  hasBody,
}: {
  children: React.ReactNode
  /** @description use to hide the button conditionally */
  hasBody?: boolean
}) => {
  if (hasBody === false) return <div className="w-full">{children}</div>

  return (
    <DisclosureButton className="group/button flex w-full items-center justify-between gap-1 text-left">
      <div className="w-full">{children}</div>
      <div className="-m-0.5 rounded border border-transparent bg-gray-50 p-0.5 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75 group-hover/button:border-gray-500 group-hover/button:bg-yellow-100">
        <InformationCircleIcon
          data-active-icon="open" // see ValueDisclosure
          className="hidden size-5"
          title="Hinweise anzeigen…"
        />
        <InformationCircleIconOutline
          data-active-icon="closed" // see ValueDisclosure
          className="hidden size-5"
          title="Hinweise anzeigen…"
        />
      </div>
    </DisclosureButton>
  )
}

export const ValueDisclosurePanel = ({ children }: { children: React.ReactNode }) => {
  return (
    <DisclosurePanel className="mt-0.5 text-xs leading-tight text-gray-400 [&>p]:mt-1 [&>p]:first:mt-0">
      {children}
    </DisclosurePanel>
  )
}

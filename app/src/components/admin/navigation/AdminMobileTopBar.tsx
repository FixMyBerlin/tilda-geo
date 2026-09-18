import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { AdminBrand } from './AdminBrand'
import { AdminSidebar } from './AdminSidebar'

/** Below `lg`: sticky bar (`h-14`, sticky asides offset by `top-14`) + sidebar as drawer. */
export const AdminMobileTopBar = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-4 bg-gray-800 px-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-m-2.5 p-2.5 text-gray-300 hover:text-white"
        >
          <span className="sr-only">Admin-Navigation öffnen</span>
          <Bars3Icon aria-hidden="true" className="size-6" />
        </button>
        <AdminBrand />
      </div>

      <Dialog open={open} onClose={setOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <div className="absolute top-0 left-full flex w-16 justify-center pt-5">
              <button type="button" onClick={() => setOpen(false)} className="-m-2.5 p-2.5">
                <span className="sr-only">Admin-Navigation schließen</span>
                <XMarkIcon aria-hidden="true" className="size-6 text-white" />
              </button>
            </div>
            <AdminSidebar onNavigate={() => setOpen(false)} />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

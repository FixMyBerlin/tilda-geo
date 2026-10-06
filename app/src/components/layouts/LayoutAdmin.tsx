import { Outlet } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import { adminPagePaddingClassName, adminPageWidthClassName } from '@/components/admin/adminClasses'
import { AdminMobileTopBar } from '@/components/admin/navigation/AdminMobileTopBar'
import { AdminSidebar } from '@/components/admin/navigation/AdminSidebar'

/** Admin shell — dark sidebar from `lg`, mobile top bar + drawer below. `LayoutRoot` hides the public header/footer. */
export function LayoutAdmin() {
  return (
    <div className="flex min-h-dvh w-full min-w-0 bg-gray-50">
      <div className="sticky top-0 hidden h-dvh w-72 shrink-0 lg:flex">
        <AdminSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileTopBar />
        <main className={twJoin('flex-1 text-gray-900', adminPagePaddingClassName)}>
          <div className={adminPageWidthClassName}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

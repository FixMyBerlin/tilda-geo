import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import {
  adminAsideClassName,
  adminAsideLayoutClassName,
  adminAsideMainClassName,
  adminAsideMobileBarClassName,
  adminCardClassName,
} from '@/components/admin/adminClasses'
import { AdminAsideJumpList } from './AdminAsideJumpList'
import { type AdminAsideSection, AdminAsideVariantContext } from './adminAsideSection'
import { useActiveSectionId } from './useActiveSectionId'

type Props = {
  /** Jump list entries in page order; hidden below two sections. */
  sections: AdminAsideSection[]
  /** `AdminFormAsideActions` (inside a `<form>`) or `AdminAsideActions`; rendered for desktop and mobile. */
  actions: ReactNode
  /** `AdminFormSection`s with ids matching `sections`. */
  children: ReactNode
}

/**
 * New / edit / detail page frame: content column + sticky aside (jump list + actions) from `lg`,
 * sticky bar below `AdminMobileTopBar` on smaller screens. Wrap it in the `<form>` on form pages.
 */
export const AdminAsideLayout = ({ sections, actions, children }: Props) => {
  const { activeId, jumpToSection } = useActiveSectionId(sections.map((section) => section.id))
  const showJumpList = sections.length >= 2

  return (
    <div>
      <div
        className={twJoin(
          adminAsideMobileBarClassName,
          '-mx-4 -mt-2 mb-6 flex items-center gap-2 border-y border-gray-200 bg-gray-50 px-4 py-2 sm:-mx-6 sm:px-6',
        )}
      >
        {showJumpList ? (
          <AdminAsideJumpList
            variant="chips"
            sections={sections}
            activeId={activeId}
            onJump={jumpToSection}
          />
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex shrink-0 items-center gap-2">
          <AdminAsideVariantContext value="mobile">{actions}</AdminAsideVariantContext>
        </div>
      </div>

      <div className={adminAsideLayoutClassName}>
        <div className={adminAsideMainClassName}>{children}</div>
        <aside
          aria-label="Abschnitte und Aktionen"
          className={twJoin(adminAsideClassName, 'max-h-[calc(100dvh-3rem)]')}
        >
          {showJumpList ? (
            <div className="min-h-0 overflow-y-auto p-px">
              <h2 className="px-3 pb-2 text-xs font-semibold text-gray-500">Abschnitte</h2>
              <AdminAsideJumpList
                variant="list"
                sections={sections}
                activeId={activeId}
                onJump={jumpToSection}
              />
            </div>
          ) : null}
          <div className={twJoin(adminCardClassName, 'shrink-0 p-4')}>{actions}</div>
        </aside>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import {
  adminCardClassName,
  adminFormSectionScrollMarginClassName,
} from '@/components/admin/adminClasses'
import { adminSectionDataAttribute } from './adminAsideSection'

type Props = {
  /** DOM id + URL hash; must match the `AdminAsideLayout` section id. */
  id: string
  title: string
  description?: ReactNode
  /** Small header action on the right (e.g. “Vollständiger Verlauf”). */
  action?: ReactNode
  children: ReactNode
}

/** Card section on new / edit / detail pages; the jump target for `AdminAsideLayout`. */
export const AdminFormSection = ({ id, title, description, action, children }: Props) => {
  const titleId = `${id}-title`

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      {...{ [adminSectionDataAttribute]: '' }}
      className={twJoin(adminCardClassName, adminFormSectionScrollMarginClassName, 'p-4 sm:p-6')}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base/7 font-semibold text-gray-900">
            {title}
          </h2>
          {description ? <div className="mt-1 text-sm/6 text-gray-600">{description}</div> : null}
        </div>
        {action ? <div className="shrink-0 text-sm">{action}</div> : null}
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  )
}

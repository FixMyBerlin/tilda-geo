import { ArrowUturnLeftIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { adminAsideIconButtonClassName } from '@/components/admin/adminClasses'
import { Link } from '@/components/shared/links/Link'
import { buttonStylesSecondary } from '@/components/shared/links/styles'
import { type AdminLinkTarget } from './AdminAsideActions'
import { useAdminAsideVariant } from './adminAsideSection'

type Props = AdminLinkTarget & {
  /** “Zur Liste” / “Zur Übersicht” — matches the parent list this page belongs to. */
  label: string
}

/**
 * Primary aside action on form-less detail pages: back to the parent list. Pass as `primary` to
 * `AdminAsideActions`. Secondary button style on desktop; icon-only so it fits the mobile bar.
 */
export const AdminAsideBackLink = ({ label, ...target }: Props) => {
  const variant = useAdminAsideVariant()

  if (variant !== 'desktop') {
    return (
      <Link {...target} classNameOverwrite={adminAsideIconButtonClassName}>
        <ArrowUturnLeftIcon aria-hidden="true" className="size-5" />
        <span className="sr-only">{label}</span>
      </Link>
    )
  }

  return (
    <Link {...target} classNameOverwrite={twJoin(buttonStylesSecondary, 'w-full gap-x-1.5')}>
      <ArrowUturnLeftIcon aria-hidden="true" className="size-4 shrink-0 text-gray-500" />
      {label}
    </Link>
  )
}

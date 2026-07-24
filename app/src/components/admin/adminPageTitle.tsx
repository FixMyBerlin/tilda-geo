import { EyeIcon, PencilSquareIcon, PlusCircleIcon } from '@heroicons/react/20/solid'
import type { ComponentType, ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { Link, type LinkProps } from '@/components/shared/links/Link'
import { Quote } from '@/components/shared/text/Quotes'

type AdminActionLinkProps = Omit<LinkProps, 'children'> & { children?: ReactNode }

export const adminPageTitleClassName = 'flex items-center gap-2 text-2xl font-bold text-gray-900'

const adminPageTitleIconClassName = 'size-6 shrink-0 text-gray-800'
const adminBreadcrumbIconClassName = 'size-5 shrink-0'

type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

type AdminPageTitleLabelProps = {
  icon: IconComponent
  children: ReactNode
  variant?: 'page' | 'breadcrumb'
}

const AdminPageTitleLabel = ({
  icon: Icon,
  children,
  variant = 'page',
}: AdminPageTitleLabelProps) => (
  <span className="inline-flex items-center gap-1.5">
    <Icon
      className={
        variant === 'breadcrumb' ? adminBreadcrumbIconClassName : adminPageTitleIconClassName
      }
      aria-hidden
    />
    {children}
  </span>
)

export const AdminPageTitleNewLabel = ({
  label,
  variant,
}: {
  label: string
  variant?: 'page' | 'breadcrumb'
}) => (
  <AdminPageTitleLabel icon={PlusCircleIcon} variant={variant}>
    {label}
  </AdminPageTitleLabel>
)

export const AdminPageTitleEditLabel = ({
  name,
  variant,
}: {
  name: string
  variant?: 'page' | 'breadcrumb'
}) => (
  <AdminPageTitleLabel icon={PencilSquareIcon} variant={variant}>
    <Quote>{name}</Quote> bearbeiten
  </AdminPageTitleLabel>
)

export const AdminPageTitleViewLabel = ({
  name,
  variant,
}: {
  name: string
  variant?: 'page' | 'breadcrumb'
}) => (
  <AdminPageTitleLabel icon={EyeIcon} variant={variant}>
    <Quote>{name}</Quote> anzeigen
  </AdminPageTitleLabel>
)

export const AdminPageTitleNew = ({ label }: { label: string }) => (
  <h1 className={adminPageTitleClassName}>
    <AdminPageTitleNewLabel label={label} />
  </h1>
)

export const AdminPageTitleEdit = ({ name }: { name: string }) => (
  <h1 className={adminPageTitleClassName}>
    <AdminPageTitleEditLabel name={name} />
  </h1>
)

export const AdminPageTitleView = ({ name }: { name: string }) => (
  <h1 className={adminPageTitleClassName}>
    <AdminPageTitleViewLabel name={name} />
  </h1>
)

const adminTableActionLinkClassName = 'inline-flex items-center gap-1'

export const AdminEditActionLink = ({
  className,
  children = 'bearbeiten',
  ...props
}: AdminActionLinkProps) => (
  <Link {...(props as LinkProps)} className={twJoin(adminTableActionLinkClassName, className)}>
    <PencilSquareIcon className="size-4 shrink-0" aria-hidden />
    {children}
  </Link>
)

export const AdminViewActionLink = ({
  className,
  children = 'anzeigen',
  ...props
}: AdminActionLinkProps) => (
  <Link {...(props as LinkProps)} className={twJoin(adminTableActionLinkClassName, className)}>
    <EyeIcon className="size-4 shrink-0" aria-hidden />
    {children}
  </Link>
)

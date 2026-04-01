import type { LinkOptions } from '@tanstack/react-router'
import { Link as RouterLink } from '@tanstack/react-router'
import type React from 'react'
import { twMerge } from 'tailwind-merge'
import type { Router } from '@/router'
import { buttonStyles, linkStyles } from './styles'

type CommonLinkProps = {
  className?: string
  classNameOverwrite?: string
  blank?: boolean
  button?: boolean
  children: React.ReactNode
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'>

type InternalLinkProps = CommonLinkProps & {
  to: LinkOptions<Router>['to']
  params?: LinkOptions<Router>['params']
  search?: LinkOptions<Router>['search']
  hash?: LinkOptions<Router>['hash']
  href?: never
}

type ExternalLinkProps = CommonLinkProps & {
  href: string
  to?: never
  params?: never
  search?: never
  hash?: never
}

export type LinkProps = InternalLinkProps | ExternalLinkProps

function isExternal(props: LinkProps): props is ExternalLinkProps {
  return 'href' in props && props.href != null
}

export const Link = ({
  className,
  classNameOverwrite,
  blank = false,
  button = false,
  children,
  ...rest
}: LinkProps) => {
  const classNames = twMerge(classNameOverwrite || (button ? buttonStyles : linkStyles), className)

  if (isExternal({ ...rest, className, classNameOverwrite, blank, button, children })) {
    return (
      <a
        href={rest.href}
        className={classNames}
        target={blank ? '_blank' : undefined}
        rel={blank ? 'noopener noreferrer' : undefined}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <RouterLink
      to={rest.to}
      params={rest.params}
      search={rest.search}
      hash={rest.hash}
      className={classNames}
      target={blank ? '_blank' : undefined}
      {...rest}
    >
      {children}
    </RouterLink>
  )
}

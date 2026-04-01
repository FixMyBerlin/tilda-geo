import type React from 'react'
import { twMerge } from 'tailwind-merge'
import { buttonStyles, linkStyles } from './styles'

type Props = {
  className?: string
  classNameOverwrite?: string
  mailto?: string
  subject?: string
  body?: string
  button?: boolean
  children: React.ReactNode
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

export const LinkMail = ({
  className,
  classNameOverwrite,
  mailto,
  subject,
  body,
  button,
  children,
  ...props
}: Props) => {
  const classNames = twMerge(className, classNameOverwrite || (button ? buttonStyles : linkStyles))

  const url = new URL(`mailto:${mailto || children}`)
  if (subject) {
    url.searchParams.append('subject', subject)
  }
  if (body) {
    url.searchParams.append('body', body)
  }

  return (
    <a href={url.href} className={classNames} {...props}>
      {children}
    </a>
  )
}

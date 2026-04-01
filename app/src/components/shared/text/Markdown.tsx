import type { LinkOptions } from '@tanstack/react-router'
import type { ComponentPropsWithoutRef } from 'react'
import { Remark } from 'react-remark'
import { twMerge } from 'tailwind-merge'
import type { Router } from '@/router'
import { Link } from '../links/Link'
import { proseClasses } from './prose'

type Props = {
  markdown?: string | null
  className?: string
}

const MdH1 = (props: ComponentPropsWithoutRef<'h1'>) => (
  <p className="text-base">
    <strong {...props} />
  </p>
)
const MdH2 = (props: ComponentPropsWithoutRef<'h2'>) => (
  <p className="text-sm">
    <strong {...props} />
  </p>
)
const MdH3 = (props: ComponentPropsWithoutRef<'h3'>) => (
  <p className="text-sm">
    <strong {...props} />
  </p>
)
const MdH4 = (props: ComponentPropsWithoutRef<'h4'>) => (
  <p className="text-sm">
    <strong {...props} />
  </p>
)
const MdH5 = (props: ComponentPropsWithoutRef<'h5'>) => (
  <p className="text-sm">
    <strong {...props} />
  </p>
)
const MdH6 = (props: ComponentPropsWithoutRef<'h6'>) => (
  <p className="text-sm">
    <strong {...props} />
  </p>
)
const MdA = (props: ComponentPropsWithoutRef<'a'>) => {
  const { href, children, ...anchorProps } = props
  if (!href) return null
  const isExternal = href?.startsWith('http')
  if (isExternal) {
    return (
      <Link blank href={href} {...anchorProps}>
        {children}
      </Link>
    )
  }
  return (
    <Link {...anchorProps} to={href as LinkOptions<Router>['to']}>
      {children}
    </Link>
  )
}
const MdHr = (props: ComponentPropsWithoutRef<'hr'>) => <hr className="my-2" {...props} />

const components = {
  h1: MdH1,
  h2: MdH2,
  h3: MdH3,
  h4: MdH4,
  h5: MdH5,
  h6: MdH6,
  a: MdA,
  hr: MdHr,
}

export const Markdown = ({ markdown, className }: Props) => {
  if (!markdown) return null

  // Process newlines: convert single newlines to line breaks
  const processedMarkdown = markdown.replace(/\n(?!\n)/g, '  \n')

  return (
    <div className={twMerge(proseClasses, className)}>
      <Remark
        remarkToRehypeOptions={{ allowDangerousHtml: true }}
        rehypeReactOptions={{ components }}
      >
        {processedMarkdown}
      </Remark>
    </div>
  )
}

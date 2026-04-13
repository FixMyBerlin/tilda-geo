import type { LinkOptions } from '@tanstack/react-router'
import type { ComponentPropsWithoutRef } from 'react'
import type { ExtraProps } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { twMerge } from 'tailwind-merge'
import type { Router } from '@/router'
import { Link } from '../links/Link'
import { proseClasses } from './prose'

type Props = {
  markdown?: string | null
  className?: string
}

type HeadingMdProps = ComponentPropsWithoutRef<'h1'> & ExtraProps

const MdH1 = ({ node: _node, ...props }: HeadingMdProps) => (
  <p className="text-base">
    <strong {...props} />
  </p>
)
const MdH2 = ({ node: _node, ...props }: HeadingMdProps) => (
  <p className="text-sm">
    <strong {...props} />
  </p>
)
const MdH3 = ({ node: _node, ...props }: HeadingMdProps) => (
  <p className="text-sm">
    <strong {...props} />
  </p>
)
const MdH4 = ({ node: _node, ...props }: HeadingMdProps) => (
  <p className="text-sm">
    <strong {...props} />
  </p>
)
const MdH5 = ({ node: _node, ...props }: HeadingMdProps) => (
  <p className="text-sm">
    <strong {...props} />
  </p>
)
const MdH6 = ({ node: _node, ...props }: HeadingMdProps) => (
  <p className="text-sm">
    <strong {...props} />
  </p>
)

type AnchorMdProps = ComponentPropsWithoutRef<'a'> & ExtraProps

const MdA = ({ node: _node, href, children, ...anchorProps }: AnchorMdProps) => {
  if (!href) return null
  const isExternal = href.startsWith('http')
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

type HrMdProps = ComponentPropsWithoutRef<'hr'> & ExtraProps

const MdHr = ({ node: _node, ...props }: HrMdProps) => <hr className="my-2" {...props} />

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

  return (
    <div className={twMerge(proseClasses, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

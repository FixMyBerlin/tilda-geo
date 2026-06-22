import type { LinkOptions } from '@tanstack/react-router'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Children, isValidElement, useMemo } from 'react'
import type { ExtraProps } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import slugify from 'slugify'
import { twMerge } from 'tailwind-merge'
import type { Router } from '@/router'
import { Link } from '../links/Link'
import { DocumentHeading } from './DocumentHeading'
import { proseClasses } from './prose'

type HeadingStyle = 'compact' | 'document'

type Props = {
  markdown?: string | null
  className?: string
  /** `compact`: inline/table use — headings as small bold paragraphs. `document`: semantic headings for docs chapters. */
  headingStyle?: HeadingStyle
  /** Shifts markdown heading levels (e.g. `1` maps `##` → `h3` when the page already has an `h2` chapter title). */
  headingLevelOffset?: number
  /** Prefix for generated heading `id`s (e.g. chapter id) so subsections are linkable via URL hash. */
  headingIdPrefix?: string
}

type HeadingMdProps = ComponentPropsWithoutRef<'h1'> & ExtraProps

type HeadingTagName = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

const clampHeadingLevel = (level: number, offset: number): HeadingTagName => {
  const shifted = level + offset
  if (shifted <= 1) return 'h1'
  if (shifted >= 6) return 'h6'
  return `h${shifted}` as HeadingTagName
}

const createCompactHeading =
  (textClassName: string) =>
  ({ node: _node, ...props }: HeadingMdProps) => (
    <p className={textClassName}>
      <strong {...props} />
    </p>
  )

const MdH1 = createCompactHeading('text-base')
const MdH2 = createCompactHeading('text-sm')
const MdH3 = createCompactHeading('text-sm')
const MdH4 = createCompactHeading('text-sm')
const MdH5 = createCompactHeading('text-sm')
const MdH6 = createCompactHeading('text-sm')

type HeadingIdRegistry = Map<string, number>

const getNodeText = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children)
  }
  return Children.toArray(node).map(getNodeText).join('')
}

const toHeadingSlug = (text: string) =>
  slugify(text.trim(), { lower: true, strict: true, locale: 'de' }) || 'section'

const resolveHeadingId = (
  headingText: string,
  idPrefix: string | undefined,
  registry: HeadingIdRegistry,
) => {
  const slug = toHeadingSlug(headingText)
  const base = idPrefix ? `${idPrefix}--${slug}` : slug
  const count = registry.get(base) ?? 0
  registry.set(base, count + 1)
  return count === 0 ? base : `${base}-${count + 1}`
}

const createDocumentHeading =
  (
    level: 1 | 2 | 3 | 4 | 5 | 6,
    offset: number,
    idRegistry: HeadingIdRegistry,
    idPrefix?: string,
  ) =>
  ({ node: _node, children, ...props }: HeadingMdProps) => {
    const id = resolveHeadingId(getNodeText(children), idPrefix, idRegistry)
    return (
      <DocumentHeading as={clampHeadingLevel(level, offset)} id={id} {...props}>
        {children}
      </DocumentHeading>
    )
  }

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

const compactMarkdownComponents = {
  h1: MdH1,
  h2: MdH2,
  h3: MdH3,
  h4: MdH4,
  h5: MdH5,
  h6: MdH6,
  a: MdA,
  hr: MdHr,
}

const createDocumentMarkdownComponents = (
  headingLevelOffset: number,
  idRegistry: HeadingIdRegistry,
  headingIdPrefix?: string,
) => ({
  h1: createDocumentHeading(1, headingLevelOffset, idRegistry, headingIdPrefix),
  h2: createDocumentHeading(2, headingLevelOffset, idRegistry, headingIdPrefix),
  h3: createDocumentHeading(3, headingLevelOffset, idRegistry, headingIdPrefix),
  h4: createDocumentHeading(4, headingLevelOffset, idRegistry, headingIdPrefix),
  h5: createDocumentHeading(5, headingLevelOffset, idRegistry, headingIdPrefix),
  h6: createDocumentHeading(6, headingLevelOffset, idRegistry, headingIdPrefix),
  a: MdA,
  hr: MdHr,
})

export const Markdown = ({
  markdown,
  className,
  headingStyle = 'compact',
  headingLevelOffset = 0,
  headingIdPrefix,
}: Props) => {
  const components = useMemo(() => {
    if (headingStyle !== 'document') return compactMarkdownComponents
    const idRegistry: HeadingIdRegistry = new Map()
    return createDocumentMarkdownComponents(headingLevelOffset, idRegistry, headingIdPrefix)
  }, [headingStyle, headingLevelOffset, headingIdPrefix])

  if (!markdown) return null

  return (
    <div className={twMerge(proseClasses, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

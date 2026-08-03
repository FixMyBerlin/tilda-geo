import { Link } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import { defaultSecondaryNavigationGrouped } from '@/components/layouts/Header/HeaderRegionen/navigation.const'
import type { PrimaryNavigation, SecondaryNavigation } from '@/components/layouts/Header/types'

const headerNavLinkClassName =
  'text-sm font-medium text-gray-300 underline-offset-4 hover:text-white hover:underline'

const navRowClassName = 'flex flex-wrap items-center justify-end gap-x-6 gap-y-2'

type Props = {
  className?: string
  linkClassName?: string
  regionItems?: PrimaryNavigation[]
  /** Global links (Feedback, Datenschutz, …). Defaults to true when `regionItems` is omitted. */
  includeSecondaryLinks?: boolean
  /** `stacked` = secondary row above region row (mobile). Default single combined row. */
  layout?: 'row' | 'stacked'
}

const RegionWelcomeNavLink = ({
  item,
  linkClassName,
}: {
  item: PrimaryNavigation | SecondaryNavigation
  linkClassName: string
}) =>
  'href' in item ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
      {item.name}
    </a>
  ) : (
    <Link to={item.to} hash={item.hash} className={linkClassName}>
      {item.name}
    </Link>
  )

const RegionWelcomeNavLinkRow = ({
  items,
  linkClassName,
  className,
}: {
  items: Array<PrimaryNavigation | SecondaryNavigation>
  linkClassName: string
  className?: string
}) => (
  <div className={twJoin(navRowClassName, className)}>
    {items.map((item) => (
      <RegionWelcomeNavLink
        key={`${item.name}-${'href' in item ? item.href : item.to}`}
        item={item}
        linkClassName={linkClassName}
      />
    ))}
  </div>
)

export const RegionWelcomeNavLinks = ({
  className,
  linkClassName = headerNavLinkClassName,
  regionItems,
  includeSecondaryLinks = regionItems === undefined,
  layout = 'row',
}: Props) => {
  const secondaryItems = includeSecondaryLinks ? defaultSecondaryNavigationGrouped.flat() : []
  const regionLinks = regionItems ?? []
  if (secondaryItems.length === 0 && regionLinks.length === 0) return null

  if (layout === 'stacked') {
    return (
      <nav className={twJoin('flex flex-col gap-y-2', className)} aria-label="Weitere Links">
        {secondaryItems.length > 0 ? (
          <RegionWelcomeNavLinkRow items={secondaryItems} linkClassName={linkClassName} />
        ) : null}
        {regionLinks.length > 0 ? (
          <RegionWelcomeNavLinkRow items={regionLinks} linkClassName={linkClassName} />
        ) : null}
      </nav>
    )
  }

  return (
    <nav aria-label="Weitere Links">
      <RegionWelcomeNavLinkRow
        items={[...secondaryItems, ...regionLinks]}
        linkClassName={linkClassName}
        className={className}
      />
    </nav>
  )
}

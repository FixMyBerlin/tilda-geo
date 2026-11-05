import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { DisclosureChevron } from '@/components/shared/DisclosureChevron/DisclosureChevron'
import { MotionCollapse } from '@/components/shared/motion/MotionCollapse'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import {
  modePanelCollectionClassName,
  modePanelHeaderBarClassName,
  modePanelListHeaderActionsClassName,
  modePanelTitleClassName,
} from './modePanel.const'

/** The panel header is the page's `h1`; a second header row below it uses `h2`. */
type HeadingLevel = 'h1' | 'h2'

type ModePanelListHeadingProps = {
  title: string
  subtitle?: ReactNode
  mutedClassName: string
  headingLevel?: HeadingLevel
}

export const ModePanelListHeading = ({
  title,
  subtitle,
  mutedClassName,
  headingLevel: Heading = 'h1',
}: ModePanelListHeadingProps) => {
  const tooltip = subtitle ? `${title} — ${subtitle}` : title
  return (
    <Tooltip text={tooltip} className="max-w-full min-w-0">
      <div className="flex min-w-0 flex-col justify-center gap-0 leading-tight">
        <Heading
          className={twJoin(modePanelTitleClassName, 'min-w-0 truncate leading-tight text-inherit')}
        >
          {title}
        </Heading>
        {subtitle ? (
          <div className={twJoin('min-w-0 truncate text-xs leading-4', mutedClassName)}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </Tooltip>
  )
}

type Props = {
  /** Leading icon of the bar (mode icon in the panel header). */
  icon: ReactNode
  title: string
  subtitle?: ReactNode
  mutedClassName: string
  /** Body that opens below the bar and pushes the rest of the panel down. */
  collection: ReactNode
  actions?: ReactNode
  headingLevel?: HeadingLevel
}

/**
 * Header bar that discloses a collection picker below it: the mode panel's Ordner/Listen/Gebiete
 * header, and any second level that should look and behave the same (Flächenfinder Varianten).
 * Colours come from the surrounding element.
 */
export const ModePanelCollectionDisclosure = ({
  icon,
  title,
  subtitle,
  mutedClassName,
  collection,
  actions,
  headingLevel,
}: Props) => (
  <Disclosure as="div">
    {({ open }) => (
      <>
        <div className="flex items-stretch">
          <DisclosureButton
            className={twJoin(
              modePanelHeaderBarClassName,
              'grow justify-between text-left hover:bg-white/10 focus:outline-none focus-visible:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset',
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              {icon}
              <ModePanelListHeading
                title={title}
                subtitle={subtitle}
                mutedClassName={mutedClassName}
                headingLevel={headingLevel}
              />
            </div>
            <DisclosureChevron open={open} side="trailing" className="size-5" />
          </DisclosureButton>
          {actions && <div className={modePanelListHeaderActionsClassName}>{actions}</div>}
        </div>
        <MotionCollapse open={open}>
          <DisclosurePanel static className={modePanelCollectionClassName}>
            {collection}
          </DisclosurePanel>
        </MotionCollapse>
      </>
    )}
  </Disclosure>
)

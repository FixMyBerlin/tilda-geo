import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ArrowLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { MotionCollapse } from '@/components/shared/motion/MotionCollapse'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { PanelResizeHandle } from '../PanelResizeHandle'
import {
  modeAccentInvertedClassName,
  modeAccentInvertedFgClassName,
  modeAccentInvertedMutedClassName,
  modeAccentStyle,
  modeIdentity,
} from './modeIdentity'
import {
  modePanelBackButtonClassName,
  modePanelClassName,
  modePanelCollectionClassName,
  modePanelFooterClassName,
  modePanelHeaderBarClassName,
  modePanelListHeaderActionsClassName,
  modePanelScrollClassName,
  modePanelSectionClassName,
  modePanelTitleClassName,
} from './modePanel.const'
import { useCurrentMode } from './useCurrentMode'
import { useListHoverMarkerPosition } from './useListHoverMarkerPosition'
import { useResizableModePanelWidth } from './useResizableModePanelWidth'

type ModePanelDetail = {
  title: string
  onBack: () => void
  children: ReactNode
}

type ModePanelListHeading = {
  title: string
  subtitle?: ReactNode
  mutedClassName: string
}

const ModePanelListHeading = ({ title, subtitle, mutedClassName }: ModePanelListHeading) => {
  const tooltip = subtitle ? `${title} — ${subtitle}` : title
  return (
    <Tooltip text={tooltip} className="max-w-full min-w-0">
      <div className="flex min-w-0 items-baseline gap-2">
        <h1 className={twJoin(modePanelTitleClassName, 'min-w-0 truncate text-inherit')}>
          {title}
        </h1>
        {subtitle ? (
          <div className={twJoin('min-w-0 truncate text-xs', mutedClassName)}>{subtitle}</div>
        ) : null}
      </div>
    </Tooltip>
  )
}

type Props = {
  title: string
  subtitle?: ReactNode
  /** Collection picker body. Hidden in detail view. Header click discloses it and pushes the filter/list down. */
  collection?: ReactNode
  /** Keep the collection picker visible and non-collapsible (e.g. no Prüfliste exists yet). */
  collectionAlwaysOpen?: boolean
  filter?: ReactNode
  actions?: ReactNode
  detail?: ModePanelDetail
  children: ReactNode
}

/**
 * Right-hand data panel for mode routes. Rendered into the region layout `<Outlet/>` beside the
 * map: heading (disclosure trigger when a collection is set), optional collection body, filter bar,
 * then a scrollable list — or a detail view with a back button when `detail` is set. List mode
 * shows an outside-viewport footer while a hovered item is clamped to the map edge.
 */
export const ModePanel = ({
  title,
  subtitle,
  collection,
  collectionAlwaysOpen = false,
  filter,
  actions,
  detail,
  children,
}: Props) => {
  const currentMode = useCurrentMode()
  const identity = modeIdentity[currentMode]
  const Icon = identity.icon
  const isDesktop = useBreakpoint('sm')
  const { panelRef, onResizeHandlePointerDown } = useResizableModePanelWidth({
    enabled: isDesktop,
  })
  const isDetail = detail !== undefined
  const hoverMarkerPosition = useListHoverMarkerPosition()
  const showOutsideFooter = !isDetail && hoverMarkerPosition?.atEdge === true

  return (
    <section
      ref={panelRef}
      aria-label={identity.label}
      className={modePanelClassName}
      style={modeAccentStyle(identity.accent)}
    >
      {isDesktop ? (
        <PanelResizeHandle
          label="Modus-Panelbreite ändern"
          onPointerDown={onResizeHandlePointerDown}
        />
      ) : null}
      <header
        className={twJoin(
          isDetail ? 'flex items-stretch border-b border-gray-200' : 'border-b border-gray-200',
          modeAccentInvertedClassName,
          modeAccentInvertedFgClassName(currentMode),
        )}
      >
        {isDetail ? (
          <>
            <button
              type="button"
              onClick={detail.onBack}
              aria-label="Zurück zur Liste"
              className={modePanelBackButtonClassName}
            >
              <ArrowLeftIcon className="size-5" aria-hidden />
            </button>
            <div className={twJoin(modePanelHeaderBarClassName, 'grow justify-between')}>
              <Tooltip text={detail.title} className="max-w-full min-w-0">
                <h1
                  className={twJoin(
                    modePanelTitleClassName,
                    'line-clamp-2 min-w-0 leading-snug text-inherit',
                  )}
                >
                  {detail.title}
                </h1>
              </Tooltip>
              {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
          </>
        ) : collection && collectionAlwaysOpen ? (
          <>
            <div className="flex items-stretch">
              <div className={twJoin(modePanelHeaderBarClassName, 'grow')}>
                <Icon className="size-5 shrink-0" aria-hidden />
                <ModePanelListHeading
                  title={title}
                  subtitle={subtitle}
                  mutedClassName={modeAccentInvertedMutedClassName(currentMode)}
                />
              </div>
              {actions && <div className={modePanelListHeaderActionsClassName}>{actions}</div>}
            </div>
            <div className={modePanelCollectionClassName}>{collection}</div>
          </>
        ) : collection ? (
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
                      <Icon className="size-5 shrink-0" aria-hidden />
                      <ModePanelListHeading
                        title={title}
                        subtitle={subtitle}
                        mutedClassName={modeAccentInvertedMutedClassName(currentMode)}
                      />
                    </div>
                    <ChevronDownIcon
                      className={twJoin(
                        'size-5 shrink-0 transition-transform',
                        open ? 'rotate-180' : '',
                      )}
                      aria-hidden
                    />
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
        ) : (
          <div className={twJoin(modePanelHeaderBarClassName, 'justify-between')}>
            <div className="flex min-w-0 items-center gap-2">
              <Icon className="size-5 shrink-0" aria-hidden />
              <ModePanelListHeading
                title={title}
                subtitle={subtitle}
                mutedClassName={modeAccentInvertedMutedClassName(currentMode)}
              />
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        )}
      </header>
      {!isDetail && filter && <div className={modePanelSectionClassName}>{filter}</div>}
      <div className={modePanelScrollClassName}>{isDetail ? detail.children : children}</div>
      {showOutsideFooter ? (
        <footer className={modePanelFooterClassName} aria-live="polite">
          Außerhalb des Kartenausschnitts
        </footer>
      ) : null}
    </section>
  )
}

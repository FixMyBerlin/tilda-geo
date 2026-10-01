import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { modeIdentity } from './modeIdentity'
import {
  modePanelActionFooterClassName,
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
import {
  ModePanelCollectionDisclosure,
  ModePanelListHeading,
} from './ModePanelCollectionDisclosure'
import { useCurrentMode } from './useCurrentMode'
import { useListHoverMarkerPosition } from './useListHoverMarkerPosition'

type ModePanelDetail = {
  title: string
  /** Second line under the detail title (e.g. OSM note created date). */
  subtitle?: ReactNode
  /** Status flag on the right of the title row (e.g. OSM open/closed pill). */
  titleBadge?: ReactNode
  onBack: () => void
  children: ReactNode
}

type Props = {
  title: string
  subtitle?: ReactNode
  /** Collection picker body. Hidden in detail view. Header click discloses it and pushes the filter/list down. */
  collection?: ReactNode
  /** Keep the collection picker visible and non-collapsible (e.g. no Prüfliste exists yet). */
  collectionAlwaysOpen?: boolean
  /**
   * Second header row directly below the header, without a gap (e.g. Flächenfinder Varianten).
   * Brings its own colours and bottom border. Hidden in detail view.
   */
  subHeader?: ReactNode
  filter?: ReactNode
  actions?: ReactNode
  detail?: ModePanelDetail
  /**
   * Sticky primary-action bar below the scroll area (e.g. Flächenfinder »Berechnen«). Only
   * Flächenfinder uses this today; other modes simply omit it. The caller decides when it applies
   * (e.g. not while a detail view is open).
   */
  footer?: ReactNode
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
  subHeader,
  filter,
  actions,
  detail,
  footer,
  children,
}: Props) => {
  const { mode } = useCurrentMode()
  const identity = modeIdentity[mode]
  const { accent } = identity
  const Icon = identity.icon
  const isDetail = detail !== undefined
  const hoverMarkerPosition = useListHoverMarkerPosition()
  const showOutsideFooter = !isDetail && hoverMarkerPosition?.atEdge === true
  const showSubHeader = !isDetail && subHeader != null

  return (
    <section
      aria-label={identity.label}
      className={twJoin(modePanelClassName, accent.tintClassName)}
    >
      <header
        className={twJoin(
          isDetail && 'flex items-stretch',
          !showSubHeader && 'border-b border-white/80',
          accent.className,
          accent.invertedFgClassName,
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
            <div className={twJoin(modePanelHeaderBarClassName, 'min-w-0 grow')}>
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0 leading-tight">
                  <Tooltip text={detail.title} className="max-w-full min-w-0">
                    <h1
                      className={twJoin(
                        modePanelTitleClassName,
                        'line-clamp-2 min-w-0 leading-tight text-inherit',
                      )}
                    >
                      {detail.title}
                    </h1>
                  </Tooltip>
                  {detail.subtitle ? (
                    <div
                      className={twJoin('min-w-0 text-xs leading-4', accent.invertedMutedClassName)}
                    >
                      {detail.subtitle}
                    </div>
                  ) : null}
                </div>
                {(detail.titleBadge || actions) && (
                  <div className="flex shrink-0 items-center gap-2">
                    {detail.titleBadge}
                    {actions}
                  </div>
                )}
              </div>
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
                  mutedClassName={accent.invertedMutedClassName}
                />
              </div>
              {actions && <div className={modePanelListHeaderActionsClassName}>{actions}</div>}
            </div>
            <div className={modePanelCollectionClassName}>{collection}</div>
          </>
        ) : collection ? (
          <ModePanelCollectionDisclosure
            icon={<Icon className="size-5 shrink-0" aria-hidden />}
            title={title}
            subtitle={subtitle}
            mutedClassName={accent.invertedMutedClassName}
            collection={collection}
            actions={actions}
          />
        ) : (
          <div className={twJoin(modePanelHeaderBarClassName, 'justify-between')}>
            <div className="flex min-w-0 items-center gap-2">
              <Icon className="size-5 shrink-0" aria-hidden />
              <ModePanelListHeading
                title={title}
                subtitle={subtitle}
                mutedClassName={accent.invertedMutedClassName}
              />
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        )}
      </header>
      {showSubHeader && subHeader}
      {!isDetail && filter && <div className={modePanelSectionClassName}>{filter}</div>}
      <div className={modePanelScrollClassName}>{isDetail ? detail.children : children}</div>
      {showOutsideFooter ? (
        <footer className={modePanelFooterClassName} aria-live="polite">
          Außerhalb des Kartenausschnitts
        </footer>
      ) : null}
      {footer ? <div className={modePanelActionFooterClassName}>{footer}</div> : null}
    </section>
  )
}

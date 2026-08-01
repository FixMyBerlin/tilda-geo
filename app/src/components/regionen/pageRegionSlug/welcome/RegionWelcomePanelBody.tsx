import { ListBulletIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { Markdown } from '@/components/shared/text/Markdown'
import { proseInvertedPanelClasses } from '@/components/shared/text/prose'
import { playwrightTestId } from '@/components/shared/utils/playwright'
import type { TRegionWelcome } from '@/server/regions/regionConfigMapper.server'
import { RegionWelcomeFaqList } from './RegionWelcomeFaqList'
import { RegionWelcomeHeroImage } from './RegionWelcomeHeroImage'
import { RegionWelcomeNavLinks } from './RegionWelcomeNavLinks'

type PanelView = 'welcome' | 'faq'

type Props = {
  welcome: TRegionWelcome | null
  onClose: () => void
  panelRef?: React.RefObject<HTMLDivElement | null>
  /** Desktop panel caps its own height; mobile relies on MobileBottomSheet. */
  variant?: 'desktop' | 'mobile'
  /** Welcome vs FAQ view — owned by the parent (desktop panel or mobile sheet footer). */
  panelView: PanelView
  onPanelViewChange: (view: PanelView) => void
}

/** Horizontal inset shared by the nav bar and welcome content (right matches header user avatar). */
const desktopPanelHorizontalPaddingClassName =
  'pl-4 pr-[4.375rem] sm:pl-6 sm:pr-[5.125rem] lg:pl-8 lg:pr-[5.625rem]'

const inlinePanelNavButtonClassName =
  'inline-flex items-center gap-1.5 rounded-md border border-transparent px-3.5 py-2.5 text-sm/6 font-semibold text-white hover:border-gray-600 hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none'

/** FAQ count above this uses a full-width two-column list; at or below keeps the welcome hero. */
const faqHeroMaxSections = 3

const RegionWelcomeInlineCloseCta = ({ onClose }: { onClose: () => void }) => (
  <button
    type="button"
    data-testid={playwrightTestId('region-welcome-close-cta')}
    onClick={onClose}
    className="rounded-md bg-brand px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-xs hover:bg-brand-light focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
  >
    Zur Karte
  </button>
)

const RegionWelcomeFaqHeaderRow = ({
  subtitle,
  onBack,
  onClose,
}: {
  subtitle: string | null | undefined
  onBack: () => void
  onClose: () => void
}) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
    <RegionWelcomeInlineCloseCta onClose={onClose} />
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-3.5 py-2.5 text-sm/6 font-semibold text-white"
      aria-current="page"
    >
      <ListBulletIcon className="size-4 shrink-0" aria-hidden="true" />
      Häufige Fragen
    </span>
    <button type="button" onClick={onBack} className={inlinePanelNavButtonClassName}>
      {subtitle ?? 'Zurück'}
    </button>
  </div>
)

const RegionWelcomeInlineCtaRow = ({
  onClose,
  showFaqLink,
  onShowFaq,
}: {
  onClose: () => void
  showFaqLink: boolean
  onShowFaq: () => void
}) => (
  <div className="mt-4.5 flex flex-wrap items-center gap-x-3 gap-y-3">
    <RegionWelcomeInlineCloseCta onClose={onClose} />
    {showFaqLink ? (
      <button type="button" onClick={onShowFaq} className={inlinePanelNavButtonClassName}>
        <ListBulletIcon className="size-4 shrink-0" aria-hidden="true" />
        Häufige Fragen
      </button>
    ) : null}
  </div>
)

export const RegionWelcomePanelBody = ({
  welcome,
  onClose,
  panelRef,
  variant = 'desktop',
  panelView,
  onPanelViewChange,
}: Props) => {
  const region = useRegion()
  const isDesktop = variant === 'desktop'
  const sections = welcome?.sections ?? []
  const showFaqLink = sections.length > 0
  const useFaqDenseLayout = isDesktop && sections.length > faqHeroMaxSections
  const welcomeGridClassName = twJoin(
    'grid grid-cols-1 gap-x-4.5',
    isDesktop ? 'gap-y-10 lg:grid-cols-2 lg:items-start' : 'gap-y-4',
  )

  return (
    <div
      ref={panelRef}
      data-testid={playwrightTestId(
        isDesktop ? 'region-welcome-panel' : 'region-welcome-panel-mobile',
      )}
      className={twJoin('flex flex-col bg-gray-900', isDesktop && 'max-h-[80dvh]')}
    >
      {isDesktop ? (
        <div
          className={twJoin(
            'relative z-10 shrink-0 pt-3 pb-3',
            desktopPanelHorizontalPaddingClassName,
          )}
        >
          {/* Secondary links only — region nav links already live in the header. */}
          <RegionWelcomeNavLinks className="justify-end" />
        </div>
      ) : null}
      <div className={twJoin(isDesktop && 'min-h-0 flex-1 overflow-y-auto overscroll-contain')}>
        <div
          className={
            isDesktop
              ? twJoin('pb-8', desktopPanelHorizontalPaddingClassName)
              : 'mx-auto max-w-7xl px-4 pt-4 pb-4'
          }
        >
          {!isDesktop ? (
            <RegionWelcomeNavLinks
              regionItems={region?.navigationLinks}
              includeSecondaryLinks
              layout="stacked"
              className="mb-4"
              linkClassName="text-base leading-none font-semibold text-gray-300 underline-offset-4 hover:text-white hover:underline"
            />
          ) : null}
          {panelView === 'faq' ? (
            <div
              data-testid={playwrightTestId('region-welcome-faq-view')}
              className={useFaqDenseLayout ? undefined : welcomeGridClassName}
            >
              <div
                className={
                  useFaqDenseLayout ? 'min-w-0' : 'mx-auto max-w-2xl min-w-0 lg:mx-0 lg:max-w-none'
                }
              >
                {isDesktop ? (
                  <RegionWelcomeFaqHeaderRow
                    subtitle={welcome?.subtitle}
                    onBack={() => onPanelViewChange('welcome')}
                    onClose={onClose}
                  />
                ) : null}
                <div className={twJoin(isDesktop && 'mt-3.5')}>
                  <RegionWelcomeFaqList sections={sections} columns={useFaqDenseLayout ? 2 : 1} />
                </div>
              </div>
              {!useFaqDenseLayout && welcome ? (
                <RegionWelcomeHeroImage image={welcome.image} />
              ) : null}
            </div>
          ) : (
            <div
              data-testid={playwrightTestId('region-welcome-welcome-view')}
              className={welcomeGridClassName}
            >
              <div>
                {welcome ? (
                  <div className="mx-auto max-w-2xl min-w-0 lg:mx-0 lg:max-w-none">
                    {welcome.subtitle ? (
                      <p className="text-base leading-none font-semibold text-brand">
                        {welcome.subtitle}
                      </p>
                    ) : null}
                    <h2 className="mt-3 text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
                      {welcome.title}
                    </h2>
                    {welcome.bodyMarkdown ? (
                      <div className="mt-3.5 text-lg/6 text-gray-300">
                        <Markdown
                          markdown={welcome.bodyMarkdown}
                          headingStyle="document"
                          className={twJoin(proseInvertedPanelClasses, 'prose-p:leading-6')}
                        />
                      </div>
                    ) : null}
                    {isDesktop ? (
                      <RegionWelcomeInlineCtaRow
                        onClose={onClose}
                        showFaqLink={showFaqLink}
                        onShowFaq={() => onPanelViewChange('faq')}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>

              {welcome ? <RegionWelcomeHeroImage image={welcome.image} /> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

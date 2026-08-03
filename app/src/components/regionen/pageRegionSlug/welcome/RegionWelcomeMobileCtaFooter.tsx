import { twJoin } from 'tailwind-merge'
import { playwrightTestId } from '@/components/shared/utils/playwright'

const ctaFooterClassName = 'shrink-0 border-t border-white/10 bg-gray-900 px-4 py-4'

/** Shared box model for side-by-side mobile footer buttons. */
const mobileFooterButtonClassName =
  'inline-flex min-h-10 items-center justify-center rounded-md border px-3.5 py-2.5 text-sm/6 font-semibold focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none'

const mobileFooterPrimaryButtonClassName = twJoin(
  mobileFooterButtonClassName,
  'border-transparent bg-brand text-gray-900 hover:bg-brand-light',
)

type Props = {
  onClose: () => void
  panelView: 'welcome' | 'faq'
  showFaqLink: boolean
  onShowFaq: () => void
}

/** Sticky bottom actions for the mobile welcome sheet (Close / FAQ). */
export const RegionWelcomeMobileCtaFooter = ({
  onClose,
  panelView,
  showFaqLink,
  onShowFaq,
}: Props) => (
  <div className={ctaFooterClassName}>
    {panelView === 'faq' || !showFaqLink ? (
      <button
        type="button"
        data-testid={playwrightTestId('region-welcome-close-cta')}
        onClick={onClose}
        className={twJoin(mobileFooterPrimaryButtonClassName, 'w-full')}
      >
        Zur Karte
      </button>
    ) : (
      <div className="flex items-stretch gap-3">
        <button
          type="button"
          data-testid={playwrightTestId('region-welcome-close-cta')}
          onClick={onClose}
          className={twJoin(mobileFooterPrimaryButtonClassName, 'min-w-0 flex-1')}
        >
          Zur Karte
        </button>
        <button
          type="button"
          onClick={onShowFaq}
          className={twJoin(
            mobileFooterButtonClassName,
            'shrink-0 border-transparent text-white hover:border-gray-600 hover:bg-white/3',
          )}
        >
          Häufige Fragen
        </button>
      </div>
    )}
  </div>
)

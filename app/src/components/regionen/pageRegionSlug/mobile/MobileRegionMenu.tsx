import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { RegionWelcomeMobileCtaFooter } from '@/components/regionen/pageRegionSlug/welcome/RegionWelcomeMobileCtaFooter'
import { RegionWelcomePanelBody } from '@/components/regionen/pageRegionSlug/welcome/RegionWelcomePanelBody'
import { useRegionWelcomePanel } from '@/components/regionen/pageRegionSlug/welcome/useRegionWelcomePanel'
import { Img } from '@/components/shared/Img'
import { MobileBottomSheet } from './MobileBottomSheet'
import {
  mobileControlButtonActiveClassName,
  mobileControlButtonClassName,
} from './mobileControlButton.const'

/** 1–2 letter fallback shown when a region has no logo (e.g. "Berlin" → "B", "Bad Belzig" → "BB"). */
const regionAbbreviation = (name: string) => {
  const words = name
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
  if (words.length >= 2) return `${words[0]!.charAt(0)}${words[1]!.charAt(0)}`.toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

/**
 * Mobile region menu: a floating logo/abbreviation button (placed top-left in
 * the MobileMapHeader) that opens a bottom sheet with welcome content and nav links.
 */
export const MobileRegionMenu = () => {
  const region = useRegion()
  const { welcome, isOpen, openPanel, closePanel, panelRef } = useRegionWelcomePanel()
  const [panelView, setPanelView] = useState<'welcome' | 'faq'>('welcome')

  const openMenu = () => {
    setPanelView('welcome')
    openPanel()
  }

  const closeMenu = () => {
    setPanelView('welcome')
    closePanel()
  }

  if (!region) return null

  const customLogo = region.logoPath
  const menuLabel = welcome && region.status === 'PUBLIC' ? welcome.title : region.name
  const showFaqLink = (welcome?.sections ?? []).length > 0

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        aria-label={`Menü – ${region.fullName}`}
        aria-expanded={isOpen}
        className={twMerge(
          mobileControlButtonClassName,
          'h-10 min-w-10 gap-1.5 px-2',
          customLogo && region.logoWhiteBackgroundRequired ? 'bg-white' : '',
          isOpen && mobileControlButtonActiveClassName,
        )}
      >
        {customLogo ? (
          <Img src={customLogo} className="h-6 w-auto max-w-16 object-contain" alt="" />
        ) : (
          <span className="text-sm font-bold text-yellow-500">
            {regionAbbreviation(region.name)}
          </span>
        )}
        <span className="max-w-24 truncate text-sm font-medium text-gray-700">{menuLabel}</span>
      </button>

      <MobileBottomSheet
        open={isOpen}
        onClose={closeMenu}
        title={welcome?.title ?? region.name}
        mapPeek="15%"
        panelClassName="bg-gray-900 text-white"
        grabberClassName="bg-white/30"
        footer={
          <RegionWelcomeMobileCtaFooter
            onClose={closeMenu}
            panelView={panelView}
            showFaqLink={showFaqLink}
            onShowFaq={() => setPanelView('faq')}
          />
        }
      >
        <RegionWelcomePanelBody
          welcome={welcome}
          onClose={closeMenu}
          variant="mobile"
          panelRef={panelRef}
          panelView={panelView}
          onPanelViewChange={setPanelView}
        />
      </MobileBottomSheet>
    </>
  )
}

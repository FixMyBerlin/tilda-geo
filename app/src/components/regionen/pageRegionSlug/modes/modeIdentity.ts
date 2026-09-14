import {
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  MapIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'
import type { RegionMode } from './useCurrentMode'

type ModeIcon = ComponentType<SVGProps<SVGSVGElement>>

type ModeAccent = {
  className: string
  textClassName: string
  hex: string
  rgb: readonly [number, number, number]
  invertedFgClassName: string
  invertedMutedClassName: string
  tintClassName: string
  tintEmphasisClassName: string
}

/** Compact `shortLabel` is for the mobile header control (QA is too long for that slot). */
export const modeIdentity = {
  map: {
    label: 'Karte',
    shortLabel: 'Karte',
    icon: MapIcon,
    accent: {
      className: 'bg-brand',
      textClassName: 'text-brand',
      hex: '#fabe48',
      rgb: [250, 190, 72],
      invertedFgClassName: 'text-gray-900',
      invertedMutedClassName: 'text-gray-800/70',
      tintClassName: 'bg-brand/10',
      tintEmphasisClassName: 'bg-brand/20',
    },
  },
  notes: {
    label: 'Hinweise',
    shortLabel: 'Hinweise',
    icon: ChatBubbleLeftRightIcon,
    accent: {
      className: 'bg-sky-700',
      textClassName: 'text-sky-700',
      hex: '#0369a1',
      rgb: [3, 105, 161],
      invertedFgClassName: 'text-white',
      invertedMutedClassName: 'text-white/80',
      tintClassName: 'bg-sky-700/10',
      tintEmphasisClassName: 'bg-sky-700/20',
    },
  },
  qa: {
    label: 'Qualitätssicherung',
    shortLabel: 'QA',
    icon: CheckBadgeIcon,
    accent: {
      className: 'bg-violet-600',
      textClassName: 'text-violet-600',
      hex: '#7c3aed',
      rgb: [124, 58, 237],
      invertedFgClassName: 'text-white',
      invertedMutedClassName: 'text-white/80',
      tintClassName: 'bg-violet-600/10',
      tintEmphasisClassName: 'bg-violet-600/20',
    },
  },
  reviewLists: {
    label: 'Prüflisten',
    shortLabel: 'Prüflisten',
    icon: ClipboardDocumentCheckIcon,
    accent: {
      className: 'bg-teal-600',
      textClassName: 'text-teal-600',
      hex: '#0d9488',
      rgb: [13, 148, 136],
      invertedFgClassName: 'text-white',
      invertedMutedClassName: 'text-white/80',
      tintClassName: 'bg-teal-600/10',
      tintEmphasisClassName: 'bg-teal-600/20',
    },
  },
} as const satisfies Record<
  RegionMode,
  { label: string; shortLabel: string; accent: ModeAccent; icon: ModeIcon }
>

/** Modes that own inspector / map chrome (not the default map). */
export type ModeAccentMode = Exclude<RegionMode, 'map'>

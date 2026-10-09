import {
  CalculatorIcon,
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

/**
 * Compact `shortLabel` is for the mobile header control (QA is too long for that slot).
 * `compact` modes are tools: the desktop switcher shows only their icon until they are active.
 */
export const modeIdentity = {
  map: {
    label: 'Karte',
    shortLabel: 'Karte',
    icon: MapIcon,
    compact: false,
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
    compact: false,
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
    compact: false,
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
    compact: false,
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
  calculator: {
    label: 'Summieren',
    shortLabel: 'Summieren',
    icon: CalculatorIcon,
    compact: true,
    accent: {
      className: 'bg-fuchsia-700',
      textClassName: 'text-fuchsia-700',
      hex: '#a21caf',
      rgb: [162, 28, 175],
      invertedFgClassName: 'text-white',
      invertedMutedClassName: 'text-white/80',
      tintClassName: 'bg-fuchsia-700/10',
      tintEmphasisClassName: 'bg-fuchsia-700/20',
    },
  },
} as const satisfies Record<
  RegionMode,
  { label: string; shortLabel: string; accent: ModeAccent; icon: ModeIcon; compact: boolean }
>

/** Modes that own inspector / map chrome (not the default map). */
export type ModeAccentMode = Exclude<RegionMode, 'map'>

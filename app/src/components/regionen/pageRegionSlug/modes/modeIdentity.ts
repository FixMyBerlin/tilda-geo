import {
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  MapIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, CSSProperties, SVGProps } from 'react'
import type { RegionMode } from './useCurrentMode'

type ModeIcon = ComponentType<SVGProps<SVGSVGElement>>

export const modeIdentity = {
  map: { label: 'Karte', accent: '#fabe48', icon: MapIcon },
  notes: { label: 'Hinweise', accent: '#0369a1', icon: ChatBubbleLeftRightIcon },
  qa: { label: 'Qualitätssicherung', accent: '#7c3aed', icon: CheckBadgeIcon },
  reviewLists: { label: 'Prüflisten', accent: '#0d9488', icon: ClipboardDocumentCheckIcon },
} as const satisfies Record<RegionMode, { label: string; accent: string; icon: ModeIcon }>

/** Sets `--mode-accent` for Tailwind arbitrary values and color-mix tints. */
export const modeAccentStyle = (accent: string) =>
  ({ '--mode-accent': accent }) as CSSProperties & { '--mode-accent': string }

/** Accent as `rgba()` for MapLibre paint and DOM glows (hex from `modeIdentity`). */
export const modeAccentRgba = (accent: string, alpha: number) => {
  const hex = accent.replace('#', '')
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Modes that own inspector / map chrome (not the default map). */
export type ModeAccentMode = Exclude<RegionMode, 'map'>

/** Soft surface tint (Disclosure body / comment washes). */
export const modeAccentTintClassName = 'bg-[color-mix(in_srgb,var(--mode-accent)_6%,white)]'

/** Slightly stronger tint (e.g. “your” OSM comments). */
export const modeAccentTintEmphasisClassName =
  'bg-[color-mix(in_srgb,var(--mode-accent)_12%,white)]'

/** Solid accent fill for inverted chrome (headers, switcher pill). */
export const modeAccentInvertedClassName = 'bg-(--mode-accent)'

/**
 * Foreground on inverted accent. Map’s brand yellow needs dark text; other modes use white.
 */
export const modeAccentInvertedFgClassName = (mode: RegionMode) =>
  mode === 'map' ? 'text-gray-900' : 'text-white'

/** Muted line under an inverted header title (e.g. ModePanel subtitle). */
export const modeAccentInvertedMutedClassName = (mode: RegionMode) =>
  mode === 'map' ? 'text-gray-800/70' : 'text-white/80'

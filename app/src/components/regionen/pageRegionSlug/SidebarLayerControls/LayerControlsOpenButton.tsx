import { Square3Stack3DIcon } from '@heroicons/react/24/outline'
import type { ComponentPropsWithoutRef } from 'react'
import { twMerge } from 'tailwind-merge'
import {
  mobileControlButtonActiveClassName,
  mobileControlButtonClassName,
} from '../mobile/mobileControlButton.const'

type Props = {
  expanded: boolean
} & ComponentPropsWithoutRef<'button'>

/** Shared map-layers toggle (mobile sheet + desktop sidebar collapsed). */
export const LayerControlsOpenButton = ({ expanded, className, ...props }: Props) => (
  <button
    type="button"
    aria-label="Kategorien"
    aria-expanded={expanded}
    className={twMerge(
      mobileControlButtonClassName,
      'size-13',
      expanded && mobileControlButtonActiveClassName,
      className,
    )}
    {...props}
  >
    {/* Bigger (size-8) to fill the larger button, but strokeWidth thinned to ~match the
        size-6 control icons' line weight (1.5 × 24/32 ≈ 1.125). */}
    <Square3Stack3DIcon className="size-8" strokeWidth={1.125} aria-hidden="true" />
  </button>
)

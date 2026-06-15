import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import { useStaticRegion } from '../regionUtils/useStaticRegion'
import { mobileControlButtonClassName } from './mobileControlButton.const'
import { useMobileSearchStore } from './useMobileSearchStore'

/**
 * Mobile search trigger (placed top-right in the MobileMapHeader): reveals the
 * geocoder (mounted on the map) and focuses its input so the keyboard opens.
 * The geocoder closes itself on focusout (tap outside / result selected).
 * Only rendered for regions that have search enabled.
 */
export const MobileSearchButton = () => {
  const region = useStaticRegion()
  const setOpen = useMobileSearchStore((state) => state.setOpen)
  const control = useMobileSearchStore((state) => state.control)

  if (region?.showSearch !== true) return null

  const onClick = () => {
    setOpen(true)
    // Focus after the reveal so the on-screen keyboard opens on the now-visible input.
    requestAnimationFrame(() => control?.focus())
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Suche"
      className={twJoin(mobileControlButtonClassName, 'size-10')}
    >
      <MagnifyingGlassIcon className="size-6" aria-hidden="true" />
    </button>
  )
}

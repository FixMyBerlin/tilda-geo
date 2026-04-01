import { XMarkIcon } from '@heroicons/react/24/outline'
import type { ComponentPropsWithoutRef, Ref } from 'react'
import { twJoin } from 'tailwind-merge'

type Props = {
  onClick: () => void
  positionClasses?: string
  /** React 19: ref as regular prop */
  ref?: Ref<HTMLButtonElement>
} & ComponentPropsWithoutRef<'button'>

export function CloseButton({ onClick, positionClasses = 'top-2 right-2', ref, ...props }: Props) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={twJoin(
        positionClasses,
        'absolute inline-flex items-center justify-center rounded-md border border-gray-300 p-1.5 text-gray-900 transition-colors hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset',
      )}
      {...props}
    >
      <span className="sr-only">Schließen</span>
      <XMarkIcon className="block size-6" aria-hidden="true" />
    </button>
  )
}

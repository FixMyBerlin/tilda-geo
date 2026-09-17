import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BugAntIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'

type Props = {
  title?: string
  data: object | undefined | null
  className?: string
}

/**
 * Dev/admin JSON dump as a tiny overlay button. Zero-height float keeps it out
 * of document flow; consecutive dumps sit in a row at the insertion point.
 */
export const ObjectDump = ({ title, data, className }: Props) => {
  const label = title ? `JSON Dump ${title}` : 'JSON Dump'

  return (
    <div className={twJoin('relative z-10 float-end h-0 w-6', className)}>
      <Popover className="pointer-events-auto absolute right-0 bottom-0">
        {({ open }) => (
          <>
            <PopoverButton
              type="button"
              aria-label={label}
              title={label}
              className={twJoin(
                'flex size-6 items-center justify-center rounded-md border shadow-md focus:ring-2 focus:outline-none',
                'border-pink-400 bg-pink-300 text-pink-900 hover:bg-pink-400 focus:ring-pink-500',
                open && 'border-pink-600 bg-pink-400',
              )}
            >
              <BugAntIcon className="size-3.5" aria-hidden="true" />
            </PopoverButton>
            <PopoverPanel
              anchor="top end"
              className="z-50 w-[min(28rem,calc(100vw-1.5rem))] rounded-md border border-pink-300 bg-white p-2 shadow-lg"
            >
              {title ? (
                <p className="mb-1 font-mono text-[11px] font-semibold text-pink-900">{title}</p>
              ) : null}
              <pre className="max-h-72 overflow-auto text-[11px] leading-snug text-gray-800">
                {JSON.stringify(data ?? null, undefined, 2)}
              </pre>
            </PopoverPanel>
          </>
        )}
      </Popover>
    </div>
  )
}

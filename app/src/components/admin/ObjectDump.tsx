import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'

type Props = {
  title?: string
  data: unknown
  className?: string
}

/** Collapsed JSON dump (closed by default) — belongs in `AdminTechnicalDetails`. */
export const ObjectDump = ({ title, data, className }: Props) => (
  <details className={twJoin('group rounded-md bg-gray-50 ring-1 ring-gray-900/5', className)}>
    <summary className="flex cursor-pointer list-none items-center gap-x-1.5 px-3 py-2 text-sm font-medium text-gray-700 select-none hover:text-gray-900 [&::-webkit-details-marker]:hidden">
      <ChevronRightIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90 motion-reduce:transition-none"
      />
      {title ?? 'JSON'}
      <span className="ml-auto font-mono text-xs font-normal text-gray-400">JSON</span>
    </summary>
    <pre className="max-h-96 overflow-auto border-t border-gray-200 px-3 py-2 font-mono text-xs leading-snug text-gray-800">
      {JSON.stringify(data ?? null, undefined, 2)}
    </pre>
  </details>
)

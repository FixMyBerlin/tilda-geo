import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { useDebouncedCallback } from '@tanstack/react-pacer'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useDeferredValue, useState } from 'react'
import { twMerge } from 'tailwind-merge'

const readQuery = (search: unknown) => {
  const q = (search as { q?: unknown }).q
  return typeof q === 'string' ? q : ''
}

/**
 * Current `?q=` of the list route, trimmed and deferred — filter rows with it so typing stays
 * responsive. The route’s `validateSearch` must accept `q` (`optionalSearchString()`).
 */
export const useAdminSearchQuery = () => {
  const search = useSearch({ strict: false })
  return useDeferredValue(readQuery(search).trim())
}

type Props = {
  /** Accessible name, e.g. „Regionen durchsuchen“. */
  label: string
  placeholder?: string
  className?: string
}

/** List search bound to `?q=` (debounced `replace` navigation; resets `page` for paginated lists). */
export const AdminSearchField = ({ label, placeholder = 'Suchen …', className }: Props) => {
  const navigate = useNavigate()
  const urlQuery = readQuery(useSearch({ strict: false }))
  const [value, setValue] = useState(urlQuery)
  // Adopt external URL changes (back button, reset links) but not the echo of our own writes.
  const [lastSeenUrlQuery, setLastSeenUrlQuery] = useState(urlQuery)
  const [lastWrittenQuery, setLastWrittenQuery] = useState(urlQuery)
  if (urlQuery !== lastSeenUrlQuery) {
    setLastSeenUrlQuery(urlQuery)
    if (urlQuery !== lastWrittenQuery) setValue(urlQuery)
  }

  const writeQuery = (next: string) => {
    setLastWrittenQuery(next)
    void navigate({
      to: '.',
      replace: true,
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        q: next || undefined,
        page: undefined,
      }),
    } as Parameters<typeof navigate>[0])
  }
  const writeQueryDebounced = useDebouncedCallback(writeQuery, { wait: 250 })

  return (
    <div className={twMerge('relative w-full max-w-xs min-w-0', className)}>
      <MagnifyingGlassIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-gray-400"
      />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          writeQueryDebounced(event.target.value)
        }}
        className="block w-full appearance-none rounded-md border-0 bg-white py-1.5 pr-8 pl-8 text-sm text-gray-900 shadow-xs ring-1 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue('')
            writeQuery('')
          }}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon aria-hidden="true" className="size-4" />
          <span className="sr-only">Suche zurücksetzen</span>
        </button>
      ) : null}
    </div>
  )
}

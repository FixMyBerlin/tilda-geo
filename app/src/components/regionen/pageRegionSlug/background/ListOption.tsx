import { ListboxOption } from '@headlessui/react'
import { ArrowSmallRightIcon, LockClosedIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import type { BackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/backgroundParam.const'
import { isPrivateBackgroundParam } from '@/server/private-backgrounds/privateBackgroundParam'

type Props = { value: BackgroundParam; name: string }

// https://headlessui.com/react/listbox#styling-the-active-and-selected-option
export const ListOption = ({ value, name }: Props) => {
  return (
    <ListboxOption
      value={value}
      className={({ focus, selected }) =>
        twJoin(
          'relative py-2 pl-10 text-gray-900 select-none',
          isPrivateBackgroundParam(value) ? 'pr-9' : 'pr-4',
          focus && !selected ? 'cursor-pointer bg-yellow-50 text-yellow-900' : '',
          selected ? 'bg-yellow-400' : '',
        )
      }
    >
      {({ focus, selected }) => (
        <>
          <span
            className={twJoin('block truncate', focus || selected ? 'font-medium' : 'font-normal')}
          >
            {name}
          </span>
          {isPrivateBackgroundParam(value) && (
            <span
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
              title="Nur für Mitglieder dieser Region"
            >
              <LockClosedIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">Nur für Mitglieder dieser Region</span>
            </span>
          )}
          {!!selected && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
              <ArrowSmallRightIcon className="size-5" aria-hidden="true" />
            </span>
          )}
        </>
      )}
    </ListboxOption>
  )
}

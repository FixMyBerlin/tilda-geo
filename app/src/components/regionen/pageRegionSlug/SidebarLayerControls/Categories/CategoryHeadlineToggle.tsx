import { Label, Switch, SwitchGroup } from '@headlessui/react'
import { twJoin } from 'tailwind-merge'
import { categoryHeaderTitleBoxClassName } from '../categoryHeader.const'

type Props = {
  active: boolean
  open?: boolean
  titleAttribute?: string | null
  handleChange: () => void
  children: React.ReactNode
}

export const CategoryHeadlineToggle = ({
  active,
  open = false,
  titleAttribute,
  handleChange,
  children,
}: Props) => {
  return (
    <SwitchGroup
      as="div"
      className="group flex min-h-10 min-w-0 grow cursor-pointer items-stretch justify-between hover:bg-yellow-50"
    >
      <Label
        as="div"
        className={twJoin(
          categoryHeaderTitleBoxClassName,
          'flex-1 cursor-pointer',
          open ? 'justify-start' : 'justify-center',
          active ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900',
        )}
        title={titleAttribute ? titleAttribute : undefined}
      >
        <div className="w-full min-w-0 overflow-hidden">{children}</div>
      </Label>
      <div className="flex w-6 shrink-0 items-center justify-center">
        <Switch
          checked={active}
          onChange={handleChange}
          className="relative inline-flex h-4 w-8 shrink-0 rotate-90 cursor-pointer items-center justify-center rounded-full focus:outline-none"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-full w-full rounded-md bg-white group-hover:bg-yellow-50"
          />
          <span
            aria-hidden="true"
            className={twJoin(
              active ? 'bg-yellow-500' : 'bg-gray-200 group-hover:bg-gray-300',
              'pointer-events-none absolute mx-auto h-3 w-7 rounded-full transition-colors duration-200 ease-in-out',
            )}
          />
          <span
            aria-hidden="true"
            className={twJoin(
              active ? 'translate-x-4' : 'translate-x-0',
              'pointer-events-none absolute left-0 inline-block size-4 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out group-hover:bg-yellow-50',
            )}
          />
        </Switch>
      </div>
    </SwitchGroup>
  )
}

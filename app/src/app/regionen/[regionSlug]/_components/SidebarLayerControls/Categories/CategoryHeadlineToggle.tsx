import { Label, Switch, SwitchGroup } from '@headlessui/react'
import { twJoin } from 'tailwind-merge'

type Props = {
  active: boolean
  titleAttribute?: string | null
  handleChange: () => void
  children: React.ReactNode
}

export const CategoryHeadlineToggle = ({
  active,
  titleAttribute,
  handleChange,
  children,
}: Props) => {
  return (
    <SwitchGroup
      as="div"
      className="group flex min-h-[3rem] cursor-pointer items-center justify-between"
    >
      <Label
        as="div"
        className={twJoin(
          'ml-2 text-sm leading-[17px]',
          active ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900',
        )}
        title={titleAttribute ? titleAttribute : undefined}
      >
        {children}
      </Label>
      <Switch
        checked={active}
        onChange={handleChange}
        className="relative inline-flex h-5 w-10 flex-shrink-0 rotate-90 cursor-pointer items-center justify-center rounded-full focus:outline-none"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-full w-full rounded-md bg-white"
        />
        <span
          aria-hidden="true"
          className={twJoin(
            active ? 'bg-yellow-500' : 'bg-gray-200 group-hover:bg-gray-300',
            'pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out',
          )}
        />
        <span
          aria-hidden="true"
          className={twJoin(
            active ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out group-hover:bg-yellow-50',
          )}
        />
      </Switch>
    </SwitchGroup>
  )
}

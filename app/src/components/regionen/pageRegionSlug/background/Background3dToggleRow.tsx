import { Label, Switch, SwitchGroup } from '@headlessui/react'
import { twJoin } from 'tailwind-merge'

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export const Background3dToggleRow = ({ checked, onChange, label }: Props) => {
  return (
    <SwitchGroup
      as="div"
      className="group relative flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-yellow-50"
    >
      {/* Full-row hit target via Label (siblings Switch stays above so it is not double-toggled). */}
      <Label className="absolute inset-0 cursor-pointer rounded-md">
        <span className="sr-only">{label}</span>
      </Label>
      <span
        aria-hidden="true"
        className="pointer-events-none relative min-w-0 text-sm font-medium text-gray-900"
      >
        {label}
      </span>

      <Switch
        checked={checked}
        onChange={onChange}
        className="relative z-10 inline-flex h-5 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-full w-full rounded-md bg-white"
        />
        <span
          aria-hidden="true"
          className={twJoin(
            checked ? 'bg-yellow-500' : 'bg-gray-200 group-hover:bg-gray-300',
            'pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out',
          )}
        />
        <span
          aria-hidden="true"
          className={twJoin(
            checked ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none absolute left-0 inline-block size-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out group-hover:bg-yellow-50',
          )}
        />
      </Switch>
    </SwitchGroup>
  )
}

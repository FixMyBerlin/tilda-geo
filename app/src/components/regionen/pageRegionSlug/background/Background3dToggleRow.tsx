type Props = {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description: string
}

export const Background3dToggleRow = ({ id, checked, onChange, label, description }: Props) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-yellow-50">
      <div className="min-w-0 text-sm">
        <label id={`${id}-label`} htmlFor={id} className="font-medium text-gray-900">
          {label}
        </label>{' '}
        <span id={`${id}-description`} className="text-gray-500">
          {description}
        </span>
      </div>

      <div
        className={`group relative inline-flex w-11 shrink-0 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
          checked ? 'bg-yellow-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-description`}
          className="absolute inset-0 size-full cursor-pointer appearance-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
        />
      </div>
    </div>
  )
}

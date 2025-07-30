import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { CheckBadgeIcon, ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/20/solid'
import { CheckBadgeIcon as CheckBadgeIconOutline } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import { useQaParam } from '../../../_hooks/useQueryState/useQaParam'
import { QA_STYLE_OPTIONS, QaStyleKey } from './qaConfigStyles'

export const QaConfigCategory = ({
  qaConfig,
}: {
  qaConfig: {
    id: number
    slug: string
    label: string
    isActive: boolean
    createdAt: Date
  }
}) => {
  const { qaParam, setQaParam } = useQaParam()

  // Parse current QA param to get config and style using "--" as separator
  const parseQaParam = (param: string) => {
    if (!param) return { configSlug: '', style: 'none' as QaStyleKey }

    const parts = param.split('--')
    if (parts.length < 2) return { configSlug: '', style: 'none' as QaStyleKey }

    const style = parts[parts.length - 1] as QaStyleKey
    const configSlug = parts.slice(0, -1).join('--')
    return { configSlug, style }
  }

  const { configSlug, style } = parseQaParam(qaParam)
  const isSelected = configSlug === qaConfig.slug

  // Determine which radio button should be checked for this QA config
  const getCheckedStyle = (): QaStyleKey => {
    if (isSelected) {
      return style
    } else {
      // If this QA config is not active, show "none" as selected
      return 'none'
    }
  }

  const handleStyleChange = (newStyle: QaStyleKey) => {
    if (newStyle === 'none') {
      // Deactivate this QA config
      setQaParam('')
    } else {
      // Activate this QA config with the selected style using "--" as separator
      // This automatically deactivates any other QA config since only one can be active
      const newQaParam = `${qaConfig.slug}--${newStyle}`
      setQaParam(newQaParam)
    }
  }

  return (
    <Disclosure>
      {({ open }) => (
        <>
          <DisclosureButton className="group flex justify-between border-t border-t-gray-200 text-left hover:bg-yellow-50">
            <div
              className={twJoin(
                'ml-1.5 flex min-h-[3rem] w-full flex-col items-start text-sm leading-[17px]',
                isSelected ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900',
                'justify-center',
              )}
            >
              <h2 className="flex items-center gap-1 font-semibold">
                {qaConfig.isActive ? (
                  <CheckBadgeIcon className="size-5 flex-none" />
                ) : (
                  <CheckBadgeIconOutline className="size-5 flex-none" />
                )}
                <span>
                  {qaConfig.label}{' '}
                  {/* {qaConfig.isActive ? null : <Pill color="gray">deaktiviert</Pill>} */}
                </span>
              </h2>
            </div>
            <div className="flex min-h-[3rem] flex-none items-center justify-center px-1 text-yellow-500">
              {open ? (
                <ChevronDownIcon className="h-7 w-7" />
              ) : (
                <ChevronLeftIcon className="h-7 w-7" />
              )}
            </div>
          </DisclosureButton>

          <Transition
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <DisclosurePanel static as="section" className="mb-2 mt-1">
              <div className="ml-2 space-y-1">
                {QA_STYLE_OPTIONS.map((option) => (
                  <label key={option.key} className="flex items-center gap-2 text-xs">
                    <input
                      type="radio"
                      name={`qa-style-${qaConfig.slug}`}
                      value={option.key}
                      checked={getCheckedStyle() === option.key}
                      onChange={() => handleStyleChange(option.key)}
                      className="h-3 w-3 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </DisclosurePanel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}

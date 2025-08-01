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
  const { qaParamData, setQaParamData } = useQaParam()

  const isSelected = qaParamData.configSlug === qaConfig.slug
  const currentStyle = isSelected ? qaParamData.style : 'none'

  const handleStyleChange = (newStyle: QaStyleKey) => {
    if (newStyle === 'none') {
      // Deactivate this QA config
      setQaParamData({ configSlug: '', style: 'none' })
    } else {
      // Activate this QA config with the selected style
      setQaParamData({ configSlug: qaConfig.slug, style: newStyle })
    }
  }

  return (
    <Disclosure>
      {({ open }) => (
        <>
          <DisclosureButton className="group flex justify-between border-t border-t-gray-200 bg-amber-50 text-left hover:bg-yellow-50">
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
                      checked={currentStyle === option.key}
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

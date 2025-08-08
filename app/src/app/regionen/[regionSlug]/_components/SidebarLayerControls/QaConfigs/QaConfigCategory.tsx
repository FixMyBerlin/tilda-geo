import { linkStyles } from '@/src/app/_components/links/styles'
import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon, ListBulletIcon } from '@heroicons/react/20/solid'
import { Fragment, Suspense, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { useQaParam } from '../../../_hooks/useQueryState/useQaParam'
import { useRegionSlug } from '../../regionUtils/useRegionSlug'
import { QaIcon } from '../../SidebarInspector/InspectorQa/QaIcon'
import { QaAreasListDialog, qaAreasStatusMap } from './QaAreasListDialog'
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
  const regionSlug = useRegionSlug()
  const [dialogState, setDialogState] = useState<QaStyleKey | null>(null)

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
    <Fragment>
      <Disclosure>
        {({ open }) => (
          <>
            <DisclosureButton
              className={twJoin(
                'group flex justify-between border-t border-t-gray-200 text-left',
                open || isSelected
                  ? 'bg-violet-50 hover:bg-violet-100'
                  : 'bg-gray-50 hover:bg-gray-100',
              )}
            >
              <div
                className={twJoin(
                  'ml-1.5 flex min-h-[3rem] w-full flex-col items-start text-sm leading-[17px]',
                  isSelected ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900',
                  'justify-center',
                )}
              >
                <h2 className="flex items-center gap-1 font-semibold">
                  <QaIcon isActive={qaConfig.isActive} className="size-5" />
                  <span>
                    {qaConfig.label}{' '}
                    {/* {qaConfig.isActive ? null : <Pill color="gray">deaktiviert</Pill>} */}
                  </span>
                </h2>
              </div>
              <div className="flex min-h-[3rem] flex-none items-center justify-center px-1 text-violet-500">
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
                <div className="mx-2 space-y-1">
                  {QA_STYLE_OPTIONS.map((option) => (
                    <label key={option.key} className="flex items-center gap-2 text-xs">
                      <input
                        type="radio"
                        name={`qa-style-${qaConfig.slug}`}
                        value={option.key}
                        checked={currentStyle === option.key}
                        onChange={() => handleStyleChange(option.key)}
                        className="h-3 w-3 text-violet-600 focus:ring-violet-500"
                      />
                      <div className="flex w-full justify-between">
                        <span>{option.label}</span>
                        {qaAreasStatusMap[option.key] !== null && (
                          <span>
                            <button
                              type="button"
                              onClick={() => setDialogState(option.key)}
                              className={twJoin('text-xs', linkStyles)}
                            >
                              <ListBulletIcon className="size-4" />
                            </button>
                            {/* QA Areas List Dialog */}
                            <Suspense
                              fallback={dialogState === option.key ? <SmallSpinner /> : null}
                            >
                              <QaAreasListDialog
                                configSlug={qaConfig.slug}
                                regionSlug={regionSlug!}
                                styleKey={dialogState}
                                setClosed={() => setDialogState(null)}
                              />
                            </Suspense>
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </DisclosurePanel>
            </Transition>
          </>
        )}
      </Disclosure>
    </Fragment>
  )
}

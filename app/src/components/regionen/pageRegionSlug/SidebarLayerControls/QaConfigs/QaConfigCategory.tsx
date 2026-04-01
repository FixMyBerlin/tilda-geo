import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon, ListBulletIcon } from '@heroicons/react/20/solid'
import { Suspense, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { linkStyles } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { QaIcon } from '../../SidebarInspector/InspectorQa/QaIcon'
import { QaAreasListDialog } from './QaAreasListDialog'
import { QaUserDropdown } from './QaUserDropdown'
import { isListableOption, type QaStyleKey } from './qaConfigStyles'
import { QA_STYLE_OPTIONS } from './qaConfigStyles'

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
  const showUserDropdown = currentStyle === 'user-selected' && isSelected

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
    <Disclosure as="div">
      {({ open }) => (
        <>
          <DisclosureButton
            className={twJoin(
              'group flex w-full justify-between border-t border-t-gray-200 text-left',
              open || isSelected
                ? 'bg-violet-50 hover:bg-violet-100'
                : 'bg-gray-50 hover:bg-gray-100',
            )}
          >
            <div
              className={twJoin(
                'ml-1.5 flex min-h-12 flex-col items-start text-sm leading-[17px]',
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
            <div className="flex min-h-12 flex-none items-center justify-center px-1 text-violet-500">
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
            <DisclosurePanel static as="section" className="mt-1 mb-2">
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
                    <div className="flex min-w-0 flex-1 items-center justify-between">
                      <span>{option.label}</span>
                      {isListableOption(option) && (
                        <button
                          type="button"
                          onClick={() => setDialogState(option.key)}
                          className={twJoin(
                            'ml-2 shrink-0 text-xs',
                            linkStyles,
                            'disabled:pointer-events-none disabled:cursor-default disabled:no-underline disabled:opacity-60',
                          )}
                          disabled={currentStyle !== option.key}
                          title={
                            currentStyle !== option.key
                              ? 'Kategorie auswählen, um die Liste zu öffnen'
                              : 'Liste anzeigen'
                          }
                        >
                          <ListBulletIcon className="size-4" />
                        </button>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <Suspense fallback={dialogState !== null ? <SmallSpinner /> : null}>
                <QaAreasListDialog
                  configSlug={qaConfig.slug}
                  regionSlug={regionSlug}
                  styleKey={dialogState ?? 'none'}
                  setClosed={() => setDialogState(null)}
                />
              </Suspense>
              {showUserDropdown && (
                <QaUserDropdown configId={qaConfig.id} regionSlug={regionSlug} />
              )}
            </DisclosurePanel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}

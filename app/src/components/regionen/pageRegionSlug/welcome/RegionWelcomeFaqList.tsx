import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import { MotionCollapse } from '@/components/shared/motion/MotionCollapse'
import { Markdown } from '@/components/shared/text/Markdown'
import { proseInvertedPanelClasses } from '@/components/shared/text/prose'
import type { TRegionWelcomeSection } from '@/server/regions/regionConfigMapper.server'

type Props = {
  sections: TRegionWelcomeSection[]
  columns?: 1 | 2
}

export const RegionWelcomeFaqList = ({ sections, columns = 1 }: Props) => {
  return (
    <div
      className={twJoin('grid grid-cols-1 gap-3', columns === 2 && 'lg:grid-cols-2 lg:gap-x-4.5')}
    >
      {sections.map((section) => (
        <Disclosure
          key={`${section.sortOrder}-${section.title}`}
          as="div"
          className="overflow-hidden rounded-xl bg-gray-800/80 ring-1 ring-white/10"
        >
          {({ open }) => (
            <>
              <DisclosureButton className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] focus-visible:ring focus-visible:ring-brand focus-visible:outline-none">
                <span className="text-base font-semibold text-white sm:text-lg">
                  {section.title}
                </span>
                <ChevronDownIcon
                  aria-hidden
                  className={`size-6 flex-none text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </DisclosureButton>
              {section.bodyMarkdown?.trim() ? (
                <MotionCollapse open={open}>
                  <DisclosurePanel static className="px-5 pb-4 text-lg/6 text-gray-300">
                    <Markdown
                      markdown={section.bodyMarkdown}
                      headingStyle="document"
                      className={twJoin(proseInvertedPanelClasses, 'prose-p:leading-6')}
                    />
                  </DisclosurePanel>
                </MotionCollapse>
              ) : null}
            </>
          )}
        </Disclosure>
      ))}
    </div>
  )
}

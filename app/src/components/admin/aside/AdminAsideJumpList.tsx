import { useEffect, useRef } from 'react'
import { twJoin } from 'tailwind-merge'
import {
  adminAsideJumpItemActiveClassName,
  adminAsideJumpItemClassName,
} from '@/components/admin/adminClasses'
import { filterChipStyles, filterChipStylesActive } from '@/components/shared/links/styles'
import type { AdminAsideSection } from './adminAsideSection'

type Props = {
  sections: AdminAsideSection[]
  activeId: string | undefined
  onJump: (id: string) => void
  /** `list`: desktop aside column; `chips`: horizontal scroller in the mobile bar. */
  variant: 'list' | 'chips'
}

export const AdminAsideJumpList = ({ sections, activeId, onJump, variant }: Props) => {
  const scrollerRef = useRef<HTMLElement>(null)

  useEffect(
    function keepActiveChipInView() {
      if (variant !== 'chips') return
      const scroller = scrollerRef.current
      const chip = scroller?.querySelector<HTMLElement>('[aria-current="location"]')
      if (!scroller || !chip) return
      // Scroll the chip row only — `scrollIntoView` would interrupt a running page scroll.
      const left = chip.offsetLeft - (scroller.clientWidth - chip.offsetWidth) / 2
      scroller.scrollTo({ left, behavior: 'auto' })
    },
    [activeId, variant],
  )

  return (
    <nav
      ref={scrollerRef}
      aria-label="Abschnitte"
      className={variant === 'chips' ? 'min-w-0 flex-1 overflow-x-auto' : undefined}
    >
      <ul className={variant === 'chips' ? 'flex w-max gap-1.5 py-0.5' : 'space-y-0.5'}>
        {sections.map((section) => {
          const active = section.id === activeId
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active ? 'location' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  onJump(section.id)
                }}
                className={
                  variant === 'chips'
                    ? twJoin(
                        active ? filterChipStylesActive : filterChipStyles,
                        'whitespace-nowrap',
                      )
                    : active
                      ? adminAsideJumpItemActiveClassName
                      : adminAsideJumpItemClassName
                }
              >
                {section.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

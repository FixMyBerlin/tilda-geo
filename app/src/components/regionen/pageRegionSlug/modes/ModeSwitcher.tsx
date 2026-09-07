import { getRouteApi, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { UI_SPRING } from '@/components/shared/motion/spring.const'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import {
  modeAccentInvertedClassName,
  modeAccentInvertedFgClassName,
  modeAccentStyle,
  modeIdentity,
} from './modeIdentity'
import { type RegionMode, modeRoutePaths, useOptimisticMode } from './useCurrentMode'

const routeApi = getRouteApi('/regionen/$regionSlug')

const modeOrder: RegionMode[] = ['map', 'notes', 'qa', 'reviewLists']

const HOVER_LEAVE_MS = 200

const tabLayoutClassName =
  'inline-flex h-full shrink-0 items-center gap-1.5 px-3 text-sm font-medium'

/** Recessed track — reads as a window cut into the header bar. */
const modeSwitcherTrackClassName =
  'shadow-[inset_0_1px_2px_rgb(0_0_0/0.18),inset_0_1px_0_rgb(255_255_255/0.04)]'

/** Active/hover pill lifts above the recessed track. */
const modeSwitcherPillElevationClassName = 'shadow-md'

type HighlightPill = {
  left: number
  width: number
  navWidth: number
}

/**
 * Header links between region mode pages. Search params stay on the URL so map view, category
 * config, and per-mode filters survive a switch. Hidden when only the default map is available.
 */
export const ModeSwitcher = () => {
  const { regionSlug } = routeApi.useParams()
  const { availableModes } = routeApi.useLoaderData()
  const optimisticMode = useOptimisticMode()
  const [hoveredMode, setHoveredMode] = useState<RegionMode | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<Partial<Record<RegionMode, HTMLElement | null>>>({})
  const [pill, setPill] = useState<HighlightPill | null>(null)

  useEffect(function cleanupHoverTimeoutOnUnmount() {
    return function clearHoverTimeout() {
      if (hoverTimeoutRef.current !== null) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const modes = modeOrder.filter((mode) => mode === 'map' || availableModes[mode])
  const highlightedMode = hoveredMode ?? optimisticMode

  useLayoutEffect(
    function measureHighlightedTab() {
      function measure() {
        const nav = navRef.current
        const tab = tabRefs.current[highlightedMode]
        if (!nav || !tab) return
        const navRect = nav.getBoundingClientRect()
        const tabRect = tab.getBoundingClientRect()
        const next = {
          left: tabRect.left - navRect.left,
          width: tabRect.width,
          navWidth: navRect.width,
        }
        setPill((prev) => {
          if (
            prev &&
            prev.left === next.left &&
            prev.width === next.width &&
            prev.navWidth === next.navWidth
          ) {
            return prev
          }
          return next
        })
      }

      measure()

      const nav = navRef.current
      if (!nav) return

      const observer = new ResizeObserver(measure)
      observer.observe(nav)
      for (const tab of Object.values(tabRefs.current)) {
        if (tab) observer.observe(tab)
      }

      return function disconnectTabResizeObserver() {
        observer.disconnect()
      }
    },
    [highlightedMode, availableModes.notes, availableModes.qa, availableModes.reviewLists],
  )

  if (modes.length <= 1) return null

  const highlightedIdentity = modeIdentity[highlightedMode]

  return (
    <nav
      ref={navRef}
      aria-label="Modus"
      className={twJoin(
        'relative isolate inline-flex h-10 items-center rounded-md bg-gray-700 p-1',
        modeSwitcherTrackClassName,
      )}
    >
      {modes.map((mode) => {
        const identity = modeIdentity[mode]
        const Icon = identity.icon
        const active = optimisticMode === mode
        return (
          <Link
            key={mode}
            ref={(node: HTMLAnchorElement | null) => {
              tabRefs.current[mode] = node
            }}
            from="/regionen/$regionSlug"
            to={modeRoutePaths[mode]}
            params={{ regionSlug }}
            search={(prev) => {
              // Compose is Hinweise-only; strip create params when leaving so the map unlocks.
              if (mode === 'notes') return prev
              if (
                prev[searchParamsRegistry.osmNote] === undefined &&
                prev[searchParamsRegistry.internalNote] === undefined
              ) {
                return prev
              }
              const next = { ...prev }
              delete next[searchParamsRegistry.osmNote]
              delete next[searchParamsRegistry.internalNote]
              return next
            }}
            className={twJoin(
              tabLayoutClassName,
              'rounded text-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-white',
            )}
            aria-current={active ? 'page' : undefined}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current !== null) {
                clearTimeout(hoverTimeoutRef.current)
                hoverTimeoutRef.current = null
              }
              setHoveredMode(mode)
            }}
            onMouseLeave={() => {
              hoverTimeoutRef.current = setTimeout(() => {
                setHoveredMode(null)
              }, HOVER_LEAVE_MS)
            }}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {identity.label}
          </Link>
        )
      })}
      {pill && (
        <motion.div
          aria-hidden
          className={twJoin(
            'pointer-events-none absolute top-1 bottom-1 left-0 z-10 overflow-hidden',
            modeSwitcherPillElevationClassName,
            modeAccentInvertedClassName,
          )}
          style={{ borderRadius: 4, ...modeAccentStyle(highlightedIdentity.accent) }}
          initial={false}
          animate={{
            x: pill.left,
            width: pill.width,
            backgroundColor: highlightedIdentity.accent,
          }}
          transition={UI_SPRING}
        >
          <motion.div
            className="absolute top-0 left-0 flex h-full items-center px-1"
            style={{ width: pill.navWidth }}
            initial={false}
            animate={{ x: -pill.left }}
            transition={UI_SPRING}
          >
            {modes.map((mode) => {
              const identity = modeIdentity[mode]
              const Icon = identity.icon
              return (
                <span
                  key={mode}
                  className={twJoin(tabLayoutClassName, modeAccentInvertedFgClassName(mode))}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {identity.label}
                </span>
              )
            })}
          </motion.div>
        </motion.div>
      )}
    </nav>
  )
}

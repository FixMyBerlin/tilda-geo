import { useEffect, useRef, useState } from 'react'
import { adminActiveSectionRootMargin } from '@/components/admin/adminClasses'
import { scrollToAdminSection } from './adminAsideSection'

/**
 * Scroll-spy for `AdminAsideLayout`: the first section (in document order) crossing the band
 * `adminActiveSectionRootMargin` is active. A jump (click or URL hash on load) pins its target
 * until the user scrolls themselves, so short sections at the page end stay highlighted.
 */
export const useActiveSectionId = (sectionIds: string[]) => {
  const [activeId, setActiveId] = useState(sectionIds[0])
  const pinnedIdRef = useRef<string | null>(null)
  const idsKey = sectionIds.join(' ')

  useEffect(
    function observeSectionsInBand() {
      if (!idsKey || typeof IntersectionObserver === 'undefined') return
      const ids = idsKey.split(' ')
      const intersecting = new Set<string>()
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) intersecting.add(entry.target.id)
            else intersecting.delete(entry.target.id)
          }
          const nextId = pinnedIdRef.current ?? ids.find((id) => intersecting.has(id))
          if (nextId) setActiveId(nextId)
        },
        { rootMargin: adminActiveSectionRootMargin },
      )
      for (const id of ids) {
        const element = document.getElementById(id)
        if (element) observer.observe(element)
      }
      return () => observer.disconnect()
    },
    [idsKey],
  )

  useEffect(function releasePinOnUserScroll() {
    const release = () => {
      pinnedIdRef.current = null
    }
    const options = { passive: true }
    window.addEventListener('wheel', release, options)
    window.addEventListener('touchmove', release, options)
    window.addEventListener('keydown', release)
    return () => {
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchmove', release)
      window.removeEventListener('keydown', release)
    }
  }, [])

  useEffect(
    function scrollToHashSectionOnLoad() {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!id || !idsKey.split(' ').includes(id)) return
      // The observer’s next callback (fired by this scroll) applies the pin.
      if (scrollToAdminSection(id, 'auto')) pinnedIdRef.current = id
    },
    [idsKey],
  )

  const jumpToSection = (id: string) => {
    if (!scrollToAdminSection(id)) return
    pinnedIdRef.current = id
    setActiveId(id)
  }

  return { activeId, jumpToSection }
}

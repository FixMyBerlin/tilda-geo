import { useSyncExternalStore } from 'react'

// https://tailwindcss.com/docs/screens
const screens = {
  sm: '640px', // => @media (min-width: 640px) { ... }
  md: '768px', // => @media (min-width: 768px) { ... }
  lg: '1024px', // => @media (min-width: 1024px) { ... }
  xl: '1280px', // => @media (min-width: 1280px) { ... }
  '2xl': '1536px', // => @media (min-width: 1536px) { ... }
}

export const useBreakpoint = (breakpoint: keyof typeof screens) => {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia(`(min-width: ${screens[breakpoint]})`)
      mediaQuery.addEventListener('change', onStoreChange)
      return () => mediaQuery.removeEventListener('change', onStoreChange)
    },
    () => {
      if (typeof window === 'undefined') return false
      return window.matchMedia(`(min-width: ${screens[breakpoint]})`).matches
    },
    () => false, // Server fallback
  )
}

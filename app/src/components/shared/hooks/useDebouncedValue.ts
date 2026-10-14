import { useEffect, useState } from 'react'

/** Debounce a value via a timer (a legitimate external-timing effect; see react-useeffect skill). */
export const useDebouncedValue = <T>(value: T, delayMs: number) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(
    function syncDebouncedValue() {
      const timer = setTimeout(() => setDebounced(value), delayMs)
      return function cancelDebounce() {
        clearTimeout(timer)
      }
    },
    [value, delayMs],
  )
  return debounced
}

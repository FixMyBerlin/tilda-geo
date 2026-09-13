import { useOptimisticMode } from './useCurrentMode'

/** True on Hinweise, QA, or Prüflisten (including in-flight navigation). False on the default map route. */
export const useIsModeRoute = () => useOptimisticMode() !== 'map'

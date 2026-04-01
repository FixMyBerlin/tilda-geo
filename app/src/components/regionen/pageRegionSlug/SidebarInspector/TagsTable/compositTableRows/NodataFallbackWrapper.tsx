import { NodataFallback } from './NodataFallback'

export const NodataFallbackWrapper = ({
  fallback,
  children,
}: {
  fallback: boolean
  children: React.ReactNode
}) => {
  if (fallback === false && children) return <>{children}</>

  return <NodataFallback />
}

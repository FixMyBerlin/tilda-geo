import { isDev } from '../utils/isEnv'
import { RenderIfNotDoNotNavigateLinks } from './RenderIfNotDoNotNavigateLinks'

export function RenderIfNotDoNotNavigate({ children }: { children: React.ReactNode }) {
  const doNotNavigate = !!import.meta.env.VITE_DO_NOT_NAVIGATE

  return isDev && doNotNavigate ? (
    <div className="flex items-center justify-between">
      <pre className="text-red-400">VITE_DO_NOT_NAVIGATE</pre>
      <RenderIfNotDoNotNavigateLinks />
    </div>
  ) : (
    children
  )
}

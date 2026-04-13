import { ClientOnly } from '@tanstack/react-router'
import {
  useMapDebugActions,
  useMapDebugShowDebugInfo,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { useMapDebugSnapshot } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { simplifyConfigForParams } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/utils/simplifyConfigForParams'
import { useDrawParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDrawParam'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { Link } from '@/components/shared/links/Link'
import { getOsmUrl } from '@/components/shared/utils/getOsmUrl'

// A custom formatter to get a more compact output
// Prefix [ signals an array, { signals an object

function formatConfig(config: Record<string, unknown>, indent = 0): string {
  let result = ''
  const keys = Object.keys(config)
  for (const key of keys) {
    const value = config[key]
    const formattedValue =
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? formatConfig(value as Record<string, unknown>, indent + 2)
        : value
    const prefix = Array.isArray(value) ? '[ ' : '{ '
    result += `\n${' '.repeat(indent)}${prefix}${key}: ${formattedValue}`
  }
  return result
}

export const DebugStateInteraction = () => {
  const regionSlug = useRegionSlug()
  const zustandValues = useMapDebugSnapshot()
  const showDebugInfo = useMapDebugShowDebugInfo()
  const { setShowDebugInfo } = useMapDebugActions()
  const { categoriesConfig } = useCategoriesConfig()
  const { drawParam } = useDrawParam()
  // const { config: configCategories, draw: drawAreasStore } = useSearch<LocationGenerics>()

  const keyValue = (object: Record<string, unknown> | object | null) => {
    if (object === null || typeof object !== 'object') return null
    return Object.entries(object).map(([key, value]) => {
      if (typeof value === 'function') return null
      return (
        <div key={key}>
          <strong>{key}:</strong> <pre>{JSON.stringify(value, null, 2)}</pre>
        </div>
      )
    })
  }

  if (!showDebugInfo) return null

  return (
    <ClientOnly fallback={null}>
      <div className="group absolute top-3 right-12 z-30 max-h-[95%] max-w-[60%] space-y-0.5 overflow-y-auto rounded bg-pink-300 px-2 py-2 text-[10px] shadow-xl">
        <button
          type="button"
          className="absolute top-0 right-0 z-10 flex size-5 items-center justify-center rounded-full border bg-purple-500/90 opacity-0 group-hover:opacity-100 hover:bg-purple-800 hover:text-purple-200"
          onClick={() => setShowDebugInfo(false)}
        >
          &times;
        </button>
        <details>
          <summary className="cursor-pointer">Helper</summary>
          <div className="flex flex-col gap-1">
            <Link to="/regionen/$regionSlug" params={{ regionSlug }} className="rounded border p-1">
              Reset URL <code>config</code>
            </Link>
          </div>
          <div className="font-mono">VITE_APP_ENV: {import.meta.env.VITE_APP_ENV}</div>
          <div className="font-mono">VITE_APP_ORIGIN: {import.meta.env.VITE_APP_ORIGIN}</div>
          <div className="font-mono">
            import.meta.env: DEV={String(import.meta.env.DEV)} MODE={import.meta.env.MODE}
          </div>
          <div className="font-mono">OSM URL={getOsmUrl()}</div>
        </details>

        <details>
          <summary className="cursor-pointer">Zustand</summary>
          <div className="font-mono">{keyValue(zustandValues)}</div>
        </details>

        <details>
          <summary className="cursor-pointer">?config</summary>
          {Boolean(categoriesConfig?.length) &&
            categoriesConfig?.map((config) => {
              return (
                <div key={config.id}>
                  <details>
                    <summary className="cursor-pointer">{config.id} Full config</summary>
                    <pre>
                      <code>{JSON.stringify(config, undefined, 2)}</code>
                    </pre>
                  </details>
                  <details>
                    <summary className="cursor-pointer">{config.id} URL params</summary>
                    <pre>
                      <code>
                        {formatConfig({
                          config: simplifyConfigForParams([config]) as unknown,
                        } as Record<string, unknown>)}
                      </code>
                    </pre>
                  </details>
                </div>
              )
            })}
        </details>

        {Boolean(drawParam?.length) &&
          drawParam?.map((draw) => {
            return (
              <details key={draw.id ?? 'draw'}>
                <summary className="cursor-pointer">{draw.id ?? 'draw'}</summary>
                <pre>
                  <code>{formatConfig({ draw })}</code>
                </pre>
              </details>
            )
          })}
      </div>
    </ClientOnly>
  )
}

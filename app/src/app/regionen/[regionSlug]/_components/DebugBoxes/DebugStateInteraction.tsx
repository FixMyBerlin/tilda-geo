import { Link } from '@/src/app/_components/links/Link'
import { getOsmUrl } from '@/src/app/_components/utils/getOsmUrl'
import { useRegionSlug } from '@/src/app/regionen/[regionSlug]/_components/regionUtils/useRegionSlug'
import {
  useMapDebugActions,
  useMapDebugShowDebugInfo,
} from '../../_hooks/mapState/useMapDebugState'
import { useMapState } from '../../_hooks/mapState/useMapState'
import { useCategoriesConfig } from '../../_hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { simplifyConfigForParams } from '../../_hooks/useQueryState/useCategoriesConfig/utils/simplifyConfigForParams'
import { useDrawParam } from '../../_hooks/useQueryState/useDrawParam'

// A custom formatter to get a more compact output
// Prefix [ signals an array, { signals an object
function formatConfig(config: any, indent = 0): string {
  let result = ''
  const keys = Object.keys(config)
  for (const key of keys) {
    const value = config[key]
    const formattedValue = typeof value === 'object' ? formatConfig(value, indent + 2) : value
    const prefix = Array.isArray(value) ? '[ ' : '{ '
    result += `\n${' '.repeat(indent)}${prefix}${key}: ${formattedValue}`
  }
  return result
}

export const DebugStateInteraction = () => {
  const regionSlug = useRegionSlug()
  const zustandValues = useMapState()
  const showDebugInfo = useMapDebugShowDebugInfo()
  const { setShowDebugInfo } = useMapDebugActions()
  const { categoriesConfig } = useCategoriesConfig()
  const { drawParam } = useDrawParam()
  // const { config: configCategories, draw: drawAreasStore } = useSearch<LocationGenerics>()

  const keyValue = (object: any) => {
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
    <div className="group absolute top-3 right-12 z-30 max-h-[95%] max-w-[60%] space-y-0.5 overflow-y-auto rounded bg-pink-300 px-2 py-2 text-[10px] shadow-xl">
      <button
        className="absolute top-0 right-0 z-10 flex h-5 w-5 items-center justify-center rounded-full border bg-purple-500/90 opacity-0 group-hover:opacity-100 hover:bg-purple-800 hover:text-purple-200"
        onClick={() => setShowDebugInfo(false)}
      >
        &times;
      </button>
      <details>
        <summary className="cursor-pointer">Helper</summary>
        <div className="flex flex-col gap-1">
          <Link href={`/regionen/${regionSlug}`} className="rounded border p-1">
            Reset URL <code>config</code>
          </Link>
        </div>
        <div className="font-mono">env.*ENV: {process.env.NEXT_PUBLIC_APP_ENV}</div>
        <div className="font-mono">env.*APP_ORIGIN: {process.env.NEXT_PUBLIC_APP_ORIGIN}</div>
        <div className="font-mono">env.NODE_ENV: {process.env.NODE_ENV}</div>
        <div className="font-mono">OSM URL={getOsmUrl()}</div>
      </details>

      <details>
        <summary className="cursor-pointer">Zustand</summary>
        <div className="font-mono">{keyValue(zustandValues)}</div>
      </details>

      <details>
        <summary className="cursor-pointer">?config</summary>
        {Boolean(categoriesConfig?.length) &&
          categoriesConfig?.map((config: any) => {
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
                    <code>{formatConfig(simplifyConfigForParams([config]))}</code>
                  </pre>
                </details>
              </div>
            )
          })}
      </details>

      {Boolean(drawParam?.length) &&
        drawParam?.map((draw: any) => {
          return (
            <details key={draw.id}>
              <summary className="cursor-pointer">{draw.id}</summary>
              <pre>
                <code>{formatConfig({ draw })}</code>
              </pre>
            </details>
          )
        })}
    </div>
  )
}

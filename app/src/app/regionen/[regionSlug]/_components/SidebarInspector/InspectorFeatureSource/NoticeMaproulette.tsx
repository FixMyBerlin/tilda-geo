import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import { todoIds } from '@/src/data/processingTypes/todoId.generated.const'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GeoJsonProperties } from 'geojson'
import { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { NoticeMaprouletteTask } from './NoticeMaprouletteTask'
import { todoMarkdownToMaprouletteCampaignKey } from './utils/todoMarkdownToMaprouletteCampaignKey'

const maprouletteQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true
    },
  },
})

export type NoticeMaproulette = {
  sourceId: string
  osmTypeIdString: string | undefined
  kind: string | undefined
  properties: NonNullable<GeoJsonProperties>
  geometry: MapGeoJSONFeature['geometry'] | undefined
}

export const NoticeMaproulette = ({
  sourceId,
  osmTypeIdString,
  kind,
  properties,
  geometry,
}: NoticeMaproulette) => {
  // This is how we store todos on `bikelanes`, `roads`
  const todosKeyFromTodoTag = todoMarkdownToMaprouletteCampaignKey(properties?.todos)
  // This is how we store todos on `todos_lines`
  const todoKeysFromKeys = todoIds.filter((id) => Object.keys(properties).includes(id))
  // When we are on `bikelanes`, `roads`, we only show some todos
  const maprouletteProjectKeys =
    sourceId === 'atlas_todos_lines' ? todoKeysFromKeys : todosKeyFromTodoTag

  if (!maprouletteProjectKeys.length || !osmTypeIdString || geometry?.type !== 'LineString') {
    return null
  }

  const defaultOpen = sourceId.includes('todos_lines')
  const showOsmEditWarning = sourceId.includes('todos_lines')

  return (
    <QueryClientProvider client={maprouletteQueryClient}>
      <details
        // Color similar to #fda5e4
        className="prose prose-sm border-t border-white bg-pink-200 p-1 px-4 py-1.5"
        open={defaultOpen}
      >
        <summary className="cursor-pointer hover:font-semibold">
          {/* NOTE: `maprouletteProjectKeys` is not ideal here because we might show viewer text block which is decided in the child component */}
          Aufgabe{maprouletteProjectKeys.length > 1 ? 'n' : ''} zur Datenverbesserung (
          {maprouletteProjectKeys.length})
        </summary>

        {showOsmEditWarning && (
          <div className="mt-4 rounded bg-pink-300 px-4 py-3">
            <strong>Willkommen!</strong> Bitte ändere in OpenStreetMap nur das, von dem du sicher
            bist, dass es eine <strong>gute und richtige Änderung</strong> ist. <br />
            <LinkExternal href="https://radinfra.de/kontakt/" blank>
              Kontakt bei Fragen…
            </LinkExternal>{' '}
            <br />
            <LinkExternal href="https://radinfra.de/mitmachen/" blank>
              Einfachere Wege mitzuhelfen…
            </LinkExternal>
          </div>
        )}

        <div className="my-0 ml-3">
          {maprouletteProjectKeys.map((projectKey) => {
            return (
              <NoticeMaprouletteTask
                key={projectKey}
                projectKey={projectKey}
                osmTypeIdString={osmTypeIdString}
                kind={kind}
                properties={properties}
                geometry={geometry}
              />
            )
          })}
        </div>
      </details>
    </QueryClientProvider>
  )
}

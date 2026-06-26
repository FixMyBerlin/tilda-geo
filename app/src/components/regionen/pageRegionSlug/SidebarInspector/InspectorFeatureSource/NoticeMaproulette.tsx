import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { GeoJsonProperties } from 'geojson'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { Link } from '@/components/shared/links/Link'
import { todoIds } from '@/data/processingTypes/todoId.generated.const'
import {
  resolveTaskDisclosureOpen,
  useMaprouletteOpenProjectKey,
  useMaprouletteTasksActions,
} from './maproulette-tasks-store'
import { NoticeMaprouletteTaskDisclosure } from './NoticeMaprouletteTaskDisclosure'
import { filterMaprouletteProjectKeys } from './utils/filterMaprouletteProjectKeys'
import { getActiveRadinfraCampaignStyleId } from './utils/getActiveRadinfraCampaignStyleId'
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
  const { categoriesConfig } = useCategoriesConfig()
  const openProjectKey = useMaprouletteOpenProjectKey()
  const { setOpenProjectKey } = useMaprouletteTasksActions()

  // This is how we store todos on `bikelanes`, `roads`
  const todosKeyFromTodoTag = todoMarkdownToMaprouletteCampaignKey(properties?.todos)
  // This is how we store todos on `todos_lines`
  const todoKeysFromKeys = todoIds.filter((id) => Object.keys(properties).includes(id))
  // When we are on `bikelanes`, `roads`, we only show some todos
  const rawMaprouletteProjectKeys =
    sourceId === 'atlas_todos_lines' ? todoKeysFromKeys : todosKeyFromTodoTag
  const maprouletteProjectKeys = filterMaprouletteProjectKeys(
    rawMaprouletteProjectKeys,
    getActiveRadinfraCampaignStyleId(categoriesConfig),
  )

  if (!maprouletteProjectKeys.length || !osmTypeIdString || geometry?.type !== 'LineString') {
    return null
  }

  const defaultOpen = sourceId.includes('todos_lines')
  const showWelcome = sourceId.includes('todos_lines')

  return (
    <QueryClientProvider client={maprouletteQueryClient}>
      <details
        // Color similar to #fda5e4
        className="prose prose-sm w-full max-w-none border-t border-white bg-pink-200 px-4 py-1.5"
        open={defaultOpen}
      >
        <summary className="cursor-pointer hover:font-semibold">
          Aufgabe{maprouletteProjectKeys.length > 1 ? 'n' : ''} zur Datenverbesserung (
          {maprouletteProjectKeys.length})
        </summary>

        <div className="mt-3 pb-3">
          {showWelcome && (
            <div className="rounded bg-pink-300 px-4 py-3">
              <strong>Willkommen!</strong> Bitte ändere in OpenStreetMap nur das, von dem du sicher
              bist, dass es eine <strong>gute und richtige Änderung</strong> ist. <br />
              <Link href="https://radinfra.de/kontakt/" blank>
                Kontakt bei Fragen…
              </Link>{' '}
              <br />
              <Link href="https://radinfra.de/mitmachen/" blank>
                Einfachere Wege mitzuhelfen…
              </Link>
            </div>
          )}

          <div className={showWelcome ? 'mt-3 flex flex-col gap-2' : 'flex flex-col gap-2'}>
            {maprouletteProjectKeys.map((projectKey) => {
              const isOpen = resolveTaskDisclosureOpen(
                projectKey,
                maprouletteProjectKeys,
                openProjectKey,
              )

              return (
                <NoticeMaprouletteTaskDisclosure
                  key={projectKey}
                  projectKey={projectKey}
                  open={isOpen}
                  onOpenChange={(nextOpen) => setOpenProjectKey(nextOpen ? projectKey : null)}
                  osmTypeIdString={osmTypeIdString}
                  kind={kind}
                  properties={properties}
                  geometry={geometry}
                />
              )
            })}
          </div>
        </div>
      </details>
    </QueryClientProvider>
  )
}

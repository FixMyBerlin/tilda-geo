import { useQuery } from '@tanstack/react-query'
import { Fragment } from 'react'
import { z } from 'zod'
import { Link } from '@/components/shared/links/Link'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { Markdown } from '@/components/shared/text/Markdown'
import type { TodoId } from '@/data/processingTypes/todoId.generated.const'
import { campaigns } from '@/data/radinfra-de/campaigns'
import { buildHashtags } from '@/data/radinfra-de/utils/buildHashtags'
import { buildTaskInstructions } from '@/data/radinfra-de/utils/buildTaskInstructions'
import { osmEditIdUrl, osmEditJosmUrl, osmEditKyleKiwiIdUrl } from '../Tools/osmUrls/osmUrls'
import { pointFromGeometry } from '../Tools/osmUrls/pointFromGeometry'
import type { NoticeMaproulette } from './NoticeMaproulette'

// const maprouletteStatus = new Map([
//   [0, 'Offen'],
//   [1, 'Erledigt'],
//   [2, 'Erledigt (war kein Problem)'],
//   [3, 'Offen (übersprungen)'],
//   [4, 'Gelöscht'],
//   [5, 'Erledigt (war bereits erledigt)'],
//   [6, 'Offen (zu schwer?)'],
// ])
const maprouletteStatusCompleted = [1, 2, 4, 5]

const maprouletteTaskSchema = z.object({
  id: z.number(),
  // https://maproulette-python-client.readthedocs.io/en/latest/usage/functionality.html
  //  0 = Created, 1 = Fixed, 2 = False Positive, 3 = Skipped, 4 = Deleted, 5 = Already Fixed, 6 = Too Hard
  status: z.number(),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
})

const fetchMapRouletteTask = async (
  mapRouletteId: number | null | undefined,
  osmTypeIdString: string | undefined,
) => {
  const url = `https://maproulette.org/api/v2/challenge/${mapRouletteId || 'MISSING'}/task/${encodeURIComponent(osmTypeIdString || 'MISSING')}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const json = await response.json()
  return maprouletteTaskSchema.parse(json)
}

type Props = { projectKey: TodoId } & Omit<NoticeMaproulette, 'sourceId'> & {
    osmTypeIdString: string
  }

export const NoticeMaprouletteTask = ({
  projectKey,
  osmTypeIdString,
  kind,
  properties,
  geometry,
}: Props) => {
  const radinfraCampaign = campaigns?.find((c) => c.id === projectKey)
  const maprouletteCampaign =
    radinfraCampaign?.maprouletteChallenge.enabled === true ? radinfraCampaign : undefined
  const mapRouletteId =
    maprouletteCampaign?.maprouletteChallenge?.enabled === true
      ? maprouletteCampaign?.maprouletteChallenge?.id
      : undefined

  const showMaproulette =
    radinfraCampaign?.recommendedAction === 'maproulette' &&
    radinfraCampaign?.maprouletteChallenge.enabled === true
  const showStreetcomplete = radinfraCampaign?.recommendedAction === 'streetcomplete'
  // const showEditor = radinfraCampaign?.recommendedAction === 'map'

  const { data, isLoading } = useQuery({
    queryKey: ['mapRouletteTask', mapRouletteId, properties.id],
    queryFn: () => fetchMapRouletteTask(mapRouletteId, properties.id),
    enabled: !!mapRouletteId,
  })

  if (geometry?.type !== 'LineString') return null

  const text = buildTaskInstructions({
    projectKey,
    osmTypeIdString,
    kind: kind || 'UNKOWN', // Fallback is needed because TS cannot know that we only use this when the `kind` is known
    geometry: geometry, // Guarded above
  })

  if (!text) {
    return <p>(Die Aufgabenbeschreibung ist noch in Arbeit)</p>
  }

  // The location of the MR pin is the best we can use, but we can always fall back to the one we use internally elsewhere
  const [centerLng, centerLat] = data?.location?.coordinates || pointFromGeometry(geometry)
  const rapidCampaignLink = `https://rapideditor.org/edit#map=19.5/${centerLat}/${centerLng}&maproulette=${mapRouletteId}&datasets=&disable_features=points,building_parts,indoor,boundaries,pistes,aerialways,power`

  const maprouletteTaskLink = isLoading
    ? undefined
    : data?.id
      ? `https://maproulette.org/challenge/${mapRouletteId}/task/${data.id}`
      : undefined

  const maprouletteCampaignLink = `https://maproulette.org/browse/challenges/${mapRouletteId}`

  const [osmType, osmId] = osmTypeIdString.split('/') as ['way' | 'node' | 'relation', string] // we know this is true
  const osmEditIdUrlHref = osmEditIdUrl({
    osmType,
    osmId,
    comment:
      radinfraCampaign?.maprouletteChallenge.enabled === true
        ? radinfraCampaign.maprouletteChallenge.checkinComment
        : undefined,
    hashtags: buildHashtags(
      radinfraCampaign?.id,
      radinfraCampaign?.category,
      radinfraCampaign?.maprouletteChallenge.enabled === true,
    )?.join(','),
    source: 'radinfra_de',
  })
  const osmEditJosmUrlHref = osmEditJosmUrl({ osmType, osmId })
  const osmEditKyleKiwiIdUrlHref = osmEditKyleKiwiIdUrl({ osmType, osmId })
  const completed = data?.status && maprouletteStatusCompleted.includes(data.status)

  return (
    <Fragment key={projectKey}>
      <h2>{radinfraCampaign?.title || `${projectKey} (in Arbeit)`}</h2>
      {!!mapRouletteId && (
        <p className="-mt-5 text-right text-xs">
          <Link href={maprouletteCampaignLink} title="MapRoulette" className="text-xs" blank>
            MR #{mapRouletteId}
          </Link>
        </p>
      )}
      <div className="mt-0 mb-5 flex flex-col items-center gap-1.5 rounded-sm bg-white/80 p-3">
        {showMaproulette && (
          <>
            <Link href={rapidCampaignLink} blank button>
              Kampagne im Rapid Editor bearbeiten
            </Link>
            {/* {osmEditIdUrlHref && (
              <Link href={osmEditIdUrlHref} blank button>
                Kampagne bearbeiten
              </Link>
            )} */}
            {isLoading ? (
              <span className="flex items-center gap-2 text-gray-400">
                <SmallSpinner /> Lade MapRoulette-Link…
              </span>
            ) : maprouletteTaskLink ? (
              <>
                {completed ? <strong>🎉 Die Aufgabe wurde bereits erledigt.</strong> : null}
                <Link href={maprouletteTaskLink} blank>
                  {completed ? 'MapRoulette öffnen' : 'Als MapRoulette Aufgabe bearbeiten'}
                </Link>
              </>
            ) : (
              <span className="text-gray-500">Fehler: Konnte MapRoulette URL nicht generieren</span>
            )}
          </>
        )}
        {showStreetcomplete && (
          <Link href="https://radinfra.de/mitmachen/streetcomplete/" blank button>
            Tipp: Nutze StreetComplete für diese Daten
          </Link>
        )}
        <div className="space-x-2">
          {osmEditIdUrlHref && (
            <Link
              href={osmEditIdUrlHref}
              blank
              button={
                showMaproulette
                  ? false
                  : showStreetcomplete
                    ? false
                    : isLoading === false && !maprouletteTaskLink
              }
            >
              Bearbeiten im iD Editor
            </Link>
          )}
          <Link href={rapidCampaignLink} blank>
            Rapid
          </Link>
          {osmEditJosmUrlHref && (
            <Link href={osmEditJosmUrlHref} blank>
              JOSM
            </Link>
          )}
          {osmEditKyleKiwiIdUrlHref && (
            <Link href={osmEditKyleKiwiIdUrlHref} blank>
              kiwiD
            </Link>
          )}
        </div>
      </div>
      <Markdown
        markdown={text}
        className="prose-sm mb-10 border-b-4 border-b-white pb-10 marker:text-purple-700 first:mt-5 last:mb-0 last:border-b-0"
      />
    </Fragment>
  )
}

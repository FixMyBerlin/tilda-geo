import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { buttonStylesOnYellow } from '@/src/app/_components/links/styles'
import createNote from '@/src/server/notes/mutations/createNote'
import { useSession } from '@blitzjs/auth'
import { getQueryClient, useMutation } from '@blitzjs/rpc'
import { useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useShowInternalNotesParam } from '../../../_hooks/useQueryState/useNotesAtlasParams'
import { useQueryKey } from '../../notes/InternalNotes/utils/useQueryKey'
import { useRegionSlug } from '../../regionUtils/useRegionSlug'
import { InspectorFeature } from '../Inspector'
import { pointFromGeometry } from '../Tools/osmUrls/pointFromGeometry'

export const RegionBbPgNewPriorityNoteButton = ({ feature }: Pick<InspectorFeature, 'feature'>) => {
  const { setShowInternalNotesParam } = useShowInternalNotesParam()
  const [createNoteMutation, { isLoading, error }] = useMutation(createNote)
  const regionSlug = useRegionSlug()
  const queryKey = useQueryKey()
  const session = useSession()
  const isAuthenticated = session.osmToken !== null
  const { mainMap } = useMap()

  const [formSubmitted, setFormSubmitted] = useState(false)

  if (true) return null // NOTE: REMOVE to enable the feature again (and the ts-expect-error below)
  if (regionSlug !== 'bb-pg') return null
  if (!isAuthenticated) return null
  if (!feature.layer.id.includes('bb-ramboll-netzentwurf-2')) return null

  const handleSubmit = async (
    importance: 'höchste Priorität' | 'hohe Priorität' | 'geringere Priorität',
  ) => {
    setShowInternalNotesParam(true)

    const body = `
Priorität: ${importance}

Verbindungs-ID: ${feature.properties.Verbindung}

Von: ${feature.properties.from_name}

Nach: ${feature.properties.to_name}

ID: ${feature.properties.id}

[Deeplink](${window.document.location.href})
`

    const point = pointFromGeometry(feature.geometry)
    createNoteMutation(
      {
        // @ts-expect-error
        regionSlug,
        subject: `Priorität: ${importance}`,
        latitude: point[1],
        longitude: point[0],
        body,
      },
      {
        onSuccess: () => {
          mainMap?.flyTo({ center: point, padding: { left: 270, right: 550 } })
          // mainMap?.fitBounds(
          //   buffer(feature.geometry, 100).geometry.bbox as [number, number, number, number],
          // )

          setFormSubmitted(true)
          getQueryClient().invalidateQueries(queryKey)
        },
      },
    )
  }

  return (
    <section className="bg-teal-100 p-3">
      <div className="mt-4 flex justify-center">
        <h2 className="z-10 rounded-lg bg-teal-700 px-2 py-1 font-semibold leading-tight text-teal-50">
          Einen Prioritäten-Hinweis hinterlassen
        </h2>
      </div>
      {formSubmitted ? (
        <>
          <p className="p-3 leading-snug">
            <strong>Der Prioritäten-Hinweis wurde hinterlegt.</strong>
            <br />
            Um Prioritäten zu ändern oder zu löschen klicken Sie auf das Fragezeichen-Icon und dort
            auf den Stift zum bearbeiten.
          </p>
        </>
      ) : (
        <form className="p-4">
          <p className="mb-3 leading-snug">
            Mit Klick auf einen der Button vergeben Sie eine Priorität für die Verbindungslinie, es
            erscheint dann ein Pin mit einem Fragezeichen-Icon. Vergeben Sie pro Linie eine
            Priorität, bitte beachten Sie dabei, dass die drei Prioritäten für Ihre Region
            ausgewogen sein sollen, jeweils ca. 1/3.
          </p>
          <div className="flex items-center gap-1 leading-tight">
            <button
              type="button"
              onClick={() => handleSubmit('höchste Priorität')}
              className={buttonStylesOnYellow}
              disabled={isLoading}
            >
              höchste Priorität
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('hohe Priorität')}
              className={buttonStylesOnYellow}
              disabled={isLoading}
            >
              hohe Priorität
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('geringere Priorität')}
              className={buttonStylesOnYellow}
              disabled={isLoading}
            >
              geringere Priorität
            </button>
            {isLoading && <SmallSpinner />}
          </div>
          {/* @ts-expect-errors TODO Research how the error message is provided by Blitz */}
          {error ? <p className="text-red-500">{error.message}</p> : null}
        </form>
      )}
    </section>
  )
}

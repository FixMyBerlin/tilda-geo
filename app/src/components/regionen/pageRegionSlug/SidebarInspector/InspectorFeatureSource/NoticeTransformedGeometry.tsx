import type { GeoJsonProperties } from 'geojson'

type Props = { sourceId: string; properties: NonNullable<GeoJsonProperties> }

const roadText =
  'Diese Geometrie wurde im Rahmen der Datenaufbereitung künstlich aus der Straßen-Geometrie abgeleitet. In OpenStreetMap sind die Daten an der Straße erfasst. Durch die Aufbereitung können die Attribute komfortabler analysiert und geprüft werden. Die Geometrie liegt dabei auf der Straßen-Mittellinie; der seitliche Versatz nach links bzw. rechts erfolgt nur visuell im Kartenstil.'

const bicycleParkingText = (
  <>
    Diese Stellplatz-Anlage ist in OpenStreetMap als ein Objekt mit mehreren Arten erfasst, z. B.
    Fahrrad- und Lastenrad-Stellplätze zusammen (<code>capacity</code> und{' '}
    <code>capacity:cargo_bike</code>). Für die Auswertung wurde sie in ein Objekt je Art aufgeteilt.
    Die Lage der Teile ist geschätzt: Flächen werden quer zur Längsachse nach der Anzahl der
    Stellplätze geteilt, Linien in der Mitte, Punkte liegen nebeneinander. Genauer wird es, wenn
    Lastenrad-Stellplätze in OpenStreetMap als eigenes Objekt erfasst werden.
  </>
)

export const NoticeTransformedGeometry = ({ sourceId, properties }: Props) => {
  const isBicycleParking = sourceId === 'atlas_bicycleParking' && !!properties.geometry_transform
  if (!properties.prefix && !isBicycleParking) return null

  return (
    <details className="prose prose-sm bg-indigo-200 p-1 px-4 py-1.5">
      <summary className="cursor-pointer hover:font-semibold">
        Hinweis: Transformierte Geometrie
      </summary>
      <p className="my-0 ml-3">{properties.prefix ? roadText : bicycleParkingText}</p>
    </details>
  )
}

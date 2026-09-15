type Props = { visible: boolean }

export const NoticeTransformedGeometry = ({ visible }: Props) => {
  if (!visible) return null

  return (
    <details className="prose prose-sm bg-indigo-200 p-1 px-4 py-1.5">
      <summary className="cursor-pointer hover:font-semibold">
        Hinweis: Transformierte Geometrie
      </summary>
      <p className="my-0 ml-3">
        Diese Geometrie wurde im Rahmen der Datenaufbereitung künstlich aus der Straßen-Geometrie
        abgeleitet. In OpenStreetMap sind die Daten an der Straße erfasst. Durch die Aufbereitung
        können die Attribute komfortabler analysiert und geprüft werden. Die Geometrie liegt dabei
        auf der Straßen-Mittellinie; der seitliche Versatz nach links bzw. rechts erfolgt nur
        visuell im Kartenstil.
      </p>
    </details>
  )
}

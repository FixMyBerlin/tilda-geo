type Props = { visible: boolean }

export const NoticeTransformedGeometry = ({ visible }: Props) => {
  if (!visible) return null

  return (
    <details className="prose prose-sm bg-indigo-200 p-1 px-4 py-1.5">
      <summary className="cursor-pointer hover:font-semibold">
        Hinweis: Transformierte Geometrie
      </summary>
      <p className="my-0 ml-3">
        Diese Geometrie wurde im Rahmen der Datenaufbereitung künstlich erstellt. In OpenStreetMap
        sind die Daten an der Straßen-Geometrie erfasst. Durch die Datenaufbereitung können die
        Attribute kompfortabler analysiert und geprüft werden. Sie sorgt aber auch dafür, dass
        Verbindungspunkte kleine Kanten und Lücken aufweisen können.
      </p>
    </details>
  )
}

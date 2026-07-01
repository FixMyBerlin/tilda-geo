import type { StoreFeaturesInspector } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { Disclosure } from './Disclosure/Disclosure'

type Props = {
  feature: StoreFeaturesInspector['inspectorFeatures'][number]
}

const SCORE_LABELS: Record<string, string> = {
  score_radweg: 'Radweg',
  score_bodenbelag: 'Bodenbelag',
  score_hangneigung: 'Hangneigung',
  score_hindernisfreiheit: 'Hindernisfreiheit',
  score_oepnv: 'ÖPNV',
  score_zielorte: 'Zielorte',
  score_vegetation: 'Vegetation',
  score_kreuzung: 'Kreuzungen',
}

const EIGNUNGSKLASSE_COLORS: Record<string, string> = {
  ausgeschlossen: 'bg-gray-200 text-gray-700',
  schlecht: 'bg-red-100 text-red-800',
  mittel: 'bg-orange-100 text-orange-800',
  gut: 'bg-yellow-100 text-yellow-800',
  'sehr gut': 'bg-green-100 text-green-800',
}

const ScoreBar = ({ value }: { value: number | null | undefined }) => {
  const pct = value != null ? Math.max(0, Math.min(100, value)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-red-600"
          style={{ width: `${pct}%`, opacity: 0.4 + (pct / 100) * 0.6 }}
        />
      </div>
      <span className="w-8 text-right font-mono text-xs text-gray-600">
        {value != null ? Math.round(value) : '–'}
      </span>
    </div>
  )
}

export const InspectorFeaturePlanningHexagon = ({ feature }: Props) => {
  const props = feature.properties
  if (!props) return null

  const gesamtscore: number | null = props.mce_gesamtscore ?? null
  const eignungsklasse: string | null = props.eignungsklasse ?? null
  const badgeClass =
    eignungsklasse && EIGNUNGSKLASSE_COLORS[eignungsklasse]
      ? EIGNUNGSKLASSE_COLORS[eignungsklasse]
      : 'bg-gray-100 text-gray-600'

  return (
    <Disclosure title="Planungs-Hexagon">
      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Gesamtscore</span>
          <div className="flex items-center gap-2">
            {eignungsklasse && (
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${badgeClass}`}>
                {eignungsklasse}
              </span>
            )}
            <span className="text-2xl font-bold text-gray-800">
              {gesamtscore != null ? Math.round(gesamtscore) : '–'}
            </span>
          </div>
        </div>

        {props.gebaeude && (
          <div className="rounded bg-amber-100 px-3 py-2 text-xs text-amber-900">
            <strong>Hinweis:</strong> Auf dieser Fläche befindet sich ein Gebäude – eine Bebauung
            ist hier nicht möglich.
          </div>
        )}

        <div className="h-px bg-gray-200" />

        <table className="w-full text-xs">
          <tbody>
            {Object.entries(SCORE_LABELS).map(([key, label]) => {
              const val = props[key]
              return (
                <tr key={key} className="border-b border-gray-100 last:border-0">
                  <td className="py-1.5 pr-3 text-gray-500">{label}</td>
                  <td className="py-1.5">
                    <ScoreBar value={val} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Disclosure>
  )
}

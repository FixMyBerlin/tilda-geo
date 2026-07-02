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
  score_parken: 'Parken',
}

// Per-hexagon factor breakdown grouped by the two probabilities (Issue #3415).
// `scoreKey` is the persisted sub-score for the whole group; `factors` are the
// individual factor columns that feed it. Mirrors scorer.py::_group_score.
const SCORE_GROUPS: { label: string; scoreKey: string; factors: string[] }[] = [
  { label: 'Bedarf', scoreKey: 'score_bedarf', factors: ['score_oepnv', 'score_zielorte'] },
  {
    label: 'Bebauung',
    scoreKey: 'score_bebauung',
    factors: [
      'score_radweg',
      'score_bodenbelag',
      'score_hangneigung',
      'score_hindernisfreiheit',
      'score_vegetation',
      'score_kreuzung',
      'score_parken',
    ],
  },
]

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

        <div className="flex gap-2">
          {SCORE_GROUPS.map((group) => {
            const val = props[group.scoreKey]
            return (
              <div key={group.scoreKey} className="flex-1 rounded bg-gray-50 px-2 py-1.5">
                <div className="text-xs text-gray-500">{group.label}</div>
                <div className="text-lg font-bold text-gray-800">
                  {val != null ? Math.round(val) : '–'}
                </div>
              </div>
            )
          })}
        </div>

        {props.gebaeude && (
          <div className="rounded bg-amber-100 px-3 py-2 text-xs text-amber-900">
            <strong>Hinweis:</strong> Auf dieser Fläche befindet sich ein Gebäude – eine Bebauung
            ist hier nicht möglich.
          </div>
        )}

        <div className="h-px bg-gray-200" />

        <div className="space-y-3">
          {SCORE_GROUPS.map((group) => (
            <div key={group.scoreKey}>
              <div className="mb-1 text-xs font-semibold text-gray-500 uppercase">
                {group.label}
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {group.factors.map((key) => (
                    <tr key={key} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 pr-3 text-gray-500">{SCORE_LABELS[key] ?? key}</td>
                      <td className="py-1.5">
                        <ScoreBar value={props[key]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </Disclosure>
  )
}

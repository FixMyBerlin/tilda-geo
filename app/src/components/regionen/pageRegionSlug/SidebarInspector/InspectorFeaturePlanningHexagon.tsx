import { useQuery } from '@tanstack/react-query'
import { twJoin } from 'tailwind-merge'
import type { StoreFeaturesInspector } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import {
  usePlanningAreaFilterParam,
  usePlanningVariantParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/usePlanningParams'
import {
  MODIFIER_MAX_POINTS,
  weightToPoints,
} from '@/components/regionen/pageRegionSlug/Planning/weightScale'
import { planningVariantQueryOptions } from '@/server/planning/planningQueryOptions'
import { Disclosure } from './Disclosure/Disclosure'

type Props = {
  feature: StoreFeaturesInspector['inspectorFeatures'][number]
}

const SCORE_LABELS: Record<string, string> = {
  score_radweg: 'Radweg',
  score_hangneigung: 'Hangneigung',
  score_oepnv: 'ÖPNV',
  score_zielorte: 'Zielorte',
  score_vegetation: 'Vegetation',
  score_kreuzung: 'Kreuzungen',
  score_parken: 'Parken',
  score_fussgaengerzone: 'Fußgängerzonen',
  score_bestand: 'Bestandsanlagen',
  score_eigendaten: 'Eigene Flächen',
}

// Per-hexagon factor breakdown grouped by the two probabilities (Issue #3415).
// `scoreKey` is the persisted sub-score for the whole group. Innerhalb der Gruppe
// unterscheiden sich die beiden Faktorarten auch in der Anzeige, weil sie andere
// Werte halten (mirrors scorer.py):
//   criteria  → 0–100-Teilscore, gewichteter Durchschnitt → Balken
//   modifiers → Zu-/Abschlag in Punkten (kann negativ sein) → Balken relativ zum Maximaleffekt
const SCORE_GROUPS: { label: string; scoreKey: string; criteria: string[]; modifiers: string[] }[] =
  [
    {
      label: 'Bedarf',
      scoreKey: 'score_bedarf',
      criteria: ['score_radweg', 'score_oepnv', 'score_zielorte'],
      modifiers: ['score_fussgaengerzone', 'score_bestand'],
    },
    {
      label: 'Bebauung',
      scoreKey: 'score_bebauung',
      criteria: ['score_hangneigung'],
      modifiers: ['score_vegetation', 'score_kreuzung', 'score_parken'],
    },
  ]

// `score_*` (Ergebnis pro Hexagon) → `w_*` (Gewicht der Variante) — nötig, um den maximal
// möglichen Effekt (`weightToPoints`) für den Anteils-Balken zu bestimmen (mirrors weightScale.ts).
const MODIFIER_WEIGHT_KEYS: Record<string, string> = {
  score_fussgaengerzone: 'w_fussgaengerzone',
  score_bestand: 'w_bestand',
  score_vegetation: 'w_vegetation',
  score_kreuzung: 'w_intersection',
  score_parken: 'w_parken',
  score_eigendaten: 'w_eigendaten',
}

const EIGNUNGSKLASSE_COLORS: Record<string, string> = {
  ausgeschlossen: 'bg-gray-200 text-gray-700',
  schlecht: 'bg-red-100 text-red-800',
  mittel: 'bg-orange-100 text-orange-800',
  gut: 'bg-yellow-100 text-yellow-800',
  'sehr gut': 'bg-green-100 text-green-800',
}

/**
 * Zu-/Abschlag in Punkten — anders als die Kriterien vorzeichenbehaftet und ohne 0–100-Skala.
 * Gleiche Balken-/Label-Maße wie `ScoreBar`, damit beide Zeilenarten sauber untereinander
 * ausgerichtet sind. Die Füllung zeigt den Anteil am maximal möglichen Effekt dieses Faktors
 * (`max` = `weightToPoints(Gewicht)`, siehe `weightScale.ts`) und ist grün (Zuschlag) bzw. rot
 * (Abschlag) eingefärbt.
 */
const ModifierBar = ({ value, max }: { value: number | null | undefined; max: number }) => {
  const pct = value != null && max > 0 ? Math.min(100, (Math.abs(value) / max) * 100) : 0
  const positive = value != null && value > 0
  const negative = value != null && value < 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
        <div
          className={twJoin(
            'h-full rounded-full',
            positive ? 'bg-green-600' : negative ? 'bg-red-600' : 'bg-gray-300',
          )}
          style={{ width: `${pct}%`, opacity: 0.4 + (pct / 100) * 0.6 }}
        />
      </div>
      <span className="w-8 text-right font-mono text-xs text-gray-600">
        {value == null
          ? '–'
          : `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(Math.round(value))}`}
      </span>
    </div>
  )
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
  const [areaFilterOn] = usePlanningAreaFilterParam()
  const [variantId] = usePlanningVariantParam()
  const { data: variant } = useQuery({
    ...planningVariantQueryOptions(variantId!),
    enabled: variantId != null,
  })
  const weights = variant?.factorConfig?.weights
  const modifierMax = (scoreKey: string) => {
    const weightKey = MODIFIER_WEIGHT_KEYS[scoreKey]
    return weightKey ? weightToPoints(weights?.[weightKey]) : MODIFIER_MAX_POINTS
  }

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

        {props.fahrbahn && (
          <div className="rounded bg-amber-100 px-3 py-2 text-xs text-amber-900">
            <strong>Hinweis:</strong> Auf dieser Fläche verläuft eine Straße – eine Bebauung ist
            hier nicht möglich.
          </div>
        )}

        {areaFilterOn && props.cluster_area_m2 != null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Zusammenhängende Fläche</span>
            <span className="font-semibold text-gray-800">
              {Math.round(props.cluster_area_m2).toLocaleString('de-DE')} m²
            </span>
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
                  {group.criteria.map((key) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-1.5 pr-3 text-gray-500">{SCORE_LABELS[key] ?? key}</td>
                      <td className="py-1.5">
                        <ScoreBar value={props[key]} />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      colSpan={2}
                      className="pt-1.5 text-[10px] tracking-wide text-gray-400 uppercase"
                    >
                      Zu- und Abschläge
                    </td>
                  </tr>
                  {group.modifiers.map((key) => (
                    <tr key={key} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 pr-3 text-gray-500">{SCORE_LABELS[key] ?? key}</td>
                      <td className="py-1.5">
                        <ModifierBar value={props[key]} max={modifierMax(key)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Eigene Flächen: eigene Kategorie (nicht in Bedarf/Bebauung). Signierter
              Effekt in Punkten; NULL bei Ausschluss-Modi (dort wirkt der harte Cut). */}
          {props.score_eigendaten != null && (
            <div>
              <div className="mb-1 text-xs font-semibold text-gray-500 uppercase">
                Eigene Flächen
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1.5 pr-3 text-gray-500">{SCORE_LABELS.score_eigendaten}</td>
                    <td className="py-1.5">
                      <ModifierBar
                        value={props.score_eigendaten}
                        max={modifierMax('score_eigendaten')}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Disclosure>
  )
}

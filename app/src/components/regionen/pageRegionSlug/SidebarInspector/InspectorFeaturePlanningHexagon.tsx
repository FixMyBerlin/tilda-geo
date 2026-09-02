import { useQuery } from '@tanstack/react-query'
import { twJoin } from 'tailwind-merge'
import type { StoreFeaturesInspector } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import {
  usePlanningAreaFilterParam,
  usePlanningRunParam,
  usePlanningVariantParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/usePlanningParams'
import { WEIGHT_GROUPS } from '@/components/regionen/pageRegionSlug/Planning/planningDefaults'
import { planningGroupStyle } from '@/components/regionen/pageRegionSlug/Planning/planningPanelStyles'
import {
  criterionShares,
  groupShare,
  MODIFIER_MAX_POINTS,
  weightToPoints,
} from '@/components/regionen/pageRegionSlug/Planning/weightScale'
import type { VariantFactorConfig } from '@/server/planning/mergeFactorConfig'
import { planningVariantQueryOptions } from '@/server/planning/planningQueryOptions'
import { Disclosure } from './Disclosure/Disclosure'

type Props = {
  feature: StoreFeaturesInspector['inspectorFeatures'][number]
}

const SCORE_LABELS: Record<string, string> = {
  score_radweg: 'Radweg',
  score_hangneigung: 'Hangneigung',
  score_oepnv: 'ÖPNV + Bikesharing',
  score_zielorte: 'Zielorte',
  score_vegetation: 'Vegetation',
  score_kreuzung: 'Kreuzungen',
  score_parken: 'Parken',
  score_fussgaengerzone: 'Fußgängerzonen',
  score_bestand: 'Bestandsanlagen',
  score_eigendaten: 'Eigene Flächen',
  score_bewohnerbedarf: 'Bewohnerbedarf (Zensus)',
}

// Per-hexagon factor breakdown grouped by the two probabilities (Issue #3415).
// `scoreKey` is the persisted sub-score for the whole group. Innerhalb der Gruppe
// unterscheiden sich die beiden Faktorarten auch in der Anzeige, weil sie andere
// Werte halten (mirrors scorer.py):
//   criteria  → 0–100-Teilscore, gewichteter Durchschnitt → Balken
//   modifiers → Zu-/Abschlag in Punkten (kann negativ sein) → Balken relativ zum Maximaleffekt
const SCORE_GROUPS: {
  // Gruppenschlüssel wie in WEIGHT_GROUPS — verbindet die Sidebar mit den Gewichten der Variante
  // und mit den Gruppenfarben (`planningGroupStyle`) des Flächenfinder-Panels.
  key: 'bedarf' | 'bebauung'
  label: string
  scoreKey: string
  criteria: string[]
  modifiers: string[]
  // Angekündigte, aber noch nicht integrierte Kriterien (keine Daten am Hexagon) — werden nur als
  // deaktivierte Zeile mit "bald verfügbar"-Hinweis angezeigt.
  comingSoon?: string[]
}[] = [
  {
    key: 'bedarf',
    label: 'Bedarf',
    scoreKey: 'score_bedarf',
    criteria: ['score_radweg', 'score_oepnv', 'score_zielorte'],
    modifiers: ['score_fussgaengerzone', 'score_bewohnerbedarf', 'score_bestand'],
  },
  {
    key: 'bebauung',
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

// Dasselbe für die Kriterien — `criterionShares` (weightScale.ts) ist nach Gewichts-Namen
// indiziert, die Sidebar zeigt aber Score-Namen.
const CRITERION_WEIGHT_KEYS: Record<string, string> = {
  score_radweg: 'w_cyclepath',
  score_oepnv: 'w_transit',
  score_zielorte: 'w_target',
  score_hangneigung: 'w_slope',
}

const EIGNUNGSKLASSE_COLORS: Record<string, string> = {
  ausgeschlossen: 'bg-gray-200 text-gray-700',
  schlecht: 'bg-red-100 text-red-800',
  mittel: 'bg-orange-100 text-orange-800',
  gut: 'bg-yellow-100 text-yellow-800',
  'sehr gut': 'bg-green-100 text-green-800',
}

// Gemeinsames Spaltenraster für alle Faktor-Zeilen (Kriterien, Zu-/Abschläge, "bald verfügbar"):
// Label bekommt den Restplatz, Balken/Wert/Prozent haben feste Breiten. Nur so bleiben die Balken
// exakt untereinander ausgerichtet — unabhängig davon, ob eine Zeile einen Prozent-Anteil zeigt
// (Kriterien) oder nicht (Zu-/Abschläge), und über beide Gruppen-Tabellen (Bedarf/Bebauung) hinweg.
const ROW_GRID = 'grid grid-cols-[1fr_6rem_2.75rem_2.5rem] items-center gap-x-2'

const BarTrack = ({
  pct,
  fillClassName,
  trackClassName = 'bg-gray-200',
}: {
  pct: number
  fillClassName?: string
  trackClassName?: string
}) => (
  <div className={twJoin('h-2 w-24 overflow-hidden rounded-full', trackClassName)}>
    {fillClassName && (
      <div
        className={twJoin('h-full rounded-full', fillClassName)}
        style={{ width: `${pct}%`, opacity: 0.4 + (pct / 100) * 0.6 }}
      />
    )}
  </div>
)

/**
 * Zu-/Abschlag in Punkten — anders als die Kriterien vorzeichenbehaftet und ohne 0–100-Skala.
 * Die Füllung zeigt den Anteil am maximal möglichen Effekt dieses Faktors (`max` =
 * `weightToPoints(Gewicht)`, siehe `weightScale.ts`) und ist grün (Zuschlag) bzw. rot (Abschlag)
 * eingefärbt. Statt eines Prozentanteils (bei vorzeichenbehafteten Punkten ohne gemeinsame
 * Bezugsgröße wenig aussagekräftig) zeigt der Wert direkt den Bruch aus angewandtem Effekt und dem
 * im Faktor eingestellten Maximum, z. B. „5/15".
 */
const formatModifierValue = (value: number | null | undefined, max: number) =>
  value == null
    ? '–'
    : `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(Math.round(value))}${max > 0 ? `/${max}` : ''}`

const modifierBarPct = (value: number | null | undefined, max: number) =>
  value != null && max > 0 ? Math.min(100, (Math.abs(value) / max) * 100) : 0

const modifierFillClassName = (value: number | null | undefined) =>
  value != null && value > 0
    ? 'bg-green-600'
    : value != null && value < 0
      ? 'bg-red-600'
      : 'bg-gray-300'

export const InspectorFeaturePlanningHexagon = ({ feature }: Props) => {
  const [areaFilterOn] = usePlanningAreaFilterParam()
  const [variantId] = usePlanningVariantParam()
  const [runId] = usePlanningRunParam()
  const { data: variant } = useQuery({
    ...planningVariantQueryOptions(variantId!),
    enabled: variantId != null,
  })

  // Gewichte des Laufs, der die hier angezeigten Werte tatsächlich erzeugt hat — NICHT die
  // (womöglich seither ohne Neuberechnung veränderten) aktuellen Variantengewichte. Sonst würden
  // Balkenmaximum und Prozentanteile einer nicht mehr aktuellen Faktor-Konfiguration entsprechen.
  const run = variant?.runs?.find((r) => r.id === runId)
  const snapshot = run?.factorConfigSnapshot as VariantFactorConfig | undefined
  const weights = snapshot?.weights
  const shares = weights ? criterionShares(weights) : undefined
  const modifierMax = (scoreKey: string) => {
    const weightKey = MODIFIER_WEIGHT_KEYS[scoreKey]
    return weightKey ? weightToPoints(weights?.[weightKey]) : MODIFIER_MAX_POINTS
  }
  // Verteilung zwischen Bedarf und Bebauung: Anteil der Kriterien dieser Gruppe am Grundscore
  // (dieselbe Größe, die FactorEditorPanel als "XX % des Grundscores" neben der Gruppen-
  // überschrift zeigt) — hier auf den Gewichten des Laufs statt der Live-Variante.
  const groupSharePct = (groupKey: 'bedarf' | 'bebauung') => {
    if (!shares) return undefined
    const weightGroup = WEIGHT_GROUPS.find((g) => g.key === groupKey)
    return weightGroup ? groupShare(shares, weightGroup.criteria) : undefined
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
    <Disclosure title="Potenzialflächen-Hexagon">
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
            const sharePct = groupSharePct(group.key)
            return (
              <div
                key={group.scoreKey}
                className={twJoin(
                  'flex-1 rounded-r border-l-[3px] px-2 py-1.5',
                  planningGroupStyle[group.key].block,
                )}
              >
                <div className={twJoin('text-xs font-medium', planningGroupStyle[group.key].text)}>
                  {group.label}
                  {sharePct != null && (
                    <span className="ml-1 text-[10px] text-gray-500 tabular-nums">
                      ({Math.round(sharePct)}%)
                    </span>
                  )}
                </div>
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
            // Gleiche Gruppenfarben wie im Flächenfinder-Panel, damit die lange Faktorenliste hier
            // und die Gewichte dort ohne Suchen zusammenzubringen sind.
            <div
              key={group.scoreKey}
              className={twJoin(
                'rounded-r border-l-[3px] py-1 pr-1 pl-2',
                planningGroupStyle[group.key].block,
              )}
            >
              <div
                className={twJoin(
                  'mb-1 text-xs font-semibold uppercase',
                  planningGroupStyle[group.key].text,
                )}
              >
                {group.label}
              </div>
              <div className="space-y-0 text-xs">
                {group.criteria.map((key) => {
                  const value = props[key] as number | null | undefined
                  const pct = value != null ? Math.max(0, Math.min(100, value)) : 0
                  const sharePct = shares?.[CRITERION_WEIGHT_KEYS[key] ?? key]
                  return (
                    <div key={key} className={twJoin(ROW_GRID, 'border-b border-gray-100 py-1.5')}>
                      <span className="pr-3 text-gray-500">{SCORE_LABELS[key] ?? key}</span>
                      <BarTrack pct={pct} fillClassName="bg-red-600" />
                      <span className="text-right font-mono text-gray-600">
                        {value != null ? Math.round(value) : '–'}
                      </span>
                      <span className="text-right text-[10px] text-gray-400 tabular-nums">
                        {sharePct != null ? `(${Math.round(sharePct)}%)` : null}
                      </span>
                    </div>
                  )
                })}
                {group.comingSoon?.map((key) => (
                  <div key={key} className={twJoin(ROW_GRID, 'border-b border-gray-100 py-1.5')}>
                    <span className="pr-3 text-gray-400">{SCORE_LABELS[key] ?? key}</span>
                    <BarTrack pct={0} trackClassName="bg-gray-100" />
                    <span className="col-span-2 text-right text-[10px] text-gray-400">bald</span>
                  </div>
                ))}
                <div className="pt-1.5 text-[10px] tracking-wide text-gray-400 uppercase">
                  Zu- und Abschläge
                </div>
                {group.modifiers.map((key) => {
                  const value = props[key] as number | null | undefined
                  const max = modifierMax(key)
                  return (
                    <div
                      key={key}
                      className={twJoin(ROW_GRID, 'border-b border-gray-100 py-1.5 last:border-0')}
                    >
                      <span className="pr-3 text-gray-500">{SCORE_LABELS[key] ?? key}</span>
                      <BarTrack
                        pct={modifierBarPct(value, max)}
                        fillClassName={modifierFillClassName(value)}
                      />
                      <span className="col-span-2 text-right font-mono text-gray-600">
                        {formatModifierValue(value, max)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Eigene Flächen: eigene Kategorie (nicht in Bedarf/Bebauung). Signierter
              Effekt in Punkten; NULL bei Ausschluss-Modi (dort wirkt der harte Cut). */}
          {props.score_eigendaten != null && (
            <div>
              <div className="mb-1 text-xs font-semibold text-gray-500 uppercase">
                Eigene Flächen
              </div>
              <div className={twJoin(ROW_GRID, 'py-1.5 text-xs')}>
                <span className="pr-3 text-gray-500">{SCORE_LABELS.score_eigendaten}</span>
                <BarTrack
                  pct={modifierBarPct(props.score_eigendaten, modifierMax('score_eigendaten'))}
                  fillClassName={modifierFillClassName(props.score_eigendaten)}
                />
                <span className="col-span-2 text-right font-mono text-gray-600">
                  {formatModifierValue(props.score_eigendaten, modifierMax('score_eigendaten'))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Disclosure>
  )
}

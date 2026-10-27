import { twJoin } from 'tailwind-merge'
import { useSpaceFinderMinAreaDraft } from '@/components/regionen/pageRegionSlug/hooks/mapState/space-finder-boundary-store'
import type { StoreFeaturesInspector } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import {
  factorRangeHint,
  WEIGHT_GROUPS,
} from '@/components/regionen/pageRegionSlug/modes/spaceFinder/factors/spaceFinderDefaults'
import {
  criterionShares,
  groupShare,
  MODIFIER_MAX_POINTS,
  weightToPoints,
  weightToStep,
} from '@/components/regionen/pageRegionSlug/modes/spaceFinder/factors/weightScale'
import { isCoarseHexagon } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/planningHexagonResolution'
import { appliedMinAreaM2 } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/spaceFinderModeParam'
import {
  spaceFinderFactorActiveTextClass,
  spaceFinderFactorEmptyValueClass,
  spaceFinderFactorHintClass,
  spaceFinderFactorMutedTextClass,
  spaceFinderFactorGroupLabelClass,
  spaceFinderFactorGroupRowsClass,
  spaceFinderGroupBarStyle,
  spaceFinderGroupHeadingClass,
  spaceFinderGroupStyle,
} from '@/components/regionen/pageRegionSlug/modes/spaceFinder/spaceFinderPanelStyles'
import { spaceFinderOpenRunStatus } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/spaceFinderRunStatus'
import { useSpaceFinderModeParam } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/useSpaceFinderModeParam'
import { useSpaceFinderSelection } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/useSpaceFinderSelection'
import { parseEigendatenDetails } from '@/shared/regionen/planningEigendatenDetails'
import {
  PLANNING_SCORE_GROUPS,
  PLANNING_SCORE_LABELS as SCORE_LABELS,
} from '@/shared/regionen/planningScoreLabels.const'
import { Disclosure } from './Disclosure/Disclosure'

type Props = {
  feature: StoreFeaturesInspector['inspectorFeatures'][number]
}

// Per-hexagon factor breakdown grouped by the two probabilities (Issue #3415), see
// `PLANNING_SCORE_GROUPS`. Within a group the two factor kinds are also displayed differently
// because they hold different values (mirrors scorer.py):
//   criteria  → 0–100 Teilscore, weighted average → bar
//   modifiers → bonus/penalty in points (can be negative) → bar relative to the max effect
const SCORE_GROUPS = PLANNING_SCORE_GROUPS

// `score_*` (result per hexagon) → `w_*` (variant weight) — needed to determine the maximum
// possible effect (`weightToPoints`) for the share bar (mirrors weightScale.ts).
const MODIFIER_WEIGHT_KEYS: Record<string, string> = {
  score_fussgaengerzone: 'w_fussgaengerzone',
  score_bestand: 'w_bestand',
  score_vegetation: 'w_vegetation',
  score_bewohnerbedarf: 'w_bewohnerbedarf',
  score_kreuzung: 'w_intersection',
  score_parken: 'w_parken',
  score_platz: 'w_platz',
  score_eigendaten: 'w_eigendaten',
  score_zielorte: 'w_target',
}

// Same for the criteria — `criterionShares` (weightScale.ts) is keyed by weight names,
// but the sidebar shows score names.
const CRITERION_WEIGHT_KEYS: Record<string, string> = {
  score_radweg: 'w_cyclepath',
  score_oepnv: 'w_transit',
  score_hangneigung: 'w_slope',
}

// Row order follows the factor editor (`WEIGHT_GROUPS`), so the same factor sits at the same
// position in the editor and here. `PLANNING_SCORE_GROUPS` is shared with the Prüfliste
// take-over and has its own order, so it is only re-sorted here.
const EDITOR_ORDER = new Map(
  WEIGHT_GROUPS.flatMap((group) => [...group.criteria, ...group.modifiers.map((m) => m.key)]).map(
    (weightKey, index) => [weightKey, index],
  ),
)
const inEditorOrder = (scoreKeys: string[]) => {
  const position = (scoreKey: string) =>
    EDITOR_ORDER.get(CRITERION_WEIGHT_KEYS[scoreKey] ?? MODIFIER_WEIGHT_KEYS[scoreKey] ?? '') ??
    Number.MAX_SAFE_INTEGER
  return [...scoreKeys].sort((a, b) => position(a) - position(b))
}

// Hard exclusion reasons (zero out mce_gesamtscore, see scorer.py
// l. 966-975 `exclusion` and l. 902-906 `eigendaten_exclude`), each with an
// explanatory sidebar note. Building/carriageway/user areas have their own
// persisted flag for this (like `gebaeude`); steep slope needs none –
// `score_hangneigung` is only set with weight > 0 (otherwise NULL) and exactly 0
// only for slope > 10°, identical to the exclusion condition in the worker. With
// weight 0, `score_hangneigung` is NULL, so the check does not apply –
// like any other disabled factor, the exclusion is dropped.
const EXCLUSION_REASONS: { check: (props: Record<string, any>) => boolean; text: string }[] = [
  {
    check: (props) => !!props.gebaeude,
    text: 'Auf dieser Fläche befindet sich ein Gebäude – eine Bebauung ist hier nicht möglich.',
  },
  {
    check: (props) => !!props.fahrbahn,
    text: 'Auf dieser Fläche verläuft eine Straße – eine Bebauung ist hier nicht möglich.',
  },
  {
    check: (props) => props.score_hangneigung === 0,
    text: 'Diese Fläche ist zu steil (Hangneigung > 10°) – eine Bebauung ist hier nicht möglich.',
  },
]

const EIGNUNGSKLASSE_COLORS: Record<string, string> = {
  ausgeschlossen: 'bg-gray-200 text-gray-700',
  schlecht: 'bg-red-100 text-red-800',
  mittel: 'bg-orange-100 text-orange-800',
  gut: 'bg-yellow-100 text-yellow-800',
  'sehr gut': 'bg-green-100 text-green-800',
}

// Shared column grid for all factor rows (criteria, bonuses/penalties, "bald verfügbar"):
// the label gets the remaining space, bar/value/percent have fixed widths. This keeps the bars
// aligned exactly — whether a row shows a percent share (criteria) or not
// (bonuses/penalties), and across both group tables (Bedarf/Bebauung).
const ROW_GRID = 'grid grid-cols-[1fr_6rem_2.75rem_2.5rem] items-center gap-x-2'

// Factor label with the configured reach (active factors). Disabled factors (weight 0) are muted.
const FactorLabel = ({
  label,
  active,
  hint,
}: {
  label: string
  active: boolean
  hint?: string
}) => (
  <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 pr-3">
    <span className={active ? spaceFinderFactorActiveTextClass : spaceFinderFactorMutedTextClass}>
      {label}
    </span>
    {active && hint && <span className={spaceFinderFactorHintClass}>{hint}</span>}
  </span>
)

/** Value color: darker for factors that count, light gray for "–" and zeros, muted when disabled. */
const factorValueClassName = (active: boolean, rounded: number | null) =>
  !active
    ? spaceFinderFactorMutedTextClass
    : rounded == null || rounded === 0
      ? spaceFinderFactorEmptyValueClass
      : spaceFinderFactorActiveTextClass

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
 * Bonus/penalty in points — unlike the criteria, signed and without a 0–100 scale.
 * The fill shows the share of this factor's maximum possible effect (`max` =
 * `weightToPoints(weight)`, see `weightScale.ts`) and is green (bonus) or red (penalty).
 * Instead of a percent share (not very meaningful for signed points without a common
 * reference), the value directly shows the applied effect over the maximum configured
 * in the factor, e.g. „5/15".
 */
const formatModifierValue = (value: number | null | undefined, max: number) =>
  value == null
    ? '–'
    : `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(Math.round(value))}${max > 0 ? `/${max}` : ''}`

const modifierBarPct = (value: number | null | undefined, max: number) =>
  value != null && max > 0 ? Math.min(100, (Math.abs(value) / max) * 100) : 0

const modifierFillClassName = (
  value: number | null | undefined,
  groupKey: 'bedarf' | 'bebauung' | 'eigendaten',
) =>
  value != null && value > 0
    ? spaceFinderGroupBarStyle[groupKey].full
    : value != null && value < 0
      ? spaceFinderGroupBarStyle[groupKey].pale
      : 'bg-gray-300'

export const InspectorFeatureSpaceFinderHexagon = ({ feature }: Props) => {
  const { spaceFinderMode } = useSpaceFinderModeParam()
  const minAreaDraft = useSpaceFinderMinAreaDraft()
  const { runId, variant } = useSpaceFinderSelection()
  const areaFilterOn =
    appliedMinAreaM2(
      spaceFinderMode.minArea === true,
      variant?.factorConfig.min_area_m2,
      minAreaDraft,
    ) > 0

  // Weights of the run that actually produced the values shown here — NOT the current variant
  // weights (which may have changed since without a recompute). Otherwise bar maximum and
  // percent shares would reflect an outdated factor configuration.
  const run = variant?.runs?.find((r) => r.id === runId)
  const snapshot = run?.factorConfigSnapshot
  const weights = snapshot?.weights
  const shares = weights ? criterionShares(weights) : undefined
  // Without a snapshot (legacy run) nothing is known about the weights: treat all as active.
  const criterionActive = (scoreKey: string) =>
    !weights || weightToStep(weights[CRITERION_WEIGHT_KEYS[scoreKey] ?? scoreKey]) > 0
  const modifierActive = (scoreKey: string) =>
    !weights || weightToPoints(weights[MODIFIER_WEIGHT_KEYS[scoreKey] ?? scoreKey]) > 0
  const modifierMax = (scoreKey: string) => {
    const weightKey = MODIFIER_WEIGHT_KEYS[scoreKey]
    return weightKey ? weightToPoints(weights?.[weightKey]) : MODIFIER_MAX_POINTS
  }
  // Split between Bedarf and Bebauung: share of this group's criteria in the base score
  // (the same value FactorEditorPanel shows as "XX % des Grundscores" next to the group
  // heading) — here based on the run's weights instead of the live variant.
  const groupSharePct = (groupKey: 'bedarf' | 'bebauung') => {
    if (!shares) return undefined
    const weightGroup = WEIGHT_GROUPS.find((g) => g.key === groupKey)
    return weightGroup ? groupShare(shares, weightGroup.criteria) : undefined
  }

  // Eigene Daten: names and strengths from the run snapshot (as computed then), otherwise from the
  // current variant.
  const datasetsById = new Map(
    (snapshot?.user_datasets ?? variant?.factorConfig.user_datasets ?? []).map((dataset) => [
      dataset.id,
      dataset,
    ]),
  )
  const datasetName = (id: string) => datasetsById.get(id)?.name ?? 'Eigene Daten'
  // Exclusion text per mode: „Ausschluss außen“ hits areas OUTSIDE the dataset.
  const datasetExclusionText = (id: string) => {
    const name = `„${datasetName(id)}“`
    switch (datasetsById.get(id)?.mode) {
      case 'exclude_inside':
        return `Diese Fläche liegt innerhalb der eigenen Daten ${name} (Ausschluss innen).`
      case 'exclude_outside':
        return `Diese Fläche liegt außerhalb der eigenen Daten ${name} (Ausschluss außen).`
      case 'bonus':
      case 'penalty':
      case undefined:
        return `Diese Fläche ist durch die eigenen Daten ${name} ausgeschlossen.`
    }
  }
  const datasetMax = (id: string) => weightToPoints(snapshot?.eigendaten_weights?.[id])

  const runStatus = variant ? spaceFinderOpenRunStatus(variant) : null

  const props = feature.properties
  if (!props) return null

  // Coarse cells (aggregate grid below zoom 16) only carry averages: no exclusion reasons
  // and no per-dataset breakdown (see `aggregate_hexagons` in the worker).
  const coarseCell = isCoarseHexagon(props.h3_id)
  const eigendatenDetails = parseEigendatenDetails(props.eigendaten_details)
  const eigendatenExcludedBy = eigendatenDetails.filter((detail) => detail.x != null)
  const exclusionTexts = [
    ...EXCLUSION_REASONS.filter((reason) => reason.check(props)).map((reason) => reason.text),
    ...(props.eigendaten_ausschluss
      ? eigendatenExcludedBy.length > 0
        ? eigendatenExcludedBy.map((detail) => datasetExclusionText(detail.id))
        : ['Diese Fläche liegt im Ausschlussbereich eigener Daten.']
      : []),
  ]
  const showEigendaten =
    eigendatenDetails.length > 0 || Math.round(props.score_eigendaten ?? 0) !== 0

  const gesamtscore: number | null = props.mce_gesamtscore ?? null
  const eignungsklasse: string | null = props.eignungsklasse ?? null
  const badgeClass =
    eignungsklasse && EIGNUNGSKLASSE_COLORS[eignungsklasse]
      ? EIGNUNGSKLASSE_COLORS[eignungsklasse]
      : 'bg-gray-100 text-gray-600'

  return (
    <Disclosure title="Potenzialflächen-Hexagon">
      <div className="space-y-3 px-4 py-3">
        {runStatus?.status === 'stale' && (
          <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
            {runStatus.outdatedReason ? `${runStatus.outdatedReason} — ` : ''}Ergebnis veraltet. Die
            Werte stammen aus der letzten Berechnung. Bitte neu berechnen.
          </p>
        )}

        <div className="flex items-center justify-between rounded-r border-l-[3px] border-gray-400 bg-gray-50 py-1.5 pr-2 pl-2">
          <span className="text-xs font-bold text-gray-700 uppercase">Gesamtscore</span>
          <div className="flex items-center gap-2">
            {eignungsklasse && (
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${badgeClass}`}>
                {eignungsklasse}
              </span>
            )}
            <span className="text-4xl leading-none font-bold text-gray-800 tabular-nums">
              {gesamtscore != null ? Math.round(gesamtscore) : '–'}
            </span>
          </div>
        </div>

        {exclusionTexts.map((text) => (
          <div key={text} className="rounded bg-amber-100 px-3 py-2 text-xs text-amber-900">
            <strong>Hinweis:</strong> {text}
          </div>
        ))}

        {coarseCell && (
          <p className="rounded bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Grobe Ansicht: Die Werte sind über mehrere Flächen gemittelt. Ausschlussgründe und die
            Wirkung einzelner Datensätze erscheinen beim Hineinzoomen.
          </p>
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
          {SCORE_GROUPS.map((group) => {
            const groupVal = props[group.scoreKey]
            const sharePct = groupSharePct(group.key)
            return (
              // Same group colors as in the Flächenfinder panel, so the long factor list here
              // and the weights there can be matched up at a glance.
              <div
                key={group.scoreKey}
                className={twJoin(
                  'rounded-r border-l-[3px] py-1 pr-1 pl-2',
                  spaceFinderGroupStyle[group.key].block,
                )}
              >
                <div
                  className={twJoin(
                    'mb-2 flex items-center justify-between border-b pb-0.5',
                    spaceFinderGroupStyle[group.key].headline,
                  )}
                >
                  <div
                    className={twJoin(
                      spaceFinderGroupHeadingClass,
                      spaceFinderGroupStyle[group.key].title,
                    )}
                  >
                    {group.label}
                    {sharePct != null && (
                      <span className="ml-1 text-[10px] font-normal text-gray-500 tabular-nums">
                        ({Math.round(sharePct)}%)
                      </span>
                    )}
                  </div>
                  <span
                    className={twJoin(
                      'text-2xl leading-none font-bold tabular-nums',
                      spaceFinderGroupStyle[group.key].text,
                    )}
                  >
                    {groupVal != null ? Math.round(groupVal) : '–'}
                  </span>
                </div>
                <div className="space-y-0 text-xs">
                  <div className={spaceFinderFactorGroupLabelClass}>Kriterien</div>
                  <div className={spaceFinderFactorGroupRowsClass}>
                    {inEditorOrder(group.criteria).map((key) => {
                      const value = props[key] as number | null | undefined
                      const pct = value != null ? Math.max(0, Math.min(100, value)) : 0
                      const weightKey = CRITERION_WEIGHT_KEYS[key] ?? key
                      const sharePct = shares?.[weightKey]
                      const active = criterionActive(key)
                      const rounded = value != null ? Math.round(value) : null
                      return (
                        <div key={key} className={twJoin(ROW_GRID, 'py-1')}>
                          <FactorLabel
                            label={SCORE_LABELS[key] ?? key}
                            active={active}
                            hint={factorRangeHint(weightKey, snapshot)}
                          />
                          <BarTrack
                            pct={pct}
                            fillClassName={spaceFinderGroupBarStyle[group.key].full}
                          />
                          <span
                            className={twJoin(
                              'text-right font-mono',
                              factorValueClassName(active, rounded),
                            )}
                          >
                            {rounded ?? '–'}
                          </span>
                          <span className="text-right text-[10px] text-gray-400 tabular-nums">
                            {active && sharePct != null ? `(${Math.round(sharePct)}%)` : null}
                          </span>
                        </div>
                      )
                    })}
                    {group.comingSoon?.map((key) => (
                      <div key={key} className={twJoin(ROW_GRID, 'py-1')}>
                        <span className={twJoin('pr-3', spaceFinderFactorMutedTextClass)}>
                          {SCORE_LABELS[key] ?? key}
                        </span>
                        <BarTrack pct={0} trackClassName="bg-gray-100" />
                        <span className="col-span-2 text-right text-[10px] text-gray-400">
                          bald
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={twJoin('pt-2', spaceFinderFactorGroupLabelClass)}>
                    Zu- und Abschläge
                  </div>
                  <div className={spaceFinderFactorGroupRowsClass}>
                    {inEditorOrder(group.modifiers).map((key) => {
                      const value = props[key] as number | null | undefined
                      const max = modifierMax(key)
                      const active = modifierActive(key)
                      return (
                        <div key={key} className={twJoin(ROW_GRID, 'py-1')}>
                          <FactorLabel
                            label={SCORE_LABELS[key] ?? key}
                            active={active}
                            hint={factorRangeHint(MODIFIER_WEIGHT_KEYS[key] ?? key, snapshot)}
                          />
                          <BarTrack
                            pct={modifierBarPct(value, max)}
                            fillClassName={modifierFillClassName(value, group.key)}
                          />
                          <span
                            className={twJoin(
                              'col-span-2 text-right font-mono',
                              factorValueClassName(
                                active,
                                value != null ? Math.round(value) : null,
                              ),
                            )}
                          >
                            {formatModifierValue(value, max)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Eigene Daten: its own category (not in Bedarf/Bebauung), amber (largest
              hue distance to blue/purple on the color wheel, see spaceFinderPanelStyles.ts) —
              independent of the map layer color of the uploaded areas (violet).
              One row per dataset: bonus/penalty in points or „ausgeschlossen“ (hard cut,
              no points). Without breakdown (legacy runs, coarse cells) only the total effect. */}
          {showEigendaten && (
            <div
              className={twJoin(
                'rounded-r border-l-[3px] py-1 pr-1 pl-2',
                spaceFinderGroupStyle.eigendaten.block,
              )}
            >
              <div
                className={twJoin(
                  'mb-1 border-b pb-0.5',
                  spaceFinderGroupHeadingClass,
                  spaceFinderGroupStyle.eigendaten.headline,
                  spaceFinderGroupStyle.eigendaten.title,
                )}
              >
                Eigene Daten
              </div>
              {eigendatenDetails.length > 0 ? (
                // One row per dataset with its name; the sum is in the total score.
                eigendatenDetails.map((detail) =>
                  detail.p != null ? (
                    <div key={detail.id} className={twJoin(ROW_GRID, 'py-1 text-xs')}>
                      <span
                        className={twJoin('truncate pr-3', spaceFinderFactorActiveTextClass)}
                        title={datasetName(detail.id)}
                      >
                        {datasetName(detail.id)}
                      </span>
                      <BarTrack
                        pct={modifierBarPct(detail.p, datasetMax(detail.id))}
                        fillClassName={modifierFillClassName(detail.p, 'eigendaten')}
                      />
                      <span
                        className={twJoin(
                          'col-span-2 text-right font-mono',
                          factorValueClassName(true, Math.round(detail.p)),
                        )}
                      >
                        {formatModifierValue(detail.p, datasetMax(detail.id))}
                      </span>
                    </div>
                  ) : (
                    <div key={detail.id} className={twJoin(ROW_GRID, 'py-1 text-xs')}>
                      <span
                        className={twJoin('truncate pr-3', spaceFinderFactorActiveTextClass)}
                        title={datasetName(detail.id)}
                      >
                        {datasetName(detail.id)}
                      </span>
                      <span className="col-span-3 text-right font-semibold text-gray-800">
                        ausgeschlossen
                      </span>
                    </div>
                  ),
                )
              ) : (
                // Runs from before the per-dataset breakdown: only the total effect is known.
                <div className={twJoin(ROW_GRID, 'py-1 text-xs')}>
                  <span className={twJoin('pr-3', spaceFinderFactorActiveTextClass)}>
                    {SCORE_LABELS.score_eigendaten}
                  </span>
                  <BarTrack
                    pct={modifierBarPct(props.score_eigendaten, modifierMax('score_eigendaten'))}
                    fillClassName={modifierFillClassName(props.score_eigendaten, 'eigendaten')}
                  />
                  <span
                    className={twJoin(
                      'col-span-2 text-right font-mono',
                      factorValueClassName(
                        true,
                        props.score_eigendaten != null ? Math.round(props.score_eigendaten) : null,
                      ),
                    )}
                  >
                    {formatModifierValue(props.score_eigendaten, modifierMax('score_eigendaten'))}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Disclosure>
  )
}

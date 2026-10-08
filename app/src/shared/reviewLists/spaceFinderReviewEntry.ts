import {
  PLANNING_CRITERION_SCORE_KEYS,
  PLANNING_MODIFIER_SCORE_KEYS,
  PLANNING_SCORE_LABELS,
} from '@/shared/regionen/planningScoreLabels.const'

/** Import identity of a Flächenfinder candidate in a review list; makes re-imports detectable. */
export const spaceFinderImportId = (h3Id: string) => `flaechenfinder:${h3Id}`

type CandidateProperties = Record<string, unknown>

const asNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

/**
 * Why a hexagon is excluded (mirrors `EXCLUSION_REASONS` of the hexagon inspector). Excluded
 * hexagons have no `mce_gesamtscore`. `score_hangneigung` is exactly 0 only above 10° slope.
 */
const exclusionReasons = (props: CandidateProperties) => {
  const reasons: string[] = []
  if (props.gebaeude) reasons.push('Gebäude')
  if (props.fahrbahn) reasons.push('Straße')
  if (props.score_hangneigung === 0) reasons.push('Zu steil')
  if (props.eigendaten_ausschluss) reasons.push('Eigene Daten')
  return reasons
}

const signedPoints = (value: number) => {
  const rounded = Math.round(value)
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded)}`
}

/**
 * One line, no line breaks, so it survives the single-line attribute editor. Markdown only makes
 * the detail view wrap it. Criteria are 0–100, modifiers signed points.
 */
const scoreBreakdown = (props: CandidateProperties) => {
  const label = (key: string) => PLANNING_SCORE_LABELS[key] ?? key
  const scores = ['score_bedarf', 'score_bebauung', ...PLANNING_CRITERION_SCORE_KEYS].flatMap(
    (key) => {
      const value = asNumber(props[key])
      return value === null ? [] : [`${label(key)} ${Math.round(value)}`]
    },
  )
  const modifiers = PLANNING_MODIFIER_SCORE_KEYS.flatMap((key) => {
    const value = asNumber(props[key])
    return value === null || Math.round(value) === 0 ? [] : [`${label(key)} ${signedPoints(value)}`]
  })
  const parts = [scores.join(' · ')]
  if (modifiers.length > 0) parts.push(`Zu-/Abschläge: ${modifiers.join(' · ')}`)
  return parts.filter(Boolean).join('; ')
}

/**
 * Readable snapshot of a candidate for the review list (shown and editable there). Keys are German
 * on purpose; missing values are omitted. No `tilda_` keys (reserved for export/system data).
 * `Teilscores_markdown` is rendered as Markdown by the entry detail.
 */
export const buildSpaceFinderReviewProperties = ({
  candidateProperties,
  areaTitle,
  variantTitle,
  useCaseLabel,
  h3Id,
}: {
  candidateProperties: CandidateProperties
  areaTitle: string
  variantTitle: string
  useCaseLabel: string | null
  h3Id: string
}) => {
  const score = asNumber(candidateProperties.mce_gesamtscore)
  const clusterAreaM2 = asNumber(candidateProperties.cluster_area_m2)
  const eignungsklasse = candidateProperties.eignungsklasse
  const reasons = exclusionReasons(candidateProperties)
  const breakdown = scoreBreakdown(candidateProperties)

  const properties: Record<string, string> = {}
  if (score !== null) properties.Gesamtscore = String(Math.round(score))
  if (typeof eignungsklasse === 'string' && eignungsklasse.trim() !== '') {
    properties.Eignungsklasse = eignungsklasse.trim()
  }
  if (reasons.length > 0) properties.Ausschluss = reasons.join(', ')
  if (clusterAreaM2 !== null) {
    properties['Clusterfläche (m²)'] = Math.round(clusterAreaM2).toLocaleString('de-DE')
  }
  if (useCaseLabel) properties.Nutzungsfall = useCaseLabel
  properties.Planungsgebiet = areaTitle
  properties.Variante = variantTitle
  properties['H3-ID'] = h3Id
  if (breakdown) properties.Teilscores_markdown = breakdown
  return properties
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Snapshot the take-over stored in `ReviewEntry.sourceMeta`; null when it has none. */
export const parseSpaceFinderSourceMeta = (sourceMeta: unknown) => {
  if (!isRecord(sourceMeta)) return null
  const { areaTitle, variantTitle, variantId, runId } = sourceMeta
  return {
    areaTitle: typeof areaTitle === 'string' ? areaTitle : null,
    variantTitle: typeof variantTitle === 'string' ? variantTitle : null,
    variantId: typeof variantId === 'number' ? variantId : null,
    runId: typeof runId === 'number' ? runId : null,
  }
}

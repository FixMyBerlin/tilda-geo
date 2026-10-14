import { parseEigendatenDetails } from '@/shared/regionen/planningEigendatenDetails'
import {
  PLANNING_SCORE_GROUPS,
  PLANNING_SCORE_LABELS,
} from '@/shared/regionen/planningScoreLabels.const'
import { SPACE_FINDER_CHECKLIST } from './spaceFinderChecklist.const'

/** Import identity of a Flächenfinder candidate in a review list; makes re-imports detectable. */
export const spaceFinderImportId = (h3Id: string) => `flaechenfinder:${h3Id}`

type CandidateProperties = Record<string, unknown>

/** Datensatz-ID → Name der Eigene-Daten-Datensätze, wie im Lauf gerechnet. */
type EigendatenNames = Record<string, string>

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
  // Welcher Datensatz ausschließt, steht bei den Teilscores.
  if (props.eigendaten_ausschluss) reasons.push('Eigene Daten')
  return reasons
}

const signedPoints = (value: number) => {
  const rounded = Math.round(value)
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded)}`
}
/**
 * The Teilscores in the order and hierarchy of the hexagon inspector: per group (Bedarf, Bebauung)
 * its score, the criteria (0–100) and under "Zu- und Abschläge" the signed points; then one line
 * per Eigene-Daten dataset. Values the run did not compute are left out. It needs line breaks, so
 * the single-line attribute editor flattens it when someone edits and saves the attributes (known,
 * accepted for now).
 */
const scoreBreakdown = (props: CandidateProperties, names?: EigendatenNames) => {
  const label = (key: string) => PLANNING_SCORE_LABELS[key] ?? key
  const blocks: string[] = []

  for (const group of PLANNING_SCORE_GROUPS) {
    const groupScore = asNumber(props[group.scoreKey])
    const criteria = group.criteria.flatMap((key) => {
      const value = asNumber(props[key])
      return value === null ? [] : [`- ${label(key)} ${Math.round(value)}`]
    })
    const modifiers = group.modifiers.flatMap((key) => {
      const value = asNumber(props[key])
      return value === null ? [] : [`  - ${label(key)} ${signedPoints(value)}`]
    })
    if (groupScore === null && criteria.length === 0 && modifiers.length === 0) continue
    const lines = [`**${group.label}${groupScore === null ? '' : ` ${Math.round(groupScore)}`}**`]
    if (criteria.length > 0 || modifiers.length > 0) lines.push('')
    lines.push(...criteria)
    if (modifiers.length > 0) lines.push('- Zu- und Abschläge', ...modifiers)
    blocks.push(lines.join('\n'))
  }

  // Eigene Daten: je Datensatz mit Namen — Punkte oder „ausgeschlossen“ (Alt-Läufe: Gesamtwert).
  const details = parseEigendatenDetails(props.eigendaten_details)
  const total = asNumber(props.score_eigendaten)
  const eigendaten =
    details.length > 0
      ? details.map((detail) => {
          const name = `„${names?.[detail.id] ?? 'Eigene Daten'}“`
          return detail.x != null
            ? `- ${name} ausgeschlossen`
            : `- ${name} ${signedPoints(detail.p ?? 0)}`
        })
      : total === null
        ? []
        : [`- ${label('score_eigendaten')} ${signedPoints(total)}`]
  if (eigendaten.length > 0) {
    blocks.push([`**${label('score_eigendaten')}**`, '', ...eigendaten].join('\n'))
  }

  return blocks.join('\n\n')
}

/**
 * The checklist as a numbered Markdown list. It needs line breaks, so the single-line attribute
 * editor flattens it when someone edits and saves the attributes (known, accepted for now).
 */
const checklistMarkdown = () =>
  SPACE_FINDER_CHECKLIST.map((criterion, index) => `${index + 1}. ${criterion.label}`).join('\n')

/**
 * Readable snapshot of a candidate for the review list (shown and editable there). Keys are German
 * on purpose; missing values are omitted. No `tilda_` keys (reserved for export/system data).
 * `Teilscores_markdown` is rendered as Markdown by the entry detail.
 */
export const buildSpaceFinderReviewProperties = ({
  candidateProperties,
  areaTitle,
  variantTitle,
  h3Id,
  eigendatenNames,
}: {
  candidateProperties: CandidateProperties
  areaTitle: string
  variantTitle: string
  h3Id: string
  /** Namen der Eigene-Daten-Datensätze des Laufs (ID → Name), falls vorhanden. */
  eigendatenNames?: EigendatenNames
}) => {
  const score = asNumber(candidateProperties.mce_gesamtscore)
  const clusterAreaM2 = asNumber(candidateProperties.cluster_area_m2)
  const eignungsklasse = candidateProperties.eignungsklasse
  const reasons = exclusionReasons(candidateProperties)
  const breakdown = scoreBreakdown(candidateProperties, eigendatenNames)

  const properties: Record<string, string> = {}
  if (score !== null) properties.Gesamtscore = String(Math.round(score))
  if (typeof eignungsklasse === 'string' && eignungsklasse.trim() !== '') {
    properties.Eignungsklasse = eignungsklasse.trim()
  }
  if (reasons.length > 0) properties.Ausschluss = reasons.join(', ')
  if (clusterAreaM2 !== null) {
    properties['Clusterfläche (m²)'] = Math.round(clusterAreaM2).toLocaleString('de-DE')
  }
  properties.Planungsgebiet = areaTitle
  properties.Variante = variantTitle
  properties['H3-ID'] = h3Id
  if (breakdown) properties.Teilscores_markdown = breakdown
  properties.Prüfkriterien_markdown = checklistMarkdown()
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

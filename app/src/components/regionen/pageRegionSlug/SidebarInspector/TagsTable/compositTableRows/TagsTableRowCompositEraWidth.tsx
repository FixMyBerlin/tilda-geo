import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid'
import { twJoin } from 'tailwind-merge'
import { getDescriptionForInspectorTag } from '@/data/topicDocs/runtime'
import { TagsTableRowFrame } from '../TagsTableRow'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { renderTranslationHtml } from '../translations/renderTranslationHtml'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import { NodataFallbackWrapper } from './NodataFallbackWrapper'
import type { CompositTableRow } from './types'

export const tableKeyEraWidth = 'composit_era_width'

type EraWidthCheck = 'regelmass' | 'mindestmass' | 'klammerwert' | 'unterschritten' | 'unbekannt'

const eraWidthCheckBadges = {
  regelmass: { Icon: CheckCircleIcon, className: 'text-green-600', title: 'ERA-Regelmaß erfüllt' },
  mindestmass: {
    Icon: ExclamationTriangleIcon,
    className: 'text-amber-500',
    title: 'Nur das ERA-Mindestmaß erfüllt',
  },
  klammerwert: {
    Icon: ExclamationTriangleIcon,
    className: 'text-amber-500',
    title: 'Nur den ERA-Klammerwert erfüllt',
  },
  unterschritten: { Icon: XCircleIcon, className: 'text-red-600', title: 'ERA-Maß unterschritten' },
  unbekannt: {
    Icon: QuestionMarkCircleIcon,
    className: 'text-gray-300',
    title: 'Nicht nach ERA bewertbar',
  },
} satisfies Record<
  EraWidthCheck,
  { Icon: typeof CheckCircleIcon; className: string; title: string }
>

const isEraWidthCheck = (value: unknown): value is EraWidthCheck =>
  typeof value === 'string' && value in eraWidthCheckBadges

/**
 * Breite der Radverkehrsanlage samt Ergebnis des ERA-Checks (FGSV ERA 2010, Tabelle 5).
 * Ohne `era_*`-Attribute kennt Tabelle 5 für diese Führungsform kein Breitenmaß.
 */
export const TagsTableRowCompositEraWidth = ({ sourceId, properties }: CompositTableRow) => {
  const check = isEraWidthCheck(properties.era_width_check) ? properties.era_width_check : undefined
  const badge = check ? eraWidthCheckBadges[check] : eraWidthCheckBadges.unbekannt
  const anlagentypen =
    typeof properties.era_anlagentyp === 'string' ? properties.era_anlagentyp.split(';') : []
  const assumed = properties.era_width_confidence === 'low'
  const regelmass = properties.era_width_regelmass as number | undefined
  const usedWidth = properties.era_width_used as number | undefined
  const width = properties.width as number | undefined
  const markingAdded = usedWidth !== undefined && width !== undefined && usedWidth > width
  const checkDescription = check
    ? getDescriptionForInspectorTag(sourceId, 'era_width_check', check)
    : undefined

  return (
    <TagsTableRowFrame label="Breite">
      <NodataFallbackWrapper fallback={width === undefined}>
        <ValueDisclosure>
          <ValueDisclosureButton>
            <span className="flex items-center gap-1">
              <ConditionalFormattedValue
                sourceId={sourceId}
                tagKey="width"
                tagValue={width === undefined ? undefined : String(width)}
              />
              <badge.Icon
                className={twJoin('size-4 shrink-0', badge.className, assumed && 'opacity-60')}
                title={badge.title}
              />
            </span>
            <span className="block text-xs text-gray-400">
              {anlagentypen.map((anlagentyp, index) => (
                <span key={anlagentyp}>
                  {index > 0 && ' oder '}
                  <ConditionalFormattedValue
                    sourceId={sourceId}
                    tagKey="era_anlagentyp"
                    tagValue={anlagentyp}
                  />
                </span>
              ))}
              {regelmass === undefined ? (
                <>{anlagentypen.length ? ' – ' : ''}Keine ERA-Bewertung möglich</>
              ) : (
                <>
                  {' – ERA-Regelmaß '}
                  <ConditionalFormattedValue
                    sourceId={sourceId}
                    tagKey="era_width_regelmass"
                    tagValue={String(regelmass)}
                  />
                  {assumed && ' vermutlich'}
                  {check === 'regelmass' ? ' erfüllt' : ' nicht erfüllt'}
                </>
              )}
            </span>
          </ValueDisclosureButton>
          <ValueDisclosurePanel>
            {check === undefined && (
              <p>
                Die ERA nennt in Tabelle 5 für diese Führungsform kein Breitenmaß. Die Breite bleibt
                deshalb unbewertet.
              </p>
            )}
            {checkDescription && <p>{renderTranslationHtml(checkDescription)}</p>}
            {anlagentypen.length > 1 && (
              <p>
                Welcher Anlagentyp zutrifft, geben die Daten nicht her; geprüft wurde deshalb gegen
                alle genannten Zeilen der Tabelle 5.
              </p>
            )}
            {assumed && (
              <p>
                Die Verkehrsrichtung ist nicht erfasst, sondern angenommen. Trifft die Annahme nicht
                zu, gilt ein anderes Regelmaß und die Bewertung kann kippen.
              </p>
            )}
            {usedWidth !== undefined && (
              <p>
                <em>Geprüfte Breite:</em>{' '}
                <ConditionalFormattedValue
                  sourceId={sourceId}
                  tagKey="era_width_used"
                  tagValue={String(usedWidth)}
                />
                {markingAdded && ' (erfasste Breite zuzüglich 0,25 m Markierung)'}
              </p>
            )}
            {check && (
              <p>
                {check === 'regelmass'
                  ? 'Damit auch konform zur FGSV E-Klima.'
                  : 'Konform zur FGSV E-Klima ist nur, was das Regelmaß erreicht.'}
              </p>
            )}
          </ValueDisclosurePanel>
        </ValueDisclosure>
      </NodataFallbackWrapper>
    </TagsTableRowFrame>
  )
}

import { Fragment } from 'react'
import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { Link } from '@/components/shared/links/Link'
import { Markdown } from '@/components/shared/text/Markdown'
import { TopicDocAttributePurposePill } from '@/components/shared/topicDocs/TopicDocAttributePurposePill'
import { topicDocPurposeMeta, topicDocPurposeOrder } from '@/data/topicDocs/purpose'
import type {
  TopicDocCompiled,
  TopicDocCompiledAttribute,
  TopicDocCompiledValue,
} from '@/data/topicDocs/runtime'
import {
  getTopicDocAttributeFormatDisplay,
  topicDocSanitizedStringsFormatDisplay,
} from '@/data/topicDocs/schema'
import { DOCS_PAGE_SECTION_H2_CLASSNAME, DOCS_PAGE_SECTION_IDS } from './docsSectionIds.const'

type Props = {
  topicDoc: TopicDocCompiled | null
  tableName: SourceExportApiIdentifier
  regionSlug: string | null
}

type AttributeSectionContext = Pick<Props, 'tableName' | 'regionSlug'>

const attributeDescriptionMarkdownClassName =
  'prose-sm max-w-none m-0 text-xs leading-snug text-gray-600 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_p]:m-0 [&_p]:text-xs [&_p]:leading-snug'

type AttributePresentationGroup = {
  attributes: ReadonlyArray<TopicDocCompiledAttribute>
  representative: TopicDocCompiledAttribute
}

const serializeAttributeValues = (values?: ReadonlyArray<TopicDocCompiledValue>) =>
  JSON.stringify(
    (values ?? []).map((value) => ({
      value: value.value,
      label: value.label,
      description: value.description?.trim() ?? '',
      chapterRefs: value.chapterRefs ?? [],
    })),
  )

const normalizeDescriptionForGrouping = (description?: string) => {
  const trimmed = description?.trim() ?? ''
  const marker = '(technisch bereinigt)'
  const markerIndex = trimmed.indexOf(marker)
  if (markerIndex >= 0) return trimmed.slice(markerIndex)
  return trimmed
}

const getAttributePresentationSignature = (attribute: TopicDocCompiledAttribute) =>
  [
    attribute.type,
    normalizeDescriptionForGrouping(attribute.description),
    JSON.stringify(attribute.chapterRefs ?? []),
    serializeAttributeValues(attribute.values),
  ].join('\0')

const attributeHasValueList = (attribute: TopicDocCompiledAttribute) =>
  Boolean(attribute.values?.length)

const attributeKeysSharePresentationGroup = (
  left: TopicDocCompiledAttribute,
  right: TopicDocCompiledAttribute,
) => {
  if (!attributeKeysShareCombinablePrefix(left.key, right.key)) return false
  if (getAttributePresentationSignature(left) !== getAttributePresentationSignature(right)) {
    return false
  }

  const leftHasValues = attributeHasValueList(left)
  const rightHasValues = attributeHasValueList(right)
  if (leftHasValues && rightHasValues) return true

  return (
    !leftHasValues &&
    !rightHasValues &&
    left.type === 'sanitized_strings' &&
    right.type === 'sanitized_strings'
  )
}

const getAttributeKeyGroupPrefix = (key: string) => key.split('_')[0] ?? key

const attributeKeysShareCombinablePrefix = (leftKey: string, rightKey: string) =>
  getAttributeKeyGroupPrefix(leftKey) === getAttributeKeyGroupPrefix(rightKey)

const groupAttributesForPresentation = (attributes: ReadonlyArray<TopicDocCompiledAttribute>) => {
  const groups: AttributePresentationGroup[] = []

  for (const attribute of attributes) {
    const previousGroup = groups.at(-1)
    const previousAttribute = previousGroup?.attributes.at(-1)
    const canExtendPreviousGroup =
      previousGroup &&
      previousAttribute &&
      attributeKeysSharePresentationGroup(previousAttribute, attribute)

    if (canExtendPreviousGroup) {
      groups[groups.length - 1] = {
        representative: previousGroup.representative,
        attributes: [...previousGroup.attributes, attribute],
      }
      continue
    }

    groups.push({ attributes: [attribute], representative: attribute })
  }

  return groups
}

const attributeHasDescriptionContent = (attribute: TopicDocCompiledAttribute) =>
  Boolean(attribute.description?.trim() || attribute.chapterRefs?.[0])

const AttributeDescriptionCell = ({
  attribute,
  tableName,
  regionSlug,
  valueDescription,
}: {
  attribute: TopicDocCompiledAttribute
  tableName: AttributeSectionContext['tableName']
  regionSlug: AttributeSectionContext['regionSlug']
  valueDescription?: string
}) => {
  const description = valueDescription ?? attribute.description?.trim()
  const chapterRef = attribute.chapterRefs?.[0]

  if (!description && !chapterRef) return null

  return (
    <>
      {description ? (
        <Markdown markdown={description} className={attributeDescriptionMarkdownClassName} />
      ) : null}
      {chapterRef && !valueDescription ? (
        <p className="m-0 text-xs leading-snug">
          <Link
            to="/docs/$tableName"
            params={{ tableName }}
            search={{ r: regionSlug ?? undefined }}
            hash={chapterRef}
          >
            Mehr...
          </Link>
        </p>
      ) : null}
    </>
  )
}

const AttributeFormat = ({ attribute }: { attribute: TopicDocCompiledAttribute }) => {
  const display = getTopicDocAttributeFormatDisplay(attribute.type)
  if (!display) return <>–</>
  return <code title={display.title}>{`<${display.label}>`}</code>
}

const attributeKeyLabelMarkdownClassName =
  'prose-sm max-w-none m-0 font-medium not-italic [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_p]:m-0 [&_p]:font-medium'

const attributeValueLabelMarkdownClassName =
  'prose-sm max-w-none m-0 leading-snug [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_p]:m-0 [&_p]:font-normal [&_p]:leading-snug'

const AttributeKeyCell = ({ keyName }: { keyName: string }) => (
  <code className="font-medium break-all">{keyName}</code>
)

const AttributeKeyLabelCell = ({ label }: { label: string }) => (
  <Markdown markdown={label} className={attributeKeyLabelMarkdownClassName} />
)

const AttributeValueLabelCell = ({ label }: { label: string }) => (
  <Markdown markdown={label} className={attributeValueLabelMarkdownClassName} />
)

const attributeCellPaddingClassName = 'px-1.5 py-1.5'

const valueRowCellClassName = `min-w-0 align-top ${attributeCellPaddingClassName}`
const valueRowSecondCellClassName = `align-top ${attributeCellPaddingClassName}`

const keyRowClassName = 'border-t-2 border-gray-200'
const keyRowCellClassName = 'align-top bg-gray-50'
const keyRowGridClassName = 'grid grid-cols-[2fr_3fr] gap-y-1.5 p-1.5'

const AttributeValueKeyCell = ({ value }: { value: string }) => (
  <div className="flex items-start gap-1.5">
    <span className="mt-0.5 shrink-0 text-gray-500" aria-hidden="true">
      •
    </span>
    <code className="min-w-0 break-all">{value}</code>
  </div>
)

const attributeHasFormatDisplay = (attribute: TopicDocCompiledAttribute) =>
  getTopicDocAttributeFormatDisplay(attribute.type) !== undefined

const AttributeKeyRowCells = ({
  attributes,
  representative,
  hasValues,
  tableName,
  regionSlug,
  showDescription,
}: {
  attributes: ReadonlyArray<TopicDocCompiledAttribute>
  representative: TopicDocCompiledAttribute
  hasValues: boolean
  tableName: AttributeSectionContext['tableName']
  regionSlug: AttributeSectionContext['regionSlug']
  showDescription?: boolean
}) => (
  <td colSpan={2} className={`${keyRowCellClassName} p-0`}>
    <div className={keyRowGridClassName}>
      {attributes.map((attribute) => (
        <Fragment key={attribute.key}>
          <div className="min-w-0">
            <AttributeKeyCell keyName={attribute.key} />
          </div>
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <AttributeKeyLabelCell label={attribute.label} />
            {(!hasValues || representative.type === 'sanitized_strings') &&
            attributeHasFormatDisplay(representative) ? (
              <AttributeFormat attribute={representative} />
            ) : null}
          </div>
        </Fragment>
      ))}
      {showDescription && attributeHasDescriptionContent(representative) ? (
        <div className="col-span-2 pt-0">
          <AttributeDescriptionCell
            attribute={representative}
            tableName={tableName}
            regionSlug={regionSlug}
          />
        </div>
      ) : null}
    </div>
  </td>
)

const AttributeGroupRows = ({
  group,
  tableName,
  regionSlug,
}: {
  group: AttributePresentationGroup
  tableName: AttributeSectionContext['tableName']
  regionSlug: AttributeSectionContext['regionSlug']
}) => {
  const { attributes, representative } = group
  const hasValues = Boolean(representative.values?.length)

  if (hasValues) {
    return (
      <>
        <tr className={keyRowClassName}>
          <AttributeKeyRowCells
            attributes={attributes}
            representative={representative}
            hasValues
            tableName={tableName}
            regionSlug={regionSlug}
            showDescription
          />
        </tr>
        {representative.type === 'sanitized_strings' ? (
          <tr>
            <td
              colSpan={2}
              className={`${valueRowCellClassName} text-xs leading-snug text-gray-600`}
            >
              {topicDocSanitizedStringsFormatDisplay.documentedValuesIntro}
            </td>
          </tr>
        ) : null}
        {representative.values?.map((value) => (
          <tr key={value.value}>
            <td className={valueRowCellClassName}>
              <AttributeValueKeyCell value={value.value} />
            </td>
            <td className={valueRowSecondCellClassName}>
              <div className="space-y-1">
                <AttributeValueLabelCell label={value.label} />
                {value.description?.trim() ? (
                  <Markdown
                    markdown={value.description}
                    className={attributeDescriptionMarkdownClassName}
                  />
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </>
    )
  }

  return (
    <tr className={keyRowClassName}>
      <AttributeKeyRowCells
        attributes={attributes}
        representative={representative}
        hasValues={false}
        tableName={tableName}
        regionSlug={regionSlug}
        showDescription
      />
    </tr>
  )
}

const AttributesTable = ({
  attributes,
  tableName,
  regionSlug,
}: {
  attributes: ReadonlyArray<TopicDocCompiledAttribute>
  tableName: AttributeSectionContext['tableName']
  regionSlug: AttributeSectionContext['regionSlug']
}) => (
  <table className="w-full text-sm">
    <thead>
      <tr>
        <th className="w-2/5 text-left">Schlüssel / Wert</th>
        <th className="text-left">Übersetzung oder Format</th>
      </tr>
    </thead>
    <tbody>
      {groupAttributesForPresentation(attributes).map((group) => (
        <AttributeGroupRows
          key={group.attributes.map((attribute) => attribute.key).join('|')}
          group={group}
          tableName={tableName}
          regionSlug={regionSlug}
        />
      ))}
    </tbody>
  </table>
)

export const PageDocsAttributesSection = ({ topicDoc, tableName, regionSlug }: Props) => {
  if (!topicDoc) return null

  const mainAttributes = topicDoc.attributes.filter(
    (attribute) => attribute.type !== 'ignore' && !attribute.purpose,
  )
  const purposeAttributes = topicDoc.attributes.filter((attribute) => attribute.purpose)
  const ignoredKeys = topicDoc.attributes
    .filter((attribute) => attribute.type === 'ignore' && !attribute.purpose)
    .map((attribute) => attribute.key)
    .sort((a, b) => a.localeCompare(b))

  const hasAdditionalAttributes = purposeAttributes.length > 0 || ignoredKeys.length > 0

  return (
    <section>
      <h2 className={DOCS_PAGE_SECTION_H2_CLASSNAME} id={DOCS_PAGE_SECTION_IDS.attributtabelle}>
        Attributtabelle
      </h2>
      <AttributesTable attributes={mainAttributes} tableName={tableName} regionSlug={regionSlug} />
      {hasAdditionalAttributes ? (
        <details className="not-prose mt-6 rounded border border-gray-200 bg-gray-50">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-900 select-none hover:bg-gray-100">
            Weitere Attribute (Processing, QA, Experimentation)
          </summary>
          <div className="space-y-6 border-t border-gray-200 p-3 pt-4">
            {topicDocPurposeOrder.map((purpose) => {
              const attributesForPurpose = purposeAttributes.filter(
                (attribute) => attribute.purpose === purpose,
              )
              if (!attributesForPurpose.length) return null

              return (
                <div key={purpose}>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="m-0 text-sm font-semibold text-gray-900">
                      {topicDocPurposeMeta[purpose].heading}
                    </h3>
                    <TopicDocAttributePurposePill purpose={purpose} />
                  </div>
                  <p className="mt-0 mb-3 text-sm text-gray-600">
                    {topicDocPurposeMeta[purpose].legendText}
                  </p>
                  <AttributesTable
                    attributes={attributesForPurpose}
                    tableName={tableName}
                    regionSlug={regionSlug}
                  />
                </div>
              )
            })}
            {ignoredKeys.length > 0 ? (
              <blockquote className="not-prose border-l-4 border-gray-300 pl-4 text-sm text-gray-800">
                <p className="m-0">
                  <strong>Undokumentierte Attribute:</strong> Einige Attribute sind undokumentiert,
                  da sie noch nicht in den Standard überführt wurden oder rein zur
                  Qualitätssicherung genutzt werden. Diese Eigenschaften sollten bei der Arbeit mit
                  den Daten ignoriert werden. Sie können sich jederzeit ändern oder auch gelöscht
                  werden.
                </p>
                <p className="mt-3 mb-0">
                  <strong>Diese Attribute sind undokumentiert:</strong>{' '}
                  {ignoredKeys.map((key, index) => (
                    <Fragment key={key}>
                      {index > 0 ? ', ' : null}
                      <code>{key}</code>
                    </Fragment>
                  ))}
                </p>
              </blockquote>
            ) : null}
          </div>
        </details>
      ) : null}
    </section>
  )
}

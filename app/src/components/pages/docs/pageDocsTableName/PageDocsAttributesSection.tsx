import { Fragment } from 'react'
import { Link } from '@/components/shared/links/Link'
import { DOCS_PAGE_SECTION_H2_CLASSNAME, DOCS_PAGE_SECTION_IDS } from './docsSectionIds.const'
import type { DocsPageAttributesProps } from './types'

export const PageDocsAttributesSection = ({
  topicDoc,
  tableName,
  regionSlug,
}: DocsPageAttributesProps) => {
  if (!topicDoc) return null

  const tableAttributes = topicDoc.attributes.filter((attribute) => attribute.type !== 'ignore')
  const ignoredKeys = topicDoc.attributes
    .filter((attribute) => attribute.type === 'ignore')
    .map((attribute) => attribute.key)
    .sort((a, b) => a.localeCompare(b))

  return (
    <section>
      <h2 className={DOCS_PAGE_SECTION_H2_CLASSNAME} id={DOCS_PAGE_SECTION_IDS.attributtabelle}>
        Attributtabelle
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Schlüssel</th>
            <th className="text-left">Werte und Beschreibung</th>
          </tr>
        </thead>
        <tbody>
          {tableAttributes.map((attribute) => (
            <tr key={attribute.key}>
              <td className="align-top">
                <code>{attribute.key}</code>: {attribute.label}
              </td>
              <td className="align-top">
                <div className="space-y-2 [&_ul]:my-0! [&>p:first-child]:mt-0!">
                  {attribute.values?.length ? (
                    <ul className="m-0 list-disc pl-5">
                      {attribute.values.map((value) => (
                        <li key={value.value}>
                          <code>{value.value}</code>: {value.label}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="m-0">
                      <strong>Werte:</strong>{' '}
                      {attribute.type === 'number' ? (
                        <code>{'<Zahl>'}</code>
                      ) : attribute.type === 'sanitized_strings' ? (
                        <>
                          <code>{'<Zeichenketten aus OSM>'}</code> (technisch bereinigt)
                        </>
                      ) : (
                        '–'
                      )}
                    </p>
                  )}
                  {attribute.description?.trim() || attribute.chapterRefs?.[0] ? (
                    <p className="m-0">
                      {attribute.description?.trim() ? (
                        <>
                          <strong>Beschreibung:</strong> {attribute.description}
                          {attribute.chapterRefs?.[0] ? ' ' : null}
                        </>
                      ) : null}
                      {attribute.chapterRefs?.[0] ? (
                        <Link
                          to="/docs/$tableName"
                          params={{ tableName }}
                          search={{ r: regionSlug ?? undefined }}
                          hash={attribute.chapterRefs[0]}
                        >
                          Mehr...
                        </Link>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {ignoredKeys.length > 0 ? (
        <blockquote className="not-prose mt-6 border-l-4 border-gray-300 pl-4 text-sm text-gray-800">
          <p className="m-0">
            <strong>Undokumentierte Attribute:</strong> Einige Attribute sind undokumentiert, da sie
            noch nicht in den Standard überführt wurden oder rein zur Qualitätssicherung genutzt
            werden. Diese Eigenschaften sollten bei der Arbeit mit den Daten ignoriert werden. Sie
            können sich jederzeit ändern oder auch gelöscht werden.
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
    </section>
  )
}

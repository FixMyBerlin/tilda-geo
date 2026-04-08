import { CopyButton } from '@/components/shared/CopyButton'
import { Link } from '@/components/shared/links/Link'
import { DOCS_PAGE_SECTION_H2_CLASSNAME, DOCS_PAGE_SECTION_IDS } from './docsSectionIds.const'
import type { DocsPageMasterportal } from './types'

const masterportalDocsServicesUrl =
  'https://www.masterportal.org/mkdocs/doc/Latest/User/Global-Config/services.json/#gfi-attributes'

const masterportalDocsGfiHtmlUrl =
  'https://www.masterportal.org/mkdocs/doc/Latest/User/Global-Config/services.json/#gfiattributes-html'

type Props = {
  masterportal: DocsPageMasterportal
}

export const PageDocsMasterportalSection = ({ masterportal }: Props) => {
  const gfiAttributesJson = masterportal ? JSON.stringify(masterportal, null, 2) : null

  return (
    <section className="print:hidden">
      <h2 className={DOCS_PAGE_SECTION_H2_CLASSNAME} id={DOCS_PAGE_SECTION_IDS.masterportal}>
        Masterportal
      </h2>
      <p>
        Die Attribute im Datensatz sind für die Nutzung in Karten- und Analysesoftware optimiert.
        Die Attribute können auch im Masterportal automatisch übersetzt werden. Dafür muss eine
        Konfiguration wie unten angegeben in der Konfiguration der Datenquelle hinterlegt werden.
        Mehr dazu in der{' '}
        <Link href={masterportalDocsServicesUrl} blank className="underline">
          Dokumentation des Masterportals
        </Link>{' '}
        (einfache Labels,{' '}
        <Link href={masterportalDocsGfiHtmlUrl} blank className="underline">
          Typen wie Zahl oder HTML/Links
        </Link>
        ).
      </p>
      {gfiAttributesJson ? (
        <details className="not-prose mt-4 rounded border border-gray-200 bg-gray-50">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-900 select-none hover:bg-gray-100">
            gfiAttributes-Konfiguration (JSON)
          </summary>
          <div className="border-t border-gray-200 p-3 pt-2">
            <div className="mb-2 flex justify-end print:hidden">
              <CopyButton toCopy={gfiAttributesJson} label="JSON kopieren" />
            </div>
            <pre className="overflow-x-auto text-xs leading-relaxed">
              <code>{gfiAttributesJson}</code>
            </pre>
          </div>
        </details>
      ) : (
        <p className="not-prose m-0 mt-4 text-sm text-gray-600">
          Keine Masterportal-Konfiguration vorhanden.
        </p>
      )}
    </section>
  )
}

import { DocumentHeading } from '@/components/shared/text/DocumentHeading'
import { Markdown } from '@/components/shared/text/Markdown'
import { DOCS_PAGE_SECTION_H2_CLASSNAME } from './docsSectionIds.const'
import type { DocsPageTopicDoc } from './types'

type Props = {
  topicDoc: DocsPageTopicDoc
}

export const PageDocsChaptersSection = ({ topicDoc }: Props) => {
  if (!topicDoc) return null

  return (
    <section>
      {topicDoc.chapters.map((chapter) => (
        <article key={chapter.id}>
          <DocumentHeading as="h2" id={chapter.id} className={DOCS_PAGE_SECTION_H2_CLASSNAME}>
            {chapter.title}
          </DocumentHeading>
          <Markdown
            markdown={chapter.markdown}
            headingStyle="document"
            headingLevelOffset={1}
            headingIdPrefix={chapter.id}
          />
        </article>
      ))}
    </section>
  )
}

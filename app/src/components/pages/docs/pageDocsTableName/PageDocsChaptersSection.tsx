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
        <article id={chapter.id} key={chapter.id}>
          <h2 className={DOCS_PAGE_SECTION_H2_CLASSNAME}>{chapter.title}</h2>
          <Markdown markdown={chapter.markdown} />
        </article>
      ))}
    </section>
  )
}

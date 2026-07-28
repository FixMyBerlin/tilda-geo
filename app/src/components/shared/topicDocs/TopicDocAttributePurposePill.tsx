import { topicDocPurposeMeta } from '@/data/topicDocs/purpose'
import type { TopicDocAttributePurpose } from '@/data/topicDocs/schema'

type Props = {
  purpose: TopicDocAttributePurpose
}

export const TopicDocAttributePurposePill = ({ purpose }: Props) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-none font-semibold ${topicDocPurposeMeta[purpose].pillClassName}`}
  >
    {topicDocPurposeMeta[purpose].pillLabel}
  </span>
)

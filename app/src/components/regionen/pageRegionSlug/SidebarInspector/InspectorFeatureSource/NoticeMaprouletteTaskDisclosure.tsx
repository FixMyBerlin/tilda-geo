import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import type { TodoId } from '@/data/processingTypes/todoId.generated.const'
import { campaigns } from '@/data/radinfra-de/campaigns'
import type { NoticeMaproulette } from './NoticeMaproulette'
import { NoticeMaprouletteTask } from './NoticeMaprouletteTask'

type Props = {
  projectKey: TodoId
  open: boolean
  onOpenChange: (open: boolean) => void
} & Omit<NoticeMaproulette, 'sourceId'> & {
    osmTypeIdString: string
  }

export const NoticeMaprouletteTaskDisclosure = ({
  projectKey,
  open,
  onOpenChange,
  osmTypeIdString,
  kind,
  properties,
  geometry,
}: Props) => {
  const radinfraCampaign = campaigns?.find((c) => c.id === projectKey)
  const title = radinfraCampaign?.title || `${projectKey} (in Arbeit)`

  return (
    <details open={open} className="overflow-clip rounded border border-white/70">
      <summary
        onClick={(event) => {
          event.preventDefault()
          onOpenChange(!open)
        }}
        className={twJoin(
          'focus-visible:ring-opacity-75 flex cursor-pointer list-none items-start bg-pink-100/80 py-2 pr-2 pl-2.5 text-left text-sm leading-tight font-semibold text-gray-900 hover:bg-pink-300/60 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 [&::-webkit-details-marker]:hidden',
          open ? 'rounded-b-none border-b border-b-white/70' : '',
        )}
      >
        <ChevronRightIcon
          className={twJoin(
            'mt-px mr-1.5 size-5 shrink-0 text-gray-900 transition-transform',
            open ? 'rotate-90 transform' : '',
          )}
        />
        <span className="not-prose min-w-0 leading-tight">{title}</span>
      </summary>
      <div className="bg-white/50 px-3 py-3 text-sm text-gray-700">
        <NoticeMaprouletteTask
          projectKey={projectKey}
          osmTypeIdString={osmTypeIdString}
          kind={kind}
          properties={properties}
          geometry={geometry}
        />
      </div>
    </details>
  )
}

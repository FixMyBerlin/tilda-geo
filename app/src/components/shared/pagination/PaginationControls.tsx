import type { PaginationSummary } from '@/shared/pagination/types'
import { PaginationNav } from './PaginationNav'

type PaginationControlsResult = PaginationSummary

type Props = {
  page: number
  result: PaginationControlsResult
  onPageChange: (page: number) => void
  className?: string
}

export const PaginationControls = ({ page, result, onPageChange, className }: Props) => {
  const { from, to, count, hasMore } = result

  return (
    <PaginationNav
      from={from}
      to={to}
      count={count}
      canGoPrevious={page > 1}
      canGoNext={hasMore}
      onPrevious={() => onPageChange(page - 1)}
      onNext={() => onPageChange(page + 1)}
      className={className}
    />
  )
}

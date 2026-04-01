import { twJoin } from 'tailwind-merge'
import { linkStyles } from '@/components/shared/links/styles'

type Props = { title?: string; data: object | undefined | null; open?: true; className?: string }

export const ObjectDump = ({ title, data, open, className }: Props) => {
  return (
    <details open={open} className={twJoin(className, 'prose-sm')}>
      <summary className={twJoin(linkStyles, 'cursor-pointer whitespace-nowrap')}>
        JSON Dump {title}
      </summary>
      <pre>{JSON.stringify(data, undefined, 2)}</pre>
    </details>
  )
}

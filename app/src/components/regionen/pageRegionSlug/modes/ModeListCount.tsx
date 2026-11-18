export type ModeListCountState =
  | { status: 'loading' }
  | { status: 'counted'; shown: number }
  | { status: 'capped'; shown: number; total: number }
  | { status: 'atLeast'; shown: number }

export type ModeListCountNouns = {
  singular: string
  plural: string
  pluralDative: string
}

type Props = {
  count: ModeListCountState
  nouns: ModeListCountNouns
}

const formatNumber = (value: number) => value.toLocaleString('de-DE')

export const ModeListCount = ({ count, nouns }: Props) => {
  return (
    <span
      data-testid="mode-list-count"
      className="ml-auto shrink-0 pl-1 text-xs whitespace-nowrap text-gray-500 tabular-nums"
    >
      {count.status === 'loading' && '…'}
      {count.status === 'counted' &&
        `${formatNumber(count.shown)} ${count.shown === 1 ? nouns.singular : nouns.plural}`}
      {count.status === 'capped' &&
        `${formatNumber(count.shown)} von ${formatNumber(count.total)} ${nouns.pluralDative}`}
      {count.status === 'atLeast' && `${formatNumber(count.shown)}+ ${nouns.plural}`}
    </span>
  )
}

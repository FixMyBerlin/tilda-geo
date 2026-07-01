type Props = {
  topicIds: string[]
  className?: string
}

export const ProcessingOrphanedTopicsNotice = ({ topicIds, className }: Props) => {
  if (topicIds.length === 0) return null

  return (
    <p className={className ?? 'text-sm text-gray-600'}>
      Veraltete Topics in Metadaten (im Diagramm ignoriert):{' '}
      <span className="font-mono text-gray-800">{topicIds.join(', ')}</span>
    </p>
  )
}

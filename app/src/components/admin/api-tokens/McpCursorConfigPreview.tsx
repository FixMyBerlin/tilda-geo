import { twJoin } from 'tailwind-merge'
import { CopyButton } from '@/components/shared/CopyButton'

const codeBlockClassName = twJoin(
  'overflow-x-auto rounded-lg bg-white p-3 text-xs text-gray-800 shadow-xs ring-1 ring-gray-900/10',
)

type McpCursorConfigPreviewProps = {
  configJson: string
  copyLabel?: string
  variant?: 'default' | 'success'
}

export function McpCursorConfigPreview({
  configJson,
  copyLabel = 'MCP-Konfiguration kopieren',
  variant = 'default',
}: McpCursorConfigPreviewProps) {
  const ringClassName =
    variant === 'success' ? 'ring-green-300 bg-white' : 'ring-gray-900/10 bg-white'

  return (
    <div className="space-y-2">
      <pre className={twJoin(codeBlockClassName, ringClassName)}>
        <code>{configJson}</code>
      </pre>
      <CopyButton toCopy={configJson} label={copyLabel} />
    </div>
  )
}

import { useState } from 'react'

type CopyButtonProps = {
  /** Payload to copy. With `asHtml`, written as `text/html` and the same string as `text/plain` (no stripping). */
  toCopy: string
  asHtml?: boolean
  label?: string
}

export const CopyButton = ({ toCopy, asHtml = false, label = 'Kopieren' }: CopyButtonProps) => {
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  const handleCopy = async () => {
    try {
      if (asHtml && toCopy && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([toCopy], { type: 'text/html' }),
            'text/plain': new Blob([toCopy], { type: 'text/plain' }),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(toCopy)
      }
      setStatus('ok')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      try {
        await navigator.clipboard.writeText(toCopy)
        setStatus('ok')
        setTimeout(() => setStatus('idle'), 2000)
      } catch {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      }
    }
  }

  const statusLabel = status === 'ok' ? 'Kopiert' : status === 'error' ? 'Fehler' : label

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
    >
      {statusLabel}
    </button>
  )
}

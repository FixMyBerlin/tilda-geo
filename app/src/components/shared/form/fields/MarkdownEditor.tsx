import MDEditor, { commands } from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import { twJoin } from 'tailwind-merge'
import { Markdown } from '@/components/shared/text/Markdown'
import './MarkdownEditor.css'

const commentToolbarCommands = [
  commands.bold,
  commands.italic,
  commands.strikethrough,
  commands.link,
  commands.quote,
]

const fullToolbarCommands = [
  commands.bold,
  commands.italic,
  commands.strikethrough,
  commands.heading2,
  commands.link,
  commands.quote,
  commands.code,
  commands.codeBlock,
  commands.unorderedListCommand,
  commands.orderedListCommand,
]

const markdownExtraCommands = [commands.codeEdit, commands.codeLive, commands.codePreview]

type PreviewMode = 'edit' | 'live' | 'preview'

type Toolbar = 'comment' | 'full'

type Props = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  id?: string
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  /** Initial editor chrome. Default `edit` (no preview pane); toolbar can still switch. */
  preview?: PreviewMode
  /** `comment`: bold/italic/strikethrough/link/quote. Lists still work when typed. */
  toolbar?: Toolbar
}

export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  id,
  placeholder,
  disabled,
  hasError,
  preview = 'edit',
  toolbar = 'comment',
}: Props) {
  return (
    <div
      className={twJoin(
        'markdown-editor overflow-hidden rounded-md border bg-white shadow-sm transition-[border-color,box-shadow]',
        hasError
          ? 'border-red-800 shadow-red-200 focus-within:border-red-800 focus-within:ring-1 focus-within:ring-red-800'
          : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 hover:border-gray-400 hover:ring-1 hover:ring-gray-200/70',
        disabled && 'cursor-not-allowed bg-gray-50 text-gray-500 opacity-60',
      )}
      data-color-mode="light"
      onBlur={onBlur}
    >
      <MDEditor
        value={value}
        onChange={(next?: string) => onChange(next ?? '')}
        height={220}
        preview={preview}
        highlightEnable={false}
        visibleDragbar={false}
        commands={toolbar === 'full' ? fullToolbarCommands : commentToolbarCommands}
        extraCommands={markdownExtraCommands}
        textareaProps={{
          id,
          placeholder,
          disabled,
          'aria-invalid': hasError,
        }}
        components={{
          preview: (source: string) => (
            <div className="p-3">
              {source.trim() ? (
                <Markdown markdown={source} />
              ) : (
                <p className="text-sm text-gray-400">Vorschau erscheint hier…</p>
              )}
            </div>
          ),
        }}
      />
    </div>
  )
}

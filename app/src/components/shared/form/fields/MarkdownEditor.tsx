import MDEditor, { commands } from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import { Markdown } from '@/components/shared/text/Markdown'
import './MarkdownEditor.css'

const markdownCommands = [
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

type Props = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  id?: string
  placeholder?: string
  disabled?: boolean
}

export function MarkdownEditor({ value, onChange, onBlur, id, placeholder, disabled }: Props) {
  return (
    <div
      className="markdown-editor overflow-hidden rounded-md"
      data-color-mode="light"
      onBlur={onBlur}
    >
      <MDEditor
        value={value}
        onChange={(next?: string) => onChange(next ?? '')}
        height={220}
        preview="live"
        highlightEnable={false}
        visibleDragbar={false}
        commands={markdownCommands}
        extraCommands={markdownExtraCommands}
        textareaProps={{
          id,
          placeholder,
          disabled,
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

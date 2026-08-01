import type { DeepKeys } from '@tanstack/form-core'
import type { FieldProps } from '@/components/shared/form/fields/sharedStyles'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import type { FormApi } from '@/components/shared/form/types'

type Props<T extends Record<string, unknown>> = FieldProps & {
  form: FormApi<T>
  name: DeepKeys<T>
  rows?: number
}

export function MarkdownEditorField<T extends Record<string, unknown>>({
  form,
  name,
  label,
  help,
  optional,
  rows = 6,
}: Props<T>) {
  return (
    <Textarea
      form={form}
      name={name}
      label={label}
      help={help ?? 'Markdown wird auf der Regionsseite gerendert.'}
      optional={optional}
      rows={rows}
      className="font-mono text-sm"
    />
  )
}

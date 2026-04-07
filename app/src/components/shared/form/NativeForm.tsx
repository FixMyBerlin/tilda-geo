import type { ComponentProps } from 'react'

type Props = Omit<ComponentProps<'form'>, 'method'>

/**
 * Use the shared {@link Form} component for TanStack Form flows.
 * For a plain DOM form (e.g. Headless UI grouping), use this so a stray native submit
 * does not become a GET navigation with field names in the query string.
 */
export function NativeForm({ onSubmit, ...props }: Props) {
  return (
    <form
      method="post"
      {...props}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.(event)
      }}
    />
  )
}

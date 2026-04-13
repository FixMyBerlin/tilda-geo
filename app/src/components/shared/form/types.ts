import type { FormApi as TanStackFormApi } from '@tanstack/form-core'
import type { ReactFormApi } from '@tanstack/react-form'

/** Form instance for form data T; validator/listener type params are unspecified. */
// biome-ignore lint/suspicious/noExplicitAny: TanStack Form has 11 validator generics we don't need to specify
type _ = any
export type FormApi<T> = TanStackFormApi<T, _, _, _, _, _, _, _, _, _, _, _> &
  ReactFormApi<T, _, _, _, _, _, _, _, _, _, _, _>

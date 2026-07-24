import type { ReactNode } from 'react'

export const inputBase =
  'block w-full appearance-none rounded-md border px-3 py-2 shadow-sm transition-[border-color,box-shadow] focus:outline-none sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-60'
export const inputError = 'border-red-800 shadow-red-200 focus:border-red-800 focus:ring-red-800'
export const inputNormal =
  'border-gray-300 enabled:hover:border-gray-400 enabled:hover:ring-1 enabled:hover:ring-gray-200/70 focus:border-blue-500 focus:ring-blue-500'
export const inputReadonly =
  'border-gray-400 bg-gray-200 text-gray-700 shadow-inner cursor-not-allowed focus:border-gray-400 focus:ring-0'
export const labelClass = 'mb-1 block text-sm font-semibold text-gray-700'

export const choiceOptionClassName =
  'group -mx-1.5 flex w-full cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 ring-1 ring-transparent transition-[background-color,box-shadow,color] hover:bg-gray-50/90 hover:ring-gray-200/70 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:disabled]:hover:bg-transparent has-[:disabled]:hover:ring-transparent'

export const choiceOptionListClassName = 'space-y-3'

export const choiceControlClassName = (hasError: boolean) =>
  [
    'size-4 shrink-0 transition-shadow disabled:cursor-not-allowed',
    'group-hover:ring-2 group-hover:ring-gray-300/50 group-hover:ring-offset-1',
    hasError
      ? 'border-red-800 text-red-500 focus:ring-red-800'
      : 'border-gray-300 text-blue-600 focus:ring-blue-500',
  ].join(' ')

export const choiceCheckboxClassName = (hasError: boolean) =>
  [choiceControlClassName(hasError), 'rounded'].join(' ')

export const choiceTextClassName = ({
  disabled,
  fontNormal,
}: {
  disabled?: boolean
  fontNormal?: boolean
}) =>
  [
    'text-sm transition-colors group-hover:text-gray-900',
    fontNormal ? 'font-normal' : 'font-medium',
    disabled ? 'cursor-not-allowed text-gray-500 group-hover:text-gray-500' : 'text-gray-700',
  ].join(' ')

export type FieldProps = {
  label: string
  help?: ReactNode
  optional?: boolean
  optionalSuffix?: string
  errors?: string[]
  classNameOverwrite?: string
  labelClassNameOverwrite?: string
  labelSrOnly?: boolean
}

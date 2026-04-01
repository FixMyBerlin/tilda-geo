import type { ReactNode } from 'react'

export const inputBase =
  'block w-full appearance-none rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500'
export const inputError = 'border-red-800 shadow-red-200 focus:border-red-800 focus:ring-red-800'
export const inputNormal = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
export const labelClass = 'mb-1 block text-sm font-semibold text-gray-700'

export type FieldProps = {
  label: string
  help?: ReactNode
  optional?: boolean
  errors?: string[]
  classNameOverwrite?: string
  labelClassNameOverwrite?: string
  labelSrOnly?: boolean
}

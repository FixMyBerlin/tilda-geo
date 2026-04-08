// The tailwind css typography plugin can be configure via special classes.
// Learn more at https://tailwindcss.com/docs/typography-plugin

/** Browsers often omit backgrounds in print; drop pill fill/padding so `code` stays readable as monospace only. */
const proseCodePrintClasses =
  'print:prose-code:bg-transparent print:prose-code:p-0 print:prose-code:rounded-none print:prose-code:shadow-none'

export const proseClasses = [
  'prose prose-code:before:content-none prose-code:after:content-none',
  'print:prose-sm',
  proseCodePrintClasses,
].join(' ')

/** Inline `code` inside layout `main.prose` (docs, legal, settings, …): no backticks, soft fill, normal weight. */
export const proseLayoutPagesInlineCodeClasses = [
  'print:prose-sm',
  'prose-code:before:content-none prose-code:after:content-none prose-code:rounded-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal',
  proseCodePrintClasses,
].join(' ')

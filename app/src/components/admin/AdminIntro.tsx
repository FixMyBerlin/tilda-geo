import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * Muted admin explain-text: paragraphs, links, inline `code`, and lists styled with
 * `@tailwindcss/typography` so a bulleted list reads as part of the same text block instead of a
 * separately-styled element. Bullets hang left of their text, so wrapped lines align with the
 * first one, and links keep the app's usual yellow-underline look instead of the plugin's
 * bold/underline default.
 *
 * Use via `AdminPageHeader`'s `intro` prop, or directly below it for section-level explain text.
 */
export const AdminIntro = ({ children, className }: Props) => (
  <div
    className={twMerge(
      'prose prose-sm max-w-none prose-gray',
      '[--tw-prose-body:var(--color-gray-600)] [--tw-prose-bullets:var(--color-gray-400)]',
      'prose-a:font-normal prose-a:text-inherit prose-a:underline prose-a:decoration-yellow-600 prose-a:underline-offset-4',
      'hover:prose-a:text-yellow-700 hover:prose-a:decoration-2',
      'prose-strong:font-semibold prose-strong:text-gray-700',
      'prose-code:font-normal prose-code:text-gray-700 prose-code:before:content-none prose-code:after:content-none',
      'prose-ul:my-2 prose-ul:list-outside prose-ul:space-y-1 prose-ul:pl-4 prose-li:pl-0',
      'prose-p:my-2 first:prose-p:mt-0 last:prose-p:mb-0',
      className,
    )}
  >
    {children}
  </div>
)

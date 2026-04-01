/**
 * Extra classes for `Link` with `button` in the admin header — matches breadcrumb bar (`min-h-10`).
 * Header uses `not-prose` so @tailwindcss/typography does not underline or resize these controls.
 */
export const adminHeaderActionButtonClassName = 'min-h-10 px-3'

export const HeaderWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <header className="not-prose mb-10 flex items-center justify-between gap-4">{children}</header>
  )
}

import type { SVGProps } from 'react'

/** A ruler, drawn like the Heroicons outline set (24 px grid, 1.5 stroke); the set has none. */
export const RulerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <path d="m3.2 16.4 13.2-13.2a1 1 0 0 1 1.4 0l3 3a1 1 0 0 1 0 1.4L7.6 20.8a1 1 0 0 1-1.4 0l-3-3a1 1 0 0 1 0-1.4Z" />
    <path d="m7.5 12.1 1.8 1.8M10.4 9.2l2.8 2.8M13.3 6.3l1.8 1.8" />
  </svg>
)

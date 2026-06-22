import type { SVGProps } from 'react'

export const SvgCar = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M3 14.3v-1c0-.4.1-.8.3-1.1L5 8.6a2 2 0 0 1 1.8-1.1h10.4a2 2 0 0 1 1.8 1.1l1.7 3.6c.2.3.3.7.3 1.1v1" />
    <path d="M2.5 14.3h19M6.2 11.4h11.6" />
    <circle cx="7.5" cy="16.4" r="1.8" />
    <circle cx="16.5" cy="16.4" r="1.8" />
  </svg>
)

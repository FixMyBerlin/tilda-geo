import type { SVGProps } from 'react'

export const SvgPedestrian = (props: SVGProps<SVGSVGElement>) => (
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
    <circle cx="12.5" cy="4" r="2" />
    <path d="M12.5 6 11 12.5M11 12.5 13 15.5 12.5 20M11 12.5 9.5 16.5 8.5 20M12 8l2.5 2.5M12 8 9.8 10" />
  </svg>
)

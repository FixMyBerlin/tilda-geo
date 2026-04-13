type Props = {
  color?: string
  width?: number
  size?: number
  // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray#example
  strokeDasharray?: string
} & React.SVGProps<SVGSVGElement>

export const LegendIconLine = ({
  color = 'black',
  width = 1,
  size = 14,
  strokeDasharray,
  ...props
}: Props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden={true}
    >
      <line
        x1="0%"
        y1="50%"
        x2="100%"
        y2="50%"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={strokeDasharray}
      />
    </svg>
  )
}

type Props = {
  color?: string
  borderColor?: string
  borderWidth?: number
  size?: number
} & React.SVGProps<SVGSVGElement>

export const LegendIconArea = ({
  color = 'black',
  borderColor = 'white',
  borderWidth = 1,
  size = 14,
  ...props
}: Props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden={true}
    >
      <rect
        width="100%"
        height="100%"
        fill={color}
        stroke={borderColor}
        strokeWidth={borderWidth}
      />
    </svg>
  )
}

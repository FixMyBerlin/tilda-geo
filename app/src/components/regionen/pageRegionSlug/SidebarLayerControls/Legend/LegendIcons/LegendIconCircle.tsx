type Props = {
  color?: string
  borderColor?: string
  borderWidth?: number
  size?: number
} & React.SVGProps<SVGSVGElement>

export const LegendIconCircle = ({
  color = 'black',
  borderColor = '#f8fafc',
  borderWidth = 1,
  size = 14,
  ...props
}: Props) => {
  const radius = size / 2 - borderWidth
  return (
    <div className="rounded-full" style={{ boxShadow: '0px 0px 2px 0px #00000040' }}>
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden={true}
      >
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill={color}
          stroke={borderColor}
          strokeWidth={borderWidth}
        />
      </svg>
    </div>
  )
}

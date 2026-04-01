type Props = {
  color?: string
  size?: number
} & React.SVGProps<SVGSVGElement>

export const LegendIconHeatmap = ({ color = 'black', size = 14, ...props }: Props) => {
  return (
    <div
      className="overflow-hidden rounded-full border-2 border-white"
      style={{ boxShadow: '0px 0px 2px 0px #00000040' }}
      title="Heatmap Darstellung"
    >
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden={true}
      >
        <defs>
          <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        <circle cx="15%" cy="50%" r={size / 2} fill={color} filter="url(#blur)" />
        <circle cx="80%" cy="50%" r={size / 3} fill={color} filter="url(#blur)" />
      </svg>
    </div>
  )
}

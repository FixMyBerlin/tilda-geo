type Props = {
  color?: string
} & React.HTMLAttributes<HTMLDivElement>

export const LegendIconText = ({ color = 'black', ...props }: Props) => {
  return (
    <div
      // Sized to fill the legend's icon box (14px) like the other icons; a wider box overlaps the name.
      style={{ color, fontSize: '8px', fontFamily: 'monospace', letterSpacing: '-0.5px' }}
      className="flex size-full items-center justify-center leading-none"
      {...props}
      aria-hidden={true}
    >
      abc
    </div>
  )
}

type Props = {
  color?: string
} & React.HTMLAttributes<HTMLDivElement>

export const LegendIconText = ({ color = 'black', ...props }: Props) => {
  return (
    <div
      style={{ color, fontSize: '9px', fontFamily: 'monospace', textAlign: 'center' }}
      className="flex size-5 items-center justify-center"
      {...props}
      aria-hidden={true}
    >
      abc
    </div>
  )
}

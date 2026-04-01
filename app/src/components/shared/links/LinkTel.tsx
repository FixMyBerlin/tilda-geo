import { twMerge } from 'tailwind-merge'
import { buttonStyles, linkStyles } from './styles'

type Props = {
  className?: string
  classNameOverwrite?: string
  tel?: string
  button?: boolean
  children: React.ReactNode
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

export const LinkTel = ({
  className,
  classNameOverwrite,
  tel,
  button,
  children,
  ...props
}: Props) => {
  const classNames = twMerge(className, classNameOverwrite || (button ? buttonStyles : linkStyles))

  return (
    <a href={`tel:${tel || children}`} className={classNames} {...props}>
      {children}
    </a>
  )
}

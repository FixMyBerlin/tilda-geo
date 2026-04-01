type ImgProps = React.ImgHTMLAttributes<HTMLImageElement>

export const Img = ({ src, alt = '', ...props }: ImgProps) => {
  return <img src={src} alt={alt} {...props} />
}

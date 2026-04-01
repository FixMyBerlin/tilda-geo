type Props = {
  url: string
  zoom: number | undefined
  lat: number | undefined
  lng: number | undefined
}

export const replaceZxy = ({ url, zoom, lat, lng }: Props) => {
  return url
    .replace('{z}', zoom?.toString() ?? '')
    .replace('{x}', lat?.toString() ?? '')
    .replace('{y}', lng?.toString() ?? '')
}

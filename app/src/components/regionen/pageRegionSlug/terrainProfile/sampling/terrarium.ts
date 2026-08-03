const decodeTerrariumElevation = (red: number, green: number, blue: number) =>
  red * 256 + green + blue / 256 - 32768

export const lonLatToTileSample = (lng: number, lat: number, zoom: number, tileSize: number) => {
  const latitudeRadians = (lat * Math.PI) / 180
  const scale = 2 ** zoom
  const normalizedX = ((lng + 180) / 360) * scale
  const normalizedY =
    ((1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2) *
    scale

  const tileX = Math.floor(normalizedX)
  const tileY = Math.floor(normalizedY)
  const pixelX = Math.min(tileSize - 1, Math.max(0, (normalizedX - tileX) * tileSize))
  const pixelY = Math.min(tileSize - 1, Math.max(0, (normalizedY - tileY) * tileSize))

  return { tileX, tileY, pixelX, pixelY }
}

export const sampleTerrariumPixel = (
  imageData: Uint8ClampedArray,
  tileSize: number,
  pixelX: number,
  pixelY: number,
) => {
  const x0 = Math.floor(pixelX)
  const y0 = Math.floor(pixelY)
  const x1 = Math.min(tileSize - 1, x0 + 1)
  const y1 = Math.min(tileSize - 1, y0 + 1)
  const xWeight = pixelX - x0
  const yWeight = pixelY - y0

  const readElevation = (x: number, y: number) => {
    const offset = (y * tileSize + x) * 4
    const red = imageData[offset] ?? 0
    const green = imageData[offset + 1] ?? 0
    const blue = imageData[offset + 2] ?? 0
    return decodeTerrariumElevation(red, green, blue)
  }

  const top = readElevation(x0, y0) * (1 - xWeight) + readElevation(x1, y0) * xWeight
  const bottom = readElevation(x0, y1) * (1 - xWeight) + readElevation(x1, y1) * xWeight
  return top * (1 - yWeight) + bottom * yWeight
}

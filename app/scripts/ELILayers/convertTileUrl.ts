// Convert ELI tile URLs to MapLibre-compatible format

export function convertTileUrl(
  eliUrl: string,
  eliType: string,
): { tiles: string; tileSize?: number } | null {
  if (eliType === 'tms') {
    // TMS format: convert to {z}/{x}/{y} format
    // ELI TMS URLs typically use {zoom}/{x}/{y} or similar
    let converted = eliUrl
      .replace(/\{zoom\}/g, '{z}')
      .replace(/\{z\}/g, '{z}')
      .replace(/\{x\}/g, '{x}')
      .replace(/\{y\}/g, '{y}')

    // Handle TMS Y coordinate inversion if needed
    // TMS uses inverted Y, but MapLibre expects standard Y
    // Check if URL has scheme: tms indicator
    if (eliUrl.includes('{-y}') || eliUrl.includes('{-Y}')) {
      converted = converted.replace(/\{-y\}/g, '{y}').replace(/\{-Y\}/g, '{y}')
    }

    return { tiles: converted }
  }

  if (eliType === 'wms') {
    // WMS format: convert {bbox} to {bbox-epsg-3857}
    // Also need to set width/height for proper tile size
    let converted = eliUrl
      .replace(/\{bbox\}/g, '{bbox-epsg-3857}')
      .replace(/\{proj\}/g, 'EPSG:3857')
      .replace(/\{width\}/g, '512')
      .replace(/\{height\}/g, '512')

    // Extract tile size from URL if present, default to 512
    const widthMatch = eliUrl.match(/WIDTH=(\d+)/i)
    const heightMatch = eliUrl.match(/HEIGHT=(\d+)/i)
    const tileSize =
      widthMatch?.[1] && heightMatch?.[1]
        ? Math.max(parseInt(widthMatch[1]), parseInt(heightMatch[1]))
        : 512

    return { tiles: converted, tileSize }
  }

  // Unsupported format
  return null
}

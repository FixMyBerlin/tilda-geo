import type { Rgba } from './types'

const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)))

export const hexToRgba = (hex: string, alpha = 1): Rgba => {
  const normalized = hex.replace('#', '')
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return [r, g, b, alpha]
}

export const parseColorToRgba = (color: string, extraOpacity = 1): Rgba => {
  if (color.startsWith('#')) {
    return hexToRgba(color, extraOpacity)
  }

  const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)
  if (rgbMatch) {
    return [
      clampByte(Number(rgbMatch[1])),
      clampByte(Number(rgbMatch[2])),
      clampByte(Number(rgbMatch[3])),
      extraOpacity,
    ]
  }

  const rgbaMatch = color.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/)
  if (rgbaMatch) {
    return [
      clampByte(Number(rgbaMatch[1])),
      clampByte(Number(rgbaMatch[2])),
      clampByte(Number(rgbaMatch[3])),
      Number(rgbaMatch[4]) * extraOpacity,
    ]
  }

  throw new Error(`Unsupported color format: ${color}`)
}

export const withAlpha = (rgba: Rgba, alpha: number): Rgba => [rgba[0], rgba[1], rgba[2], alpha]

export const multiplyAlpha = (rgba: Rgba, factor: number): Rgba => withAlpha(rgba, rgba[3] * factor)

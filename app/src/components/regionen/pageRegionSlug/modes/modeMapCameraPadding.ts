export const MODE_MAP_CAMERA_EDGE_INSET_PX = 16
export const MODE_MAP_CAMERA_MIN_VISIBLE_PX = 80

export type ModeMapCameraPadding = {
  top: number
  right: number
  bottom: number
  left: number
}

type MapCanvas = { offsetWidth: number; offsetHeight: number }
type MapWithCanvas = { getCanvas: () => MapCanvas }

const rootFontSizePx = () => {
  if (typeof document === 'undefined') return 16
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
}

export const parseCssLengthToPx = (
  value: string,
  viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight,
  fontSizePx = rootFontSizePx(),
) => {
  const trimmed = value.trim()
  if (!trimmed) return 0
  const num = Number.parseFloat(trimmed)
  if (!Number.isFinite(num)) return 0
  if (trimmed.endsWith('rem')) return num * fontSizePx
  if (trimmed.endsWith('dvh') || trimmed.endsWith('vh')) return (num / 100) * viewportHeight
  if (trimmed.endsWith('dvw') || trimmed.endsWith('vw')) {
    const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth
    return (num / 100) * viewportWidth
  }
  return num
}

export const clampModeMapCameraPadding = (
  padding: ModeMapCameraPadding,
  canvas: { width: number; height: number },
) => {
  const maxTop = Math.max(0, canvas.height - MODE_MAP_CAMERA_MIN_VISIBLE_PX)
  const maxLeft = Math.max(0, canvas.width - MODE_MAP_CAMERA_MIN_VISIBLE_PX)
  const top = Math.min(padding.top, maxTop)
  const left = Math.min(padding.left, maxLeft)
  return {
    top,
    left,
    bottom: Math.min(
      padding.bottom,
      Math.max(0, canvas.height - top - MODE_MAP_CAMERA_MIN_VISIBLE_PX),
    ),
    right: Math.min(
      padding.right,
      Math.max(0, canvas.width - left - MODE_MAP_CAMERA_MIN_VISIBLE_PX),
    ),
  } satisfies ModeMapCameraPadding
}

const canvasSize = (map?: MapWithCanvas) => {
  const canvas = map?.getCanvas()
  return {
    width: canvas?.offsetWidth || (typeof window === 'undefined' ? 0 : window.innerWidth),
    height: canvas?.offsetHeight || (typeof window === 'undefined' ? 0 : window.innerHeight),
  }
}

const ZERO_MODE_MAP_CAMERA_PADDING = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} satisfies ModeMapCameraPadding

type MapWithPadding = MapWithCanvas & {
  easeTo: (options: { padding: ModeMapCameraPadding; duration: number }) => void
}

/** Camera padding so flyTo/fitBounds center in the map still visible beside the mobile dock. */
export const getModeMapCameraPadding = (map?: MapWithCanvas, extraInsetPx = 0) => {
  const canvas = canvasSize(map)
  const dockPx =
    typeof document === 'undefined'
      ? 0
      : parseCssLengthToPx(
          getComputedStyle(document.documentElement).getPropertyValue('--mode-mobile-dock-height'),
          canvas.height,
        )
  const edge = MODE_MAP_CAMERA_EDGE_INSET_PX + extraInsetPx
  return clampModeMapCameraPadding(
    {
      top: edge,
      right: edge,
      left: edge,
      bottom: dockPx > 0 ? dockPx + edge : edge,
    },
    canvas,
  )
}

export const applyModeMapCameraPadding = (map?: MapWithPadding | null) => {
  if (!map) return
  map.easeTo({ padding: getModeMapCameraPadding(map), duration: 0 })
}

export const resetModeMapCameraPadding = (map?: MapWithPadding | null) => {
  if (!map) return
  map.easeTo({ padding: ZERO_MODE_MAP_CAMERA_PADDING, duration: 0 })
}

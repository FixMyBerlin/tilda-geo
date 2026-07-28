export const INSPECTOR_WIDTH_STORAGE_KEY = 'tilda-inspector-width'

export const INSPECTOR_WIDTH_DEFAULT = 560
export const INSPECTOR_WIDTH_MIN = 320
export const INSPECTOR_WIDTH_MAX = 800

export const clampInspectorWidth = (width: number) =>
  Math.min(INSPECTOR_WIDTH_MAX, Math.max(INSPECTOR_WIDTH_MIN, width))

export const readInspectorWidth = () => {
  const raw = localStorage.getItem(INSPECTOR_WIDTH_STORAGE_KEY)
  if (!raw) return INSPECTOR_WIDTH_DEFAULT

  const width = Number(raw)
  if (!Number.isFinite(width)) return INSPECTOR_WIDTH_DEFAULT

  return clampInspectorWidth(width)
}

export const writeInspectorWidth = (width: number) => {
  localStorage.setItem(INSPECTOR_WIDTH_STORAGE_KEY, String(clampInspectorWidth(width)))
}

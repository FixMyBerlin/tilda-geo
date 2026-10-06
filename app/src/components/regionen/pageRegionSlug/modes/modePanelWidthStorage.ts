import { z } from 'zod'

export const MODE_PANEL_WIDTH_STORAGE_KEY = 'tilda-mode-panel-width'

/** Initial / first-visit mode sidebar width (resizable; persisted in localStorage). */
export const MODE_PANEL_WIDTH_DEFAULT = 425
export const MODE_PANEL_WIDTH_MIN = 320
export const MODE_PANEL_WIDTH_MAX_ABS = 1200
/** Minimum map area to preserve when widening the mode panel (desktop). */
export const MAP_REMAINING_MIN = 360

const viewportWidthOrDefault = (viewportWidth?: number) =>
  viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : MODE_PANEL_WIDTH_MAX_ABS)

export const maxModePanelWidthForViewport = (viewportWidth?: number) => {
  const vw = viewportWidthOrDefault(viewportWidth)
  return Math.min(MODE_PANEL_WIDTH_MAX_ABS, vw - MAP_REMAINING_MIN)
}

export const clampModePanelWidth = (width: number, viewportWidth?: number) => {
  const ceiling = maxModePanelWidthForViewport(viewportWidth)
  return Math.min(ceiling, Math.max(MODE_PANEL_WIDTH_MIN, width))
}

export const readModePanelWidth = () => {
  const raw = localStorage.getItem(MODE_PANEL_WIDTH_STORAGE_KEY)
  if (!raw) return MODE_PANEL_WIDTH_DEFAULT

  const parsed = z.coerce.number().finite().safeParse(raw)
  if (!parsed.success) return MODE_PANEL_WIDTH_DEFAULT

  return clampModePanelWidth(parsed.data)
}

export const writeModePanelWidth = (width: number) => {
  localStorage.setItem(MODE_PANEL_WIDTH_STORAGE_KEY, String(clampModePanelWidth(width)))
}

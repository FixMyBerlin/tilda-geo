type Point = { x: number; y: number }

/** Short-lived screen-center of the button that opened a modal. Cleared after exit. */
let origin: Point | null = null

export function captureModalOpenOrigin(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

function peekModalOpenOrigin() {
  return origin
}

export function clearModalOpenOrigin() {
  origin = null
}

/** Soft enter/exit offset toward the captured button, or a generic fallback. */
export function getModalOpenOriginOffset() {
  const point = peekModalOpenOrigin()
  if (!point) return { x: 0, y: 16 }
  return {
    x: (point.x - window.innerWidth / 2) * 0.25,
    y: (point.y - window.innerHeight / 2) * 0.25,
  }
}

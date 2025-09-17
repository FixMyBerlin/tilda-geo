export const layerVisibility = (visibile: boolean) => {
  return { visibility: visibile ? ('visible' as const) : ('none' as const) }
}

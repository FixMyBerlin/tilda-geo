/** MapLibre NavigationControl needle transform (`visualizePitch` + default `visualizeRoll`). */
export const compassNeedleTransform = (bearing: number, pitch: number, roll: number) => {
  const pitchScale = 1 / Math.pow(Math.cos((pitch * Math.PI) / 180), 0.5)
  return `scale(${pitchScale}) rotateZ(${-roll}deg) rotateX(${pitch}deg) rotateZ(${-bearing}deg)`
}

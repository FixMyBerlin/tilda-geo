import type { Map as MapLibreMap } from 'maplibre-gl'
import { TerraDraw } from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import { PLANNING_TERRA_MODE, createPlanningTerraDrawModes } from './planningTerraDrawConfig'

type Handlers = {
  /** Called with the single drawn study-area geometry, or null when cleared. */
  onGeometryChange: (geometry: GeoJSON.Polygon | null) => void
  /**
   * Called with `true` while the user is actively placing polygon points (polygon mode)
   * and `false` once the polygon is finished (select/edit mode). Lets the map suppress
   * data-layer clicks only during the point-placing phase.
   */
  onDrawingStateChange: (isDrawing: boolean) => void
}

type PlanningMapDrawingControlOptions = {
  getHandlers: () => Handlers
  onReady?: (control: PlanningMapDrawingControl) => void
}

/**
 * Lean TerraDraw control for defining a single study-area polygon.
 *
 * Mirrors the proven lifecycle of the Calculator's drawing control
 * (`CalculatorMapDrawingControl`) — retry-init on multiple readiness events and re-init after a
 * style swap — but is restricted to exactly one polygon: each (re)activation starts a fresh draw,
 * and finishing the polygon switches to select mode so vertices stay editable.
 */
export class PlanningMapDrawingControl {
  private map: MapLibreMap | null = null
  private draw: TerraDraw | null = null
  private isInitialized = false
  private restorePending = false
  private styleLoadHandler = () => this.reinitAfterStyleChange()
  private initHandler = () => this.tryInitialize()
  private readonly options: PlanningMapDrawingControlOptions

  constructor(options: PlanningMapDrawingControlOptions) {
    this.options = options
  }

  onAdd(map: MapLibreMap) {
    this.map = map
    this.draw = this.createDrawInstance(map)
    map.on('style.load', this.styleLoadHandler)
    // Remounts can happen after the one-time "load" event fired; retry init on multiple events.
    map.on('load', this.initHandler)
    map.on('idle', this.initHandler)
    map.on('styledata', this.initHandler)
    this.tryInitialize()

    return document.createElement('div')
  }

  onRemove(map: MapLibreMap) {
    map.off('style.load', this.styleLoadHandler)
    map.off('load', this.initHandler)
    map.off('idle', this.initHandler)
    map.off('styledata', this.initHandler)
    this.map = null
    if (this.draw) {
      this.draw.stop()
      this.draw = null
    }
    this.isInitialized = false
  }

  getReady() {
    return this.isInitialized && this.draw !== null
  }

  private tryInitialize() {
    if (this.isInitialized || !this.draw || !this.map) return
    if (!this.map.isStyleLoaded() && !this.map.loaded()) return

    this.draw.start()
    this.isInitialized = true
    this.attachListeners()
    // Fresh draw on each activation → drawing again replaces any previous study area.
    this.draw.setMode(PLANNING_TERRA_MODE.polygon)
    this.options.getHandlers().onDrawingStateChange(true)
    this.map.off('load', this.initHandler)
    this.map.off('idle', this.initHandler)
    this.map.off('styledata', this.initHandler)
    this.options.onReady?.(this)
  }

  private createDrawInstance(map: MapLibreMap) {
    return new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: createPlanningTerraDrawModes(),
    })
  }

  private currentGeometry(): GeoJSON.Polygon | null {
    if (!this.draw) return null
    const feature = this.draw.getSnapshot().find((f) => f.geometry.type === 'Polygon')
    return (feature?.geometry as GeoJSON.Polygon | undefined) ?? null
  }

  private attachListeners() {
    if (!this.draw) return

    // A polygon was completed → keep only it and switch to select mode for vertex editing.
    this.draw.on('finish', (id) => {
      if (!this.draw) return
      const others = this.draw
        .getSnapshot()
        .map((f) => f.id)
        .filter((fid): fid is string | number => fid !== undefined && fid !== id)
      if (others.length > 0) this.draw.removeFeatures(others)
      this.draw.setMode(PLANNING_TERRA_MODE.select)
      this.options.getHandlers().onDrawingStateChange(false)
      this.options.getHandlers().onGeometryChange(this.currentGeometry())
    })

    // Vertex drags / deletions in select mode.
    this.draw.on('change', () => {
      this.options.getHandlers().onGeometryChange(this.currentGeometry())
    })
  }

  private reinitAfterStyleChange() {
    if (!this.draw || !this.isInitialized || !this.map) return
    if (this.restorePending) return
    this.restorePending = true

    const snapshot = this.draw.getSnapshot().slice()
    const mode = this.draw.getMode()

    // Style was replaced; do not call stop() — TerraDraw layers are already gone.
    this.draw = this.createDrawInstance(this.map)
    this.draw.start()
    this.attachListeners()
    if (snapshot.length > 0) this.draw.addFeatures(snapshot)
    this.draw.setMode(mode)
    this.options.getHandlers().onDrawingStateChange(mode === PLANNING_TERRA_MODE.polygon)
    this.restorePending = false
  }
}

import type { Map as MapLibreMap } from 'maplibre-gl'
import { TerraDraw } from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import {
  combinePartsIntoGeometry,
  reviewEditGeometryChanged,
  reviewGeometryFamilyForType,
  type ReviewGeometryFamily,
} from './reviewGeometryParts'
import {
  createReviewTerraDrawModes,
  REVIEW_DRAW_MODE,
  reviewDrawModeForFamily,
  type ReviewDrawMode,
} from './reviewTerraDrawConfig'

type Options = {
  /** Called with a finished geometry; the entry is then persisted. */
  getOnGeometryFinish: () => (geometry: GeoJSON.Geometry) => void
  /**
   * True during compose (create) sessions. Gates deselect persistence: create sessions skip
   * persist-on-deselect; edit sessions persist on deselect only when the geometry changed.
   */
  getIsCreateSession: () => boolean
  getOnSelectionChange: () => () => void
}

/**
 * Lean TerraDraw control for the review lists mode. A finished geometry is persisted to the DB
 * immediately; the draw feature is kept until the compose/edit session ends (success clears via
 * setEnabled(false) → clearFeatures). Handles map style reloads.
 */
export class ReviewMapDrawingControl {
  private map: MapLibreMap | null = null
  private draw: TerraDraw | null = null
  private isInitialized = false
  private enabled = false
  private pendingMode: ReviewDrawMode | null = null
  private isMutatingStore = false
  private editFamily: ReviewGeometryFamily | null = null
  private loadedGeometry: GeoJSON.Geometry | null = null
  private selectedIds: Array<string | number> = []
  private readonly options: Options
  private readonly initHandler = () => this.tryInitialize()
  private readonly styleLoadHandler = () => this.reinitAfterStyleChange()

  constructor(options: Options) {
    this.options = options
  }

  onAdd(map: MapLibreMap) {
    this.map = map
    this.draw = this.createDrawInstance(map)
    map.on('style.load', this.styleLoadHandler)
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
    this.pendingMode = null
    this.editFamily = null
    this.loadedGeometry = null
    this.selectedIds = []
  }

  getReady() {
    return this.isInitialized && this.draw !== null
  }

  setMode(mode: ReviewDrawMode) {
    this.pendingMode = mode
    if (!this.draw || !this.isInitialized || !this.enabled) return
    this.draw.setMode(mode)
  }

  /** Replace the store with one terra-draw feature per part, then select the first. */
  loadEditFeature(parts: GeoJSON.Geometry[], family: ReviewGeometryFamily) {
    const draw = this.draw
    const mode = reviewDrawModeForFamily(family)
    if (!draw || !this.isInitialized || !this.enabled || parts.length === 0) return false
    this.editFamily = family
    this.isMutatingStore = true
    try {
      draw.clear()
      this.selectedIds = []
      const features = parts.map((geometry) => ({
        id: draw.getFeatureId(),
        type: 'Feature' as const,
        geometry,
        properties: { mode, reviewEdit: true },
      }))
      draw.addFeatures(features)
      draw.setMode(REVIEW_DRAW_MODE.select)
      const firstId = features[0]?.id
      if (firstId !== undefined) {
        draw.selectFeature(firstId)
        this.selectedIds = [firstId]
      }
    } finally {
      this.isMutatingStore = false
    }
    this.loadedGeometry = combinePartsIntoGeometry(family, this.snapshotPartGeometries())
    this.notifySelectionChange()
    return true
  }

  clearFeatures() {
    if (!this.draw || !this.isInitialized || !this.enabled) return
    this.isMutatingStore = true
    try {
      this.draw.clear()
      this.selectedIds = []
    } finally {
      this.isMutatingStore = false
    }
  }

  getSelectedIds() {
    return this.selectedIds.slice()
  }

  getPartCount() {
    if (!this.editFamily) return 0
    return this.snapshotPartGeometries().filter(
      (geometry) => reviewGeometryFamilyForType(geometry.type) === this.editFamily,
    ).length
  }

  /** Remove selected part ids; refuse when that would leave zero parts. */
  deleteSelectedPart() {
    if (!this.draw || !this.isInitialized || !this.enabled) return
    if (this.selectedIds.length === 0) return
    if (this.getPartCount() - this.selectedIds.length < 1) return
    this.isMutatingStore = true
    try {
      this.draw.removeFeatures(this.selectedIds)
      this.selectedIds = []
    } finally {
      this.isMutatingStore = false
    }
    this.persistEditSnapshot()
    this.notifySelectionChange()
  }

  /** TerraDraw intercepts map clicks; only enable during compose or entry-detail edit. */
  setEnabled(enabled: boolean) {
    if (!this.draw || !this.isInitialized) {
      this.enabled = enabled
      return
    }
    if (enabled) {
      this.enabled = true
      this.draw.start()
      // Caller must setMode (session start) first so pendingMode is compose-point or edit-select.
      // TerraDraw's default after start() is `static` (clicks do nothing), not point.
      this.draw.setMode(this.pendingMode ?? REVIEW_DRAW_MODE.point)
      return
    }
    if (this.enabled) {
      this.clearFeatures()
      this.draw.stop()
    }
    this.enabled = false
    this.editFamily = null
    this.loadedGeometry = null
    this.selectedIds = []
  }

  private tryInitialize() {
    if (this.isInitialized || !this.draw || !this.map) return
    if (!this.map.isStyleLoaded() && !this.map.loaded()) return

    this.draw.start()
    this.isInitialized = true
    this.attachListeners()
    if (this.enabled) {
      this.draw.setMode(this.pendingMode ?? REVIEW_DRAW_MODE.point)
    } else {
      this.draw.stop()
    }
    this.pendingMode = null
    this.map.off('load', this.initHandler)
    this.map.off('idle', this.initHandler)
    this.map.off('styledata', this.initHandler)
  }

  private createDrawInstance(map: MapLibreMap) {
    return new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: createReviewTerraDrawModes(),
    })
  }

  private snapshotPartGeometries() {
    if (!this.draw) return []
    return this.draw
      .getSnapshot()
      .filter((feature) => !feature.properties?.currentlyDrawing)
      .map((feature) => feature.geometry as GeoJSON.Geometry)
  }

  private persistSnapshotGeometry(id?: string | number) {
    if (!this.draw || this.isMutatingStore) return
    if (this.options.getIsCreateSession()) {
      const feature =
        id === undefined ? this.draw.getSnapshot()[0] : this.draw.getSnapshotFeature(id)
      if (!feature) return
      this.options.getOnGeometryFinish()(feature.geometry as GeoJSON.Geometry)
      return
    }
    this.persistEditSnapshot()
  }

  private persistEditSnapshot() {
    if (!this.draw || this.isMutatingStore || !this.editFamily) return
    const combined = combinePartsIntoGeometry(this.editFamily, this.snapshotPartGeometries())
    if (!combined) return
    if (!reviewEditGeometryChanged(this.loadedGeometry, combined)) return
    this.loadedGeometry = combined
    this.options.getOnGeometryFinish()(combined)
  }

  private notifySelectionChange() {
    this.options.getOnSelectionChange()()
  }

  private attachListeners() {
    if (!this.draw) return
    this.draw.on('finish', (id) => {
      if (!this.draw) return
      // Keep the drawn feature until save succeeds; cleanup runs when the compose session ends.
      this.persistSnapshotGeometry(id)
      this.notifySelectionChange()
    })
    this.draw.on('select', (id) => {
      if (!this.selectedIds.includes(id)) {
        this.selectedIds = [...this.selectedIds, id]
      }
      this.notifySelectionChange()
    })
    this.draw.on('deselect', (id) => {
      this.selectedIds = this.selectedIds.filter((selectedId) => selectedId !== id)
      this.notifySelectionChange()
      if (this.options.getIsCreateSession()) return
      this.persistSnapshotGeometry()
    })
  }

  private reinitAfterStyleChange() {
    if (!this.draw || !this.isInitialized || !this.map) return
    const mode = this.enabled ? this.draw.getMode() : (this.pendingMode ?? REVIEW_DRAW_MODE.point)
    // Style was replaced so TerraDraw layers are gone. Recreate without stop().
    this.draw = this.createDrawInstance(this.map)
    this.draw.start()
    this.attachListeners()
    if (this.enabled) {
      this.draw.setMode(mode)
      return
    }
    this.draw.stop()
  }
}

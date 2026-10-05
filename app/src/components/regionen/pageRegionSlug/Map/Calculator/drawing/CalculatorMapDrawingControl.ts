import type { Map as MapLibreMap } from 'maplibre-gl'
import { TerraDraw } from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import { jurlStringify } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v1/jurlParseStringify'
import { simplifyPositions } from '../utils/simplifyPositions'
import { CALCULATOR_TERRA_MODE, createCalculatorTerraDrawModes } from './calculatorTerraDrawConfig'
import type { CalculatorUrlDrawMode } from './calculatorUrlDrawMode'
import type { DrawArea } from './drawAreaTypes'
import { drawAreasToStoreFeatures, snapshotToDrawAreas } from './mapDrawingGeometry'

type Handlers = {
  /** Every change to the finished areas, including each step of a drag. */
  onUserGeometryChange: (areas: DrawArea[]) => void
  /** The areas once the user's edit has settled; this is what belongs in the URL. */
  onUserGeometryCommit: (areas: DrawArea[]) => void
  /** The control changed the mode on its own (after a polygon was closed). */
  onDrawModeChange: (mode: CalculatorUrlDrawMode) => void
}

// Edits without a TerraDraw `finish` event (midpoint insert, delete) commit after this pause.
const COMMIT_SETTLE_MS = 250

type CalculatorMapDrawingControlOptions = {
  getHandlers: () => Handlers
  setLastSyncedDrawSerialized: (serialized: string) => void
  onReady?: (control: CalculatorMapDrawingControl) => void
}

export class CalculatorMapDrawingControl {
  private map: MapLibreMap | null = null
  private draw: TerraDraw | null = null
  private isInitialized = false
  private isApplyingExternalState = false
  private pendingDrawMode: CalculatorUrlDrawMode | null = 'polygon'
  private selectedFeatureIds: (string | number)[] = []
  private restorePending = false
  private lastEmittedSerialized = ''
  private uncommittedAreas: DrawArea[] | null = null
  private commitTimer: ReturnType<typeof setTimeout> | null = null
  private styleLoadHandler = () => this.reinitAfterStyleChange()
  private initHandler = () => this.tryInitialize()
  private readonly options: CalculatorMapDrawingControlOptions

  constructor(options: CalculatorMapDrawingControlOptions) {
    this.options = options
  }

  onAdd(map: MapLibreMap) {
    this.map = map
    this.draw = this.createDrawInstance(map)
    map.on('style.load', this.styleLoadHandler)
    // Remounts can happen after the one-time "load" event fired; retry init on multiple readiness events.
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
    this.flushCommit()
    this.map = null
    if (this.draw) {
      this.draw.stop()
      this.draw = null
    }
    this.isInitialized = false
    this.selectedFeatureIds = []
    this.pendingDrawMode = null
  }

  private tryInitialize() {
    if (this.isInitialized || !this.draw || !this.map) return
    if (!this.map.isStyleLoaded() && !this.map.loaded()) return

    this.draw.start()
    this.isInitialized = true
    this.attachListeners()
    if (this.pendingDrawMode) {
      this.applyDrawMode(this.pendingDrawMode)
      this.pendingDrawMode = null
    }
    this.map.off('load', this.initHandler)
    this.map.off('idle', this.initHandler)
    this.map.off('styledata', this.initHandler)
    this.options.onReady?.(this)
  }

  getReady() {
    return this.isInitialized && this.draw !== null
  }

  replaceFromUrl(drawAreas: DrawArea[]) {
    if (!this.draw || !this.isInitialized) return
    this.cancelCommit()
    this.isApplyingExternalState = true
    try {
      this.draw.clear()
      if (drawAreas.length > 0) {
        this.draw.addFeatures(drawAreasToStoreFeatures(drawAreas))
      }
    } finally {
      this.isApplyingExternalState = false
    }
    this.lastEmittedSerialized = jurlStringify(this.readFinishedAreas())
  }

  setDrawMode(mode: CalculatorUrlDrawMode) {
    if (!this.draw || !this.isInitialized) {
      this.pendingDrawMode = mode
      return mode
    }
    if (mode === 'edit' && this.draw.getSnapshot().length === 0) {
      this.applyDrawMode('polygon')
      return 'polygon'
    }
    this.applyDrawMode(mode)
    return mode
  }

  deleteSelectionOrAll() {
    if (!this.draw || !this.isInitialized) return
    if (this.selectedFeatureIds.length > 0) {
      this.draw.removeFeatures(this.selectedFeatureIds)
      this.selectedFeatureIds = []
    } else {
      this.draw.clear()
    }
  }

  private createDrawInstance(map: MapLibreMap) {
    return new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: createCalculatorTerraDrawModes(),
    })
  }

  private applyDrawMode(mode: CalculatorUrlDrawMode) {
    if (!this.draw) return
    const terraMode =
      mode === 'polygon' ? CALCULATOR_TERRA_MODE.polygon : CALCULATOR_TERRA_MODE.select
    this.draw.setMode(terraMode)
  }

  private attachListeners() {
    if (!this.draw) return

    this.draw.on('select', (id) => {
      if (!this.selectedFeatureIds.includes(id)) {
        this.selectedFeatureIds = [...this.selectedFeatureIds, id]
      }
    })

    this.draw.on('deselect', (id) => {
      this.selectedFeatureIds = this.selectedFeatureIds.filter((x) => x !== id)
    })

    this.draw.on('change', () => {
      if (!this.draw) return
      if (this.isApplyingExternalState) return

      // TerraDraw fires `change` on every pointer move while a polygon is being drawn. The
      // finished areas stay the same during that time, so this returns early.
      const areas = this.readFinishedAreas()
      const serialized = jurlStringify(areas)
      if (serialized === this.lastEmittedSerialized) return
      this.lastEmittedSerialized = serialized

      this.options.getHandlers().onUserGeometryChange(areas)
      this.scheduleCommit(areas)
    })

    // Closing a polygon and releasing a drag are settled edits; commit them right away.
    this.draw.on('finish', (_id, context) => {
      this.flushCommit()
      // A closed polygon is usually adjusted next, so continue in edit mode.
      // Deferred: TerraDraw is still finishing the polygon while this event fires.
      if (context.action === 'draw') {
        queueMicrotask(() => {
          if (!this.draw) return
          this.applyDrawMode('edit')
          this.options.getHandlers().onDrawModeChange('edit')
        })
      }
    })
  }

  private readFinishedAreas() {
    if (!this.draw) return []
    return simplifyPositions(snapshotToDrawAreas(this.draw.getSnapshot()))
  }

  private scheduleCommit(areas: DrawArea[]) {
    this.uncommittedAreas = areas
    if (this.commitTimer) clearTimeout(this.commitTimer)
    this.commitTimer = setTimeout(() => this.flushCommit(), COMMIT_SETTLE_MS)
  }

  private cancelCommit() {
    if (this.commitTimer) clearTimeout(this.commitTimer)
    this.commitTimer = null
    this.uncommittedAreas = null
  }

  private flushCommit() {
    const areas = this.uncommittedAreas
    this.cancelCommit()
    if (!areas) return
    // Record what goes to the URL before it arrives back as props, so the echo is not
    // mistaken for an external change that has to replace the TerraDraw store.
    this.options.setLastSyncedDrawSerialized(jurlStringify(areas))
    this.options.getHandlers().onUserGeometryCommit(areas)
  }

  private reinitAfterStyleChange() {
    if (!this.draw || !this.isInitialized || !this.map) return
    if (this.restorePending) return
    this.restorePending = true

    // Only finished areas survive: helper points and a half-drawn polygon belong to mode state
    // that the new instance does not have.
    const snapshot = drawAreasToStoreFeatures(snapshotToDrawAreas(this.draw.getSnapshot()))
    const mode = this.draw.getMode()

    // Style was replaced; do not call stop() — TerraDraw layers are already gone (see terra-draw-maplibre adapter).
    this.draw = null

    this.draw = this.createDrawInstance(this.map)
    this.draw.start()
    this.attachListeners()
    this.isApplyingExternalState = true
    try {
      if (snapshot.length > 0) {
        this.draw.addFeatures(snapshot)
      }
    } finally {
      this.isApplyingExternalState = false
    }

    this.selectedFeatureIds = []
    this.draw.setMode(mode)
    this.restorePending = false
  }
}

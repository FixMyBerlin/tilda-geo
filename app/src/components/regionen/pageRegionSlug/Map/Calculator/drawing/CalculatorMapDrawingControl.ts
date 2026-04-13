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
  onUserGeometryChange: (areas: DrawArea[]) => void
}

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
    this.isApplyingExternalState = true
    try {
      this.draw.clear()
      if (drawAreas.length > 0) {
        this.draw.addFeatures(drawAreasToStoreFeatures(drawAreas))
      }
    } finally {
      this.isApplyingExternalState = false
    }
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

  removeByCalculatorId(id: string) {
    if (!this.draw || !this.isInitialized) return
    const snap = this.draw.getSnapshot()
    const target = snap.find(
      (f) =>
        String(f.id) === id ||
        (typeof f.properties?.tildaCalcId === 'string' && f.properties.tildaCalcId === id),
    )
    if (!target || target.id === undefined) return
    this.draw.removeFeatures([target.id])
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

      const areas = snapshotToDrawAreas(this.draw.getSnapshot())
      const simplified = simplifyPositions(areas)
      const serialized = jurlStringify(simplified)
      this.options.setLastSyncedDrawSerialized(serialized)
      this.options.getHandlers().onUserGeometryChange(simplified)
    })
  }

  private reinitAfterStyleChange() {
    if (!this.draw || !this.isInitialized || !this.map) return
    if (this.restorePending) return
    this.restorePending = true

    const snapshot = this.draw.getSnapshot().slice()
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

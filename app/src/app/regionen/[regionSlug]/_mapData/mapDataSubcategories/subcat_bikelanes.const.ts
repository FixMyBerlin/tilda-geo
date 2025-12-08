import { FileMapDataSubcategory, FileMapDataSubcategoryStyle } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_atlas_bikelanes_default } from './mapboxStyles/groups/atlas_bikelanes_default'
import { mapboxStyleGroupLayers_atlas_bikelanes_details } from './mapboxStyles/groups/atlas_bikelanes_details'
import { mapboxStyleGroupLayers_atlas_bikelanes_widths } from './mapboxStyles/groups/atlas_bikelanes_widths'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'
import { bikelanesWidthLegend } from './subcat_radinfra_width.const'

const subcatId = 'bikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatBikelanesId = typeof subcatId
export type SubcatBikelanesStyleIds =
  | 'default'
  | 'details'
  | 'width'
  | 'completeness'
  | 'freshness'
  | 'bikelane_oneway_arrows'

export const bikelanesDefaultStyle: FileMapDataSubcategoryStyle = {
  id: 'default',
  name: 'Führungsform einfach',
  layers: mapboxStyleLayers({
    layers: mapboxStyleGroupLayers_atlas_bikelanes_default,
    source,
    sourceLayer,
  }),
  legends: [
    {
      id: 'separated',
      name: 'Führung baul. abgesetzt von Kfz',
      style: {
        type: 'line',
        color: '#174ed9',
      },
    },
    {
      id: 'lane',
      name: 'Führung eigenständig auf Fahrbahn',
      style: {
        type: 'line',
        color: '#0098f0',
      },
    },
    {
      id: 'foot',
      name: 'Führung mit Fußverkehr',
      style: {
        type: 'line',
        color: '#174ed9',
        dasharray: [2.5, 1],
      },
    },
    {
      id: 'sidewalk',
      name: 'Fußverkehr mit Rad frei',
      style: {
        type: 'line',
        color: '#9fb9f9',
        dasharray: [2.5, 1],
      },
    },
    {
      id: 'mixed',
      name: 'Führung mit Kfz (explizit)',
      desc: [
        'Anteilig genutzten Fahrstreifen',
        'Fahrradstraße mit Anlieger/Kfz frei',
        'Bussonderfahrstreifen mit Fahrrad frei',
        'Radfahrstreifen mit Freigabe Busverkehr',
      ],
      style: {
        type: 'line',
        color: '#0098f0',
        dasharray: [2.5, 1],
      },
    },
    {
      id: 'needsClarification',
      name: 'Führungsform unklar',
      style: {
        type: 'line',
        color: '#a97bea',
        dasharray: [2.5, 1],
      },
    },
  ],
}

export const bikelanesDetailsStyle: FileMapDataSubcategoryStyle = {
  id: 'details',
  name: 'Führungsform details',
  layers: mapboxStyleLayers({
    layers: mapboxStyleGroupLayers_atlas_bikelanes_details,
    source,
    sourceLayer,
  }),
  legends: [
    {
      id: 'footAndCyclewaySegregated',
      name: 'Getrennter Rad- und Gehweg ',
      style: {
        type: 'line',
        color: '#818cf8',
      },
    },
    {
      id: 'cycleway',
      name: 'Getrennter Radweg',
      style: {
        type: 'line',
        color: '#174ed9',
      },
    },
    {
      id: 'cyclewayOnHighwayProtected',
      name: 'Geschuetzter Radfahrstreifen',
      style: {
        type: 'line',
        color: '#7a0ff5',
      },
    },
    {
      id: 'cyclewayOnHighway_exclusive',
      name: 'Radfahrstreifen',
      style: {
        type: 'line',
        color: '#2dd4bf',
      },
    },
    {
      id: 'cyclewayOnHighway',
      name: 'Schutzstreifen',
      style: {
        type: 'line',
        color: '#2dd4bf',
        dasharray: [1, 2.5],
      },
    },
    {
      id: 'crossing',
      name: 'Markierung Kreuzungsbereich',
      style: {
        type: 'line',
        color: '#748b82',
      },
    },
    {
      id: 'footAndCyclewayShared',
      name: 'Gemeinsamer Geh- & Radweg',
      style: {
        type: 'line',
        color: '#e949ac',
      },
    },
    {
      id: 'footwayBicycleYes',
      name: 'Gehweg mit Rad frei',
      style: {
        type: 'line',
        color: '#f08ed5',
        dasharray: [2.5, 1],
      },
    },
    {
      id: 'bicycleRoad',
      name: 'Fahrradstraße (keine Kfz)',
      style: {
        type: 'line',
        color: '#fb923c',
      },
    },
    {
      id: 'bicycleRoad_vehicleDestination',
      name: 'Fahrradstraße (Mischverkehr)',
      style: {
        type: 'line',
        color: '#fb923c',
        dasharray: [2.5, 1],
      },
    },
    {
      id: 'sharedBusLane',
      name: 'Gem. Fahrstreifen mit Bus',
      desc: ['Bussonderfahrstreifen mit Fahrrad frei', 'Radfahrstreifen mit Freigabe Busverkehr'],
      style: {
        type: 'line',
        color: '#059669',
      },
    },
    {
      id: 'sharedMotorVehicleLane',
      name: 'Gem. Fahrstreifen mit Kfz (Markiert)',
      style: {
        type: 'line',
        color: '#059669',
        dasharray: [2.5, 1],
      },
    },
    {
      id: 'needsClarification',
      name: 'Führungsform unklar',
      style: {
        type: 'line',
        color: '#b50382',
        dasharray: [2.5, 1],
      },
    },
  ],
}

export const bikelanesWidthStyle: FileMapDataSubcategoryStyle = {
  id: 'width',
  name: 'Breite RVA',
  layers: mapboxStyleLayers({
    layers: mapboxStyleGroupLayers_atlas_bikelanes_widths,
    source,
    sourceLayer,
  }),
  legends: bikelanesWidthLegend,
}

export const subcat_bikelanes: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Radinfrastruktur',
  ui: 'dropdown',
  sourceId: source,
  beforeId: 'atlas-app-beforeid-top',
  styles: [defaultStyleHidden, bikelanesDefaultStyle, bikelanesDetailsStyle, bikelanesWidthStyle],
}

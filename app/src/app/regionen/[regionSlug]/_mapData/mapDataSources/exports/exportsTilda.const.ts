import { SourceExportApiIdentifier } from '../export/exportIdentifier'

export type MapDataExport = {
  id: SourceExportApiIdentifier
  title: string
  desc: string
  attributionHtml: string
  licence: 'ODbL' | undefined
}

export const exportsTilda: MapDataExport[] = [
  {
    id: 'bikelanes',
    title: 'Fahrradinfrastruktur',
    desc: 'Prozessierte Infrastrukturdaten (ohne Mischverkehr)',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'bikeroutes',
    title: 'Fahrradrouten',
    desc: 'Ausgeschilderte Fahrradrouten aus OpenStreetMap',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'roads',
    title: 'Straßennetz',
    desc: 'Haupt- und Nebenstraßen, Beleuchtung, Oberfläche, Höchstgeschwindigkeit, Vollständigkeit RVA',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'roadsPathClasses',
    title: 'Straßennetz Wege',
    desc: 'Fuß-, Wald-, Feld-, Reit-, Fahrradwege, Treppen',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'publicTransport',
    title: 'ÖPNV-Haltepunkte und Fähranleger',
    desc: 'Punktdaten von Haltestellen',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'poiClassification',
    title: 'POI Einkauf, Freizeit, Bildung',
    desc: 'Kategorisiert Punktdaten. Bildungsdaten können über `formalEducation` gefiltert werden.',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'places',
    title: 'Orte',
    desc: 'Punktdaten zu Städten und Dörfern',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'bicycleParking_points',
    title: 'Fahrradstellplätze (Beta)',
    desc: 'Alle Fahrradstellplätze. Flächen werden als Punkt ausgegeben.',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'trafficSigns',
    title: 'Verkehrszeichen',
    desc: 'Verkehrszeichen und Routen-Beschilderungen',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'todos_lines',
    title: 'Aufgaben',
    desc: 'Hinweise zu Aufgaben in den Fahrrad und Straßendaten.',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
]

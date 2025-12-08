import { SourceExportApiIdentifier } from '../export/exportIdentifier'

export type MapDataExport = {
  id: SourceExportApiIdentifier
  title: string
  desc: string
  attributionHtml: string
  licence: 'ODbL' | undefined
}

export const exportsTildaParking: MapDataExport[] = [
  {
    id: 'parkings',
    title: 'Straßenparken',
    desc: 'Prozessierte Parkraumdaten aus OpenStreetMap.',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'parkings_no',
    title: 'Park- und Halteverbote',
    desc: 'Bereiche mit Park- und Halteverboten sowie Angaben zur Vollständigkeit und Qualitätssicherung.',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'parkings_separate',
    title: 'Straßenparken (separat erfasste Flächen)',
    desc: 'Separat erfasste Parkraumflächen im Straßenraum aus OpenStreetMap (u.a. Parkbuchten und markierte Einzelstellplätze).',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'off_street_parking_areas',
    title: 'Parken abseits des Straßenraums',
    desc: 'Parkraumflächen abseits der Straße.',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'off_street_parking_points',
    title: 'Zugangspunkte zu (Tief-)Garagen und Parkhäusern',
    desc: 'Zugangspunkte zu Parkmöglichkeiten abseits des Straßenraums, wie (Tief-)Garagen und Parkhäusern.',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
]

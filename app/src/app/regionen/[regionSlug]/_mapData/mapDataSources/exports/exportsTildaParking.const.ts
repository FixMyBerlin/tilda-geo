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
    title: 'Parkraum',
    desc: 'Prozessierte Parkraumdaten aus OpenStreetMap',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'parkings_no',
    title: 'Parkverbote',
    desc: 'Bereiche mit Parkverboten',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'parkings_separate',
    title: 'Parkraum Separate',
    desc: 'Separate Parkraumflächen (nicht an Straßen)',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'off_street_parking_areas',
    title: 'Off-Street Parkraum Flächen',
    desc: 'Parkraumflächen abseits der Straße',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
  {
    id: 'off_street_parking_points',
    title: 'Off-Street Parkraum Punkte',
    desc: 'Parkraumpunkte abseits der Straße',
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
  },
]

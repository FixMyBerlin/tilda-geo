import { MapDataBackgroundSource } from '@/src/app/regionen/[regionSlug]/_mapData/types'

export type SourcesRasterIds =
  | 'default'
  | 'strassenbefahrung'
  | 'alkis'
  | 'mapnik'
  | 'esri'
  | 'maptiler-satellite-v1'
  | 'maptiler-satellite'
  | 'mapbox-satellite'
  | 'areal2025'
  | 'areal2024'
  | 'areal2023'
  | 'areal2022'
  | 'areal2021'
  | 'areal2020'
  | 'areal2019'
  | 'parkraumkarte_neukoelln'
  | 'cyclosm'
  | 'memomaps-transport'
  | 'thunderforest-opencyclemap'
  | 'thunderforest-transport'
  | 'thunderforest-landscape'
  | 'thunderforest-outdoors'
  | 'waymarkedtrails-cycling'
  | 'waymarkedtrails-hiking'
  | 'opentopomap'
  | 'trto-radwege'
  | 'brandenburg-dop20'
  | 'brandenburg-aktualitaet'
  | 'nrw-ortho'

// https://account.mapbox.com/access-tokens
// https://account.mapbox.com/access-tokens/clileup4r0b1r3gmp4hxqhou8/
// Has Domain restrictions
const tokenMapboxTilesets =
  'sk.eyJ1IjoiaGVqY28iLCJhIjoiY2xpbGV1cDRyMGIxcjNnbXA0aHhxaG91OCJ9.7ndjc3cZRsoYdoOvCrQ2AA'

// API Key https://cloud.maptiler.com/account/keys/db5f268c-c1ea-4cc4-8414-69ba179d11c0/settings
// Has Domain restrictions
const tokenMaptilerTilesets = 'wo0y3tqo53envRHnz2Bl'

export const sourcesBackgroundsRaster: MapDataBackgroundSource<SourcesRasterIds>[] = [
  {
    id: 'strassenbefahrung',
    name: 'Berlin: Straßenbefahrung 2014',
    tiles: 'https://mapproxy.codefor.de/tiles/1.0.0/strassenbefahrung/mercator/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 21,
    minzoom: 10,
    attributionHtml:
      '<a target="_blank" href="https://fbinter.stadt-berlin.de/fb/berlin/service_intern.jsp?id=k_StraDa@senstadt&type=WMS">Geoportal Berlin / Straßenbefahrung 2014</a>',
  },
  {
    id: 'alkis',
    name: 'Berlin: Alkis',
    tiles: 'https://mapproxy.codefor.de/tiles/1.0.0/alkis_30/mercator/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 21,
    minzoom: 10,
    attributionHtml:
      '<a target="_blank" href="https://fbinter.stadt-berlin.de/fb/berlin/service_intern.jsp?id=k_StraDa@senstadt&type=WMS">Geoportal Berlin / Straßenbefahrung 2014</a>',
  },
  {
    id: 'mapnik',
    name: 'OpenStreetMap Carto',
    tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 21,
    minzoom: 10,
    attributionHtml: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>',
  },
  {
    id: 'esri',
    name: 'Luftbild Esri',
    tiles:
      'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    tileSize: 256,
    maxzoom: 21,
    minzoom: 10,
    attributionHtml: '<a href="https://wiki.openstreetmap.org/wiki/Esri">Esri Terms & Feedback</a>',
  },
  {
    // https://cloud.maptiler.com/tiles/satellite/
    // V1 is deprecated
    id: 'maptiler-satellite-v1',
    name: 'Luftbild Maptiler v1',
    tiles: `https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=${tokenMaptilerTilesets}`,
    tileSize: 512,
    maxzoom: 20,
    minzoom: 10, // Visible from 10.5 on. Even though https://cloud.maptiler.com/tiles/satellite/ says "0"
    attributionHtml:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>',
  },
  {
    // https://cloud.maptiler.com/tiles/satellite-v2/
    id: 'maptiler-satellite',
    name: 'Luftbild Maptiler v2',
    tiles: `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${tokenMaptilerTilesets}`,
    tileSize: 512,
    maxzoom: 22,
    minzoom: 0,
    attributionHtml:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>',
  },
  // Cost/Usage https://account.mapbox.com/
  // Docs https://docs.mapbox.com/data/tilesets/reference/mapbox-satellite/
  // Tileset https://studio.mapbox.com/tilesets/mapbox.satellite/
  {
    id: 'mapbox-satellite',
    name: 'Luftbild Mapbox',
    tiles: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.webp?access_token=${tokenMapboxTilesets}`,
    tileSize: 512,
    maxzoom: 22,
    minzoom: 0,
    attributionHtml: '<a href="https://www.mapbox.com/feedback/">&copy; Mapbox</a>',
  },
  // This is the version from https://github.com/openstreetmap/iD/blob/HEAD/data/manual_imagery.json
  // More: https://github.com/osmlab/editor-layer-index/issues/1451#issuecomment-1057938706
  // maxar_tiles: {
  //   name: 'Maxar',
  //   scheme: 'tms', // `{-y}` in Leaflet https://maplibre.org/maplibre-gl-js-docs/style-spec/sources/#raster-scheme
  //   tiles: [
  //     'https://services.digitalglobe.com/earthservice/tmsaccess/tms/1.0.0/DigitalGlobe:ImageryTileService@EPSG:3857@jpg/{z}/{x}/{y}.jpg?connectId=c2cbd3f2-003a-46ec-9e46-26a3996d6484',
  //   ,
  //   tileSize: 256,
  //   maxzoom: 21,
  //   minzoom: 10,
  //   attribution:
  //     "<a href='https://wiki.openstreetmap.org/wiki/DigitalGlobe'>Terms & Feedback</a>",
  // },
  {
    id: 'areal2025',
    name: 'Berlin: Luftbilder 2025',
    tiles: 'https://tiles.codefor.de/berlin/geoportal/luftbilder/2025-dop20rgb/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 21,
    minzoom: 10,
    attributionHtml: 'Geoportal Berlin / Digitale farbige Orthophotos 2025 (DOP20RGB)',
  },
  {
    id: 'areal2024',
    name: 'Berlin: Luftbilder 2024',
    tiles: 'https://tiles.codefor.de/berlin-2024-dop20rgbi/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 21,
    minzoom: 10,
    attributionHtml:
      '<a target="_blank" href="https://gdi.berlin.de/geonetwork/srv/ger/catalog.search#/metadata/07ec4c16-723f-32ea-9580-411d8fe4f7e7">Geoportal Berlin / Digitale farbige TrueOrthophotos 2024 (DOP20RGB)</a>',
  },
  {
    id: 'areal2023',
    name: 'Berlin: Luftbilder 2023',
    tiles: 'https://tiles.codefor.de/berlin-2023-dop20rgbi/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 21,
    minzoom: 10,
    attributionHtml:
      '<a target="_blank" href="https://gdi.berlin.de/geonetwork/srv/ger/catalog.search#/metadata/07ec4c16-723f-32ea-9580-411d8fe4f7e7">Geoportal Berlin / Digitale farbige TrueOrthophotos 2023 (DOP20RGBI)</a>',
  },
  {
    id: 'areal2022',
    name: 'Berlin: Luftbilder 2022',
    tiles: 'https://tiles.codefor.de/berlin-2022-dop20rgbi/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 21,
    minzoom: 10,
    // Scheinbar gibt es keinen Link mehr der nur die Orthophotos representiert. Der Link unten enthält die Daten aber auch.
    attributionHtml:
      '<a target="_blank" href="https://gdi.berlin.de/geonetwork/srv/ger/catalog.search#/metadata/804a9581-a128-37cc-9c25-2b2474ba45eb">Geoportal Berlin / Digitale farbige TrueOrthophotos 2022 (DOP20RGBI)</a>',
  },
  {
    id: 'areal2021',
    name: 'Berlin: Luftbilder 2021',
    tiles: 'https://tiles.codefor.de/berlin-2021-dop20rgbi/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 21,
    minzoom: 10,
    attributionHtml:
      '<a target="_blank" href="https://gdi.berlin.de/geonetwork/srv/ger/catalog.search#/metadata/0682e22d-cd98-3c13-b6fa-a91db67c780e">Geoportal Berlin / Digitale farbige Orthophotos 2021 (DOP20RGBI)</a>',
  },
  {
    id: 'areal2020',
    name: 'Berlin: Luftbilder 2020',
    tiles: 'https://tiles.codefor.de/berlin-2020-dop20rgb/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 21,
    minzoom: 10,
    attributionHtml:
      '<a target="_blank" href="https://gdi.berlin.de/geonetwork/srv/ger/catalog.search#/metadata/a338e6ee-5d3a-34c6-9259-ef8a5c0ba66a">Geoportal Berlin / Digitale farbige Orthophotos 2020 (DOP20RGB)</a>',
  },
  {
    id: 'areal2019',
    name: 'Berlin: Luftbilder 2019',
    tiles: 'https://tiles.codefor.de/berlin-2019-dop20rgb/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 21,
    minzoom: 10,
    // TODO: Es gibt keine aktuelle Datenquelle mehr
    attributionHtml:
      '<a target="_blank" href="https://fbinter.stadt-berlin.de/fb/berlin/service.jsp?id=a_luftbild2019_rgb@senstadt&type=FEED">Geoportal Berlin / Digitale farbige Orthophotos 2019 (DOP20RGB)</a>',
  },
  {
    id: 'parkraumkarte_neukoelln',
    name: 'Berlin: Parkraumkarte Neukoelln',
    tiles: 'https://tiles.osm-berlin.org/parkraumkarte/{z}/{x}/{y}.jpg',
    tileSize: 256,
    maxzoom: 20,
    minzoom: 10,
    attributionHtml:
      '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>, Bordsteinkanten: OpenStreetMap und Geoportal Berlin / ALKIS.',
  },
  {
    id: 'cyclosm',
    name: 'CyclOSM',
    tiles: 'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    // 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    // tileSize: 256, // TODO figure out if we need this
    maxzoom: 20,
    minzoom: 0,
    attributionHtml: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    legendUrl: 'https://www.cyclosm.org/#map={z}/{x}/{y}/cyclosm',
  },
  {
    // https://www.thunderforest.com/maps/opencyclemap/
    id: 'thunderforest-opencyclemap',
    name: 'OpenCycleMap',
    tiles:
      'https://tile.thunderforest.com/cycle/{z}/{x}/{y}{ratio}.png?apikey=27051673860149148c0c2818a0e10dfb',
    tileSize: 512,
    maxzoom: 22,
    minzoom: 10,
    attributionHtml:
      'Maps © <a href="https://www.thunderforest.com">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    legendUrl: 'https://www.opencyclemap.org/docs/',
  },
  // TODO: CORS Problem
  // {
  //   // TODO: Vereinbarung mit https://memomaps.de/ treffen
  //   id: 'memomaps-transport',
  //   name: 'ÖPNV Karte 1',
  //   tiles: 'https://tileserver.memomaps.de/tilegen/14/8796/5286.png',
  //   tileSize: 512,
  //   maxzoom: 18,
  //   minzoom: 10,
  //   attributionHtml:
  //     'Maps © <a href="https://memomaps.de/">MeMoMaps</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  // },
  {
    // https://www.thunderforest.com/maps/transport/
    id: 'thunderforest-transport',
    name: 'ÖPNV Karte 2',
    tiles:
      'https://tile.thunderforest.com/transport/{z}/{x}/{y}{ratio}.png?apikey=27051673860149148c0c2818a0e10dfb',
    // tileSize: 512,
    maxzoom: 22,
    minzoom: 10,
    attributionHtml:
      'Maps © <a href="https://www.thunderforest.com">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    // https://www.thunderforest.com/maps/landscape/
    id: 'thunderforest-landscape',
    name: 'Höhenlinien',
    tiles:
      'https://tile.thunderforest.com/landscape/{z}/{x}/{y}{ratio}.png?apikey=27051673860149148c0c2818a0e10dfb',
    // tileSize: 512,
    maxzoom: 22,
    minzoom: 10,
    attributionHtml:
      'Maps © <a href="https://www.thunderforest.com">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    // https://www.thunderforest.com/maps/outdoors/
    id: 'thunderforest-outdoors',
    name: 'Wandern',
    tiles:
      'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}{ratio}.png?apikey=27051673860149148c0c2818a0e10dfb',
    // tileSize: 512,
    maxzoom: 22,
    minzoom: 10,
    attributionHtml:
      'Maps © <a href="https://www.thunderforest.com">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    // Usage allowed as long as "moderate" traffic.
    // https://cycling.waymarkedtrails.org/
    id: 'waymarkedtrails-cycling',
    name: 'Radrouten',
    tiles: 'https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png',
    maxzoom: 15,
    minzoom: 0,
    // TODO the zxy has to go or be fixed, see comment at `const enhancedAttributionHtml`
    attributionHtml:
      'Routenoverlay CC-BY-SA <a href="https://cycling.waymarkedtrails.org/#?map={z}/{x}/{y}">Waymarked Trails</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    legendUrl: 'https://cycling.waymarkedtrails.org/#?map={z}/{x}/{y}',
  },
  {
    // Usage allowed as long as "moderate" traffic.
    // https://hiking.waymarkedtrails.org/
    id: 'waymarkedtrails-hiking',
    name: 'Wanderrouten',
    tiles: 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png',
    maxzoom: 15,
    minzoom: 0,
    // TODO the zxy has to go or be fixed, see comment at `const enhancedAttributionHtml`
    attributionHtml:
      'Routenoverlay CC-BY-SA <a href="https://hiking.waymarkedtrails.org/#?map={z}/{x}/{y}">Waymarked Trails</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    legendUrl: 'https://hiking.waymarkedtrails.org/#?map={z}/{x}/{y}',
  },
  {
    // Usage allowed as long as "moderate" traffic.
    // https://hiking.waymarkedtrails.org/
    id: 'opentopomap',
    name: 'OpenTopoMap',
    tiles: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxzoom: 17,
    minzoom: 0,
    attributionHtml:
      'Kartendaten: © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Kartendarstellung: © <a href="http://opentopomap.org">OpenTopoMap</a>',
    legendUrl: 'https://opentopomap.org/about#legende',
  },
  {
    // https://dienste.btfietz.de/kommsvz/ttw_radwege/wms?request=getCapabilities
    // https://maplibre.org/maplibre-gl-js-docs/style-spec/sources/
    id: 'trto-radwege',
    name: 'Amtliche Radwege',
    tiles:
      'https://dienste.btfietz.de/kommsvz/ttw_radwege/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=839&HEIGHT=878&LAYERS=radweg&STYLES=&FORMAT=image/png&DPI=72&MAP_RESOLUTION=72&FORMAT_OPTIONS=dpi:72&TRANSPARENT=TRUE',
    maxzoom: 15,
    minzoom: 0,
    attributionHtml: 'Amt Treptower Tollensewinkel',
    legendUrl: undefined,
  },
  {
    // https://github.com/osmlab/editor-layer-index/blob/gh-pages/sources/europe/de/Brandenburg-DOP20c.geojson?short_path=0ac57a0
    id: 'brandenburg-dop20',
    name: 'Brandenburg GeoBasis-DE/LGB (latest) / DOP20c',
    tiles:
      'https://isk.geobasis-bb.de/mapproxy/dop20c/service/wms?FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&SERVICE=WMS&REQUEST=GetMap&LAYERS=bebb_dop20c&STYLES=&crs=EPSG:3857&WIDTH=512&HEIGHT=512&BBOX={bbox-epsg-3857}',
    maxzoom: 20,
    minzoom: 0,
    tileSize: 512,
    attributionHtml:
      'GeoBasis-DE/LGB / BB-BE DOP20c, dl-de/by-2-0; Geoportal Berlin / DOP20, dl-de/by-2-0',
    legendUrl: undefined,
  },
  {
    // https://geobroker.geobasis-bb.de/gbss.php?MODE=GetProductPreview&PRODUCTID=b4c381ab-7e34-4ede-8e4f-7df6a776e909
    // ^-- but only one layer
    // Other source https://geobasis-bb.de/lgb/de/geodaten/luftbilder/luftbilder-aktuell/ which links to the PDF below
    id: 'brandenburg-aktualitaet',
    name: 'Brandenburg Aktualitätsübersicht Luftbilder',
    tiles:
      'https://isk.geobasis-bb.de/ows/aktualitaeten_wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=bb_dop_info&STYLES=default&CRS=EPSG:3857&MAP_RESOLUTION=180&WIDTH=1342&HEIGHT=1000&BBOX={bbox-epsg-3857}',
    maxzoom: 20,
    minzoom: 0,
    tileSize: 512,
    attributionHtml:
      'GeoBasis-DE/LGB / BB-BE DOP20c, dl-de/by-2-0; Geoportal Berlin / DOP20, dl-de/by-2-0',
    legendUrl:
      'https://data.geobasis-bb.de/geobasis/information/aktualitaeten/bb_dop_aktualitaet.pdf',
  },
  {
    // https://github.com/osmlab/editor-layer-index/blob/gh-pages/sources/europe/de/NRW_ortho_wms.geojson?short_path=3887584
    id: 'nrw-ortho',
    name: 'NRW Luftbilder',
    tiles:
      'https://www.wms.nrw.de/geobasis/wms_nw_dop?LAYERS=nw_dop_rgb&STYLES=default&FORMAT=image/jpeg&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}&VERSION=1.3.0&SERVICE=WMS&REQUEST=GetMap',
    maxzoom: 20,
    minzoom: 0,
    tileSize: 512,
    attributionHtml: 'NRW Orthophoto (RGB) dl-de/zero-2-0',
  },
]

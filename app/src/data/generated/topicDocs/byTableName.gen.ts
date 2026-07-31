import type { TopicDocCompiled } from '../../topicDocs/runtime'

const data = {
  barrierAreas: {
    topic: 'barriers',
    tableName: 'barrierAreas',
    sourceIds: ['atlas_barriers'],
    title: 'Daten zu Flächen-Barrieren',
    summary: 'Große Gewässerflächen und Flugplätze als Barrieren für die Netzplanung.',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'natural',
        type: 'string',
        label: 'Natürliche Barriere',
        values: [
          {
            value: 'water',
            label: 'Gewässer',
          },
        ],
      },
      {
        key: 'aerodrome',
        type: 'string',
        label: 'Flugplatztyp',
        values: [
          {
            value: 'international',
            label: 'Internationaler Flughafen',
          },
          {
            value: 'private',
            label: 'Privater Flugplatz',
          },
          {
            value: 'regional',
            label: 'Regionaler Flugplatz',
          },
          {
            value: 'gliding',
            label: 'Segelflugplatz',
          },
          {
            value: 'airsport',
            label: 'Luftsportgelände',
          },
        ],
      },
      {
        key: 'area',
        type: 'number',
        label: 'Fläche',
        values: [],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
    ],
    chapters: [],
  },
  barrierLines: {
    topic: 'barriers',
    tableName: 'barrierLines',
    sourceIds: ['atlas_barriers'],
    title: 'Daten zu Linien-Barrieren',
    summary: 'Große lineare Barrieren wie Hauptverkehrsstraßen, Schienen und Gewässer.',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'highway',
        type: 'string',
        label: 'Straßentyp',
        values: [
          {
            value: 'motorway',
            label: 'Autobahn',
          },
          {
            value: 'motorway_link',
            label: 'Autobahn-Anschluss',
          },
          {
            value: 'trunk',
            label: 'Kraftfahrstraße',
          },
          {
            value: 'trunk_link',
            label: 'Kraftfahrstraßen-Anschluss',
          },
        ],
      },
      {
        key: 'waterway',
        type: 'string',
        label: 'Gewässertyp',
        values: [
          {
            value: 'river',
            label: 'Fluss',
          },
          {
            value: 'canal',
            label: 'Kanal',
          },
          {
            value: 'stream',
            label: 'Bach',
          },
          {
            value: 'ditch',
            label: 'Graben',
          },
          {
            value: 'drain',
            label: 'Entwässerungsgraben',
          },
        ],
      },
      {
        key: 'railway',
        type: 'string',
        label: 'Schienentyp',
        values: [
          {
            value: 'rail',
            label: 'Bahnstrecke',
          },
          {
            value: 'light_rail',
            label: 'Stadtbahn',
          },
          {
            value: 'tram',
            label: 'Straßenbahn',
          },
          {
            value: 'subway',
            label: 'U-Bahn',
          },
        ],
      },
      {
        key: 'usage',
        type: 'string',
        label: 'Schienennutzung',
        values: [
          {
            value: 'main',
            label: 'Hauptstrecke',
          },
          {
            value: 'branch',
            label: 'Nebenstrecke',
          },
          {
            value: 'industrial',
            label: 'Industriegleis',
          },
          {
            value: 'military',
            label: 'Militärisch',
          },
          {
            value: 'tourism',
            label: 'Touristisch',
          },
          {
            value: 'test',
            label: 'Teststrecke',
          },
          {
            value: 'leisure',
            label: 'Freizeitnutzung',
          },
        ],
      },
      {
        key: 'bridge',
        type: 'string',
        label: 'Brücke',
        values: [
          {
            value: 'yes',
            label: 'Brücke',
          },
          {
            value: 'boardwalk',
            label: 'Bohlensteg',
          },
          {
            value: 'viaduct',
            label: 'Viadukt',
          },
          {
            value: 'movable',
            label: 'Bewegliche Brücke',
          },
          {
            value: 'aqueduct',
            label: 'Aquädukt',
          },
          {
            value: 'covered',
            label: 'Überdachte Brücke',
          },
          {
            value: 'cantilever',
            label: 'Kragträgerbrücke',
          },
          {
            value: 'low_water_crossing',
            label: 'Furtenartige Querung',
          },
        ],
      },
      {
        key: 'tunnel',
        type: 'string',
        label: 'Tunnel',
        values: [
          {
            value: 'yes',
            label: 'Tunnel',
          },
          {
            value: 'culvert',
            label: 'Durchlass',
          },
          {
            value: 'building_passage',
            label: 'Gebäudedurchfahrt',
          },
          {
            value: 'flooded',
            label: 'Überflutet',
          },
          {
            value: 'avalanche_protector',
            label: 'Lawinenschutzgalerie',
          },
        ],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
    ],
    chapters: [],
  },
  bicycleParking_points: {
    topic: 'bicycleParking',
    tableName: 'bicycleParking_points',
    sourceIds: ['atlas_bicycleParking'],
    title: 'Fahrradstellplätze',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'capacity',
        type: 'number',
        label: 'Anzahl Fahrrad-Stellplätze',
        values: [],
      },
      {
        key: 'capacity:cargo_bike',
        type: 'number',
        label: 'Anzahl Lastenfahrrad-Stellplätze',
        values: [],
      },
      {
        key: 'access',
        type: 'string',
        label: 'Zugang',
        values: [
          {
            value: 'yes',
            label: 'Öffentlich',
          },
          {
            value: 'customers',
            label: 'Kund:innen',
          },
          {
            value: 'permissive',
            label: 'Öffentliche Nutzung geduldet',
          },
          {
            value: 'private',
            label: 'Privat',
          },
        ],
      },
      {
        key: 'covered',
        type: 'string',
        label: 'Überdacht',
        values: [
          {
            value: 'partial',
            label: 'Teilweise überdacht',
          },
          {
            value: 'yes',
            label: 'Überdacht',
          },
          {
            value: 'no',
            label: 'Nicht überdacht',
          },
          {
            value: 'implicit_no',
            label: 'Nicht überdacht (implizit)',
          },
        ],
      },
      {
        key: 'fee',
        type: 'string',
        label: 'Gebühren',
        values: [
          {
            value: 'yes',
            label: 'Gebührenpflichtig',
          },
          {
            value: 'no',
            label: 'Kostenfrei',
          },
          {
            value: 'implicit_no',
            label: 'Kostenfrei (implizit)',
          },
        ],
      },
      {
        key: 'access_cargo_bike',
        type: 'string',
        label: 'Zugang Lastenrad',
        values: [
          {
            value: 'yes',
            label: 'Zugelassen',
          },
        ],
      },
      {
        key: 'lit',
        type: 'string',
        label: 'Beleuchtung',
        values: [
          {
            value: 'yes',
            label: 'Beleuchtet',
          },
          {
            value: 'no',
            label: 'Nicht beleuchtet',
          },
        ],
      },
      {
        key: 'bicycle_parking',
        type: 'string',
        label: 'Fahrradabstellanlage',
        values: [
          {
            value: 'stands',
            label: 'Anlehnbügel',
          },
          {
            value: 'wide_stands',
            label: 'Breite Anlehnbügel',
          },
          {
            value: 'bollard',
            label: 'Poller',
          },
          {
            value: 'wall_loops',
            label: 'Wandhalter',
          },
          {
            value: 'shed',
            label: 'Unterstand',
          },
          {
            value: 'two-tier',
            label: 'Doppelstockparker',
          },
          {
            value: 'lockers',
            label: 'Fahrradboxen',
          },
        ],
      },
      {
        key: 'operator_type',
        type: 'string',
        label: 'Betreibertyp',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'public',
            label: 'Öffentlich',
          },
        ],
      },
      {
        key: 'position',
        type: 'string',
        label: 'Lage',
        values: [
          {
            value: 'sidewalk',
            label: 'Gehweg',
          },
          {
            value: 'grass_verge',
            label: 'Grünstreifen',
          },
          {
            value: 'lane',
            label: 'Fahrbahn',
          },
          {
            value: 'kerb_extension',
            label: 'Gehwegvorstreckung',
          },
          {
            value: 'parking_lot',
            label: 'Parkplatz',
          },
          {
            value: 'street_side',
            label: 'Straßenrand',
          },
          {
            value: 'school_ground',
            label: 'Schulgelände',
          },
          {
            value: 'private_property',
            label: 'Privatgrund',
          },
          {
            value: 'pedestrian_area',
            label: 'Fußgängerbereich',
          },
          {
            value: 'park',
            label: 'Park',
          },
          {
            value: 'parking',
            label: 'Parkfläche',
          },
        ],
      },
      {
        key: 'indoor',
        type: 'string',
        label: 'Innenraum',
        values: [
          {
            value: 'yes',
            label: 'Innen',
          },
        ],
      },
      {
        key: 'surface',
        type: 'string',
        label: 'Oberfläche',
        values: [
          {
            value: 'asphalt',
            label: 'Asphalt',
          },
          {
            value: 'paved',
            label: 'Befestigt (unspezifisch)',
          },
          {
            value: 'unpaved',
            label: 'Unbefestigt',
          },
          {
            value: 'concrete',
            label: 'Beton',
          },
          {
            value: 'concrete:plates',
            label: 'Betonplatten',
          },
          {
            value: 'concrete:lanes',
            label: 'Betonstreifen / -bahnen',
          },
          {
            value: 'paving_stones',
            label: 'Verbund&shy;pflastersteine',
          },
          {
            value: 'paving_stones:lanes',
            label: 'Pflasterstein&shy;bahnen',
          },
          {
            value: 'sett',
            label: 'Behauenes Pflaster / Natursteinpflaster',
          },
          {
            value: 'mosaic_sett',
            label: 'Mosaikpflaster',
          },
          {
            value: 'small_sett',
            label: 'Kleinpflaster',
          },
          {
            value: 'large_sett',
            label: 'Großpflaster',
          },
          {
            value: 'bricks',
            label: 'Ziegel',
          },
          {
            value: 'stone',
            label: 'Stein',
          },
          {
            value: 'ground',
            label: 'Erde/Boden',
          },
          {
            value: 'grass',
            label: 'Gras',
          },
          {
            value: 'sand',
            label: 'Sand',
          },
          {
            value: 'compacted',
            label: 'Verdichteter Untergrund',
          },
          {
            value: 'fine_gravel',
            label: 'Splitt',
          },
          {
            value: 'gravel',
            label: 'Schotter',
          },
          {
            value: 'pebblestone',
            label: 'Kieselsteine',
          },
          {
            value: 'wood',
            label: 'Holz',
          },
          {
            value: 'woodchips',
            label: 'Hackschnitzel',
          },
          {
            value: 'metal',
            label: 'Metall',
          },
          {
            value: 'metal_grid',
            label: 'Metallgitter',
          },
          {
            value: 'plastic',
            label: 'Kunststoff',
          },
          {
            value: 'rubber',
            label: 'Gummi',
          },
          {
            value: 'grass_paver',
            label: 'Rasengitter / Grasgitter',
          },
        ],
      },
      {
        key: 'surveillance',
        type: 'string',
        label: 'Überwachung',
        values: [
          {
            value: 'outdoor',
            label: 'Außenüberwachung',
          },
          {
            value: 'public',
            label: 'Öffentlich überwacht',
          },
          {
            value: 'indoor',
            label: 'Innen überwacht',
          },
          {
            value: 'yes',
            label: 'Überwacht',
          },
          {
            value: 'webcam',
            label: 'Webcam',
          },
          {
            value: 'traffic',
            label: 'Verkehrsüberwachung',
          },
          {
            value: 'camera',
            label: 'Kamera',
          },
          {
            value: 'private',
            label: 'Privat überwacht',
          },
        ],
      },
      {
        key: 'count',
        type: 'number',
        label: 'Anzahl Anlagen',
        values: [],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
      {
        key: 'operator',
        type: 'sanitized_strings',
        label: 'Betreiber',
        values: [],
      },
      {
        key: 'mapillary',
        type: 'sanitized_strings',
        label: 'Mapillary',
        description: 'Mapillary-Foto-ID für dieses Feature.',
        values: [],
      },
      {
        key: 'description',
        type: 'sanitized_strings',
        label: 'Beschreibung',
        values: [],
      },
      {
        key: 'traffic_sign',
        type: 'sanitized_strings',
        label: 'Verkehrszeichen',
        description: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
        values: [],
      },
      {
        key: 'maxstay',
        type: 'sanitized_strings',
        label: 'Maximaldauer',
        values: [],
      },
      {
        key: 'osm_capacity',
        type: 'sanitized_strings',
        label: 'OSM Kapazität (roh, Testdaten)',
        purpose: 'qa',
        values: [],
      },
      {
        key: 'osm_capacity:cargo_bike',
        type: 'sanitized_strings',
        label: 'OSM Kapazität Lastenrad (roh, Testdaten)',
        purpose: 'qa',
        values: [],
      },
    ],
    chapters: [],
  },
  bikelanes: {
    topic: 'roads_bikelanes',
    tableName: 'bikelanes',
    sourceIds: ['atlas_bikelanes'],
    title: 'Daten zur Radinfrastruktur',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'category',
        type: 'string',
        label: 'Bauliche Führung',
        chapterRefs: ['versetzte-geometrien'],
        values: [
          {
            value: 'bicycleRoad',
            label: 'Fahrradstraße',
          },
          {
            value: 'bicycleRoad_vehicleDestination',
            label: 'Fahrradstraße mit Anlieger/Kfz frei',
          },
          {
            value: 'crossing',
            label: 'Straßenquerung',
          },
          {
            value: 'cycleway_adjoining',
            label: 'Radweg (straßenbegleitend)',
          },
          {
            value: 'cycleway_adjoiningOrIsolated',
            label: 'Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway_isolated',
            label: 'Radweg, selbstständig geführt',
          },
          {
            value: 'cyclewayLink',
            label: 'Radweg-Verbindungsstück',
          },
          {
            value: 'cyclewayOnHighway_advisory',
            label: 'Schutzstreifen',
          },
          {
            value: 'cyclewayOnHighway_advisoryOrExclusive',
            label: 'Radfahrstreifen oder Schutzstreifen (Kategorisierung unklar)',
          },
          {
            value: 'cyclewayOnHighway_exclusive',
            label: 'Radfahrstreifen',
          },
          {
            value: 'cyclewayOnHighwayBetweenLanes',
            label: 'Radfahrstreifen in Mittellage (Fahrradweiche)',
          },
          {
            value: 'cyclewayOnHighwayProtected',
            label: 'Geschützter Radfahrstreifen (PBL)',
          },
          {
            value: 'footAndCyclewaySegregated_adjoining',
            label: 'Getrennter Rad- und Gehweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewaySegregated_adjoiningOrIsolated',
            label:
              'Getrennter Rad- und Gehweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewaySegregated_isolated',
            label: 'Getrennter Rad- und Gehweg, selbstständig geführt',
          },
          {
            value: 'footAndCyclewayShared_adjoining',
            label: 'Gemeinsamer Geh- und Radweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewayShared_adjoiningOrIsolated',
            label:
              'Gemeinsamer Geh- und Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewayShared_isolated',
            label: 'Gemeinsamer Geh- und Radweg, selbstständig geführt',
          },
          {
            value: 'footwayBicycleYes_adjoining',
            label: 'Gehweg mit Radfahrer frei, straßenbegleitend',
          },
          {
            value: 'footwayBicycleYes_adjoiningOrIsolated',
            label:
              'Gehweg mit Radfahrer frei (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footwayBicycleYes_isolated',
            label: 'Gehweg mit Radfahrer frei, selbstständig geführt',
          },
          {
            value: 'livingStreet',
            label: 'Verkehrsberuhigter Bereich (Spielstraße)',
          },
          {
            value: 'pedestrianAreaBicycleYes',
            label: 'Fußgängerzone, Fahrrad frei',
          },
          {
            value: 'separate_geometry',
            label: 'RVA als separate Geometrie erfasst',
          },
          {
            value: 'sharedBusLaneBikeWithBus',
            label: 'Radfahrstreifen mit Freigabe Busverkehr',
          },
          {
            value: 'sharedBusLaneBusWithBike',
            label: 'Bussonderfahrstreifen mit Fahrrad frei',
          },
          {
            value: 'sharedMotorVehicleLane',
            label: 'Gemeinsamer Fahrstreifen',
          },
          {
            value: 'needsClarification',
            label: 'Führungsform unklar',
          },
        ],
      },
      {
        key: 'road',
        type: 'string',
        label: 'Straßentyp Fahrbahn',
        values: [
          {
            value: 'bicycle_road',
            label: 'Fahrradstraße',
          },
          {
            value: 'construction',
            label: 'Straße ist in Bau',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway',
            label: 'Radweg',
          },
          {
            value: 'footway_cycleway_crossing',
            label: 'Straßenquerung (Fußverkehr)',
          },
          {
            value: 'footway_sidewalk',
            label: 'Gehweg',
          },
          {
            value: 'footway',
            label: 'Fußweg',
          },
          {
            value: 'living_street',
            label: 'Verkehrsberuhigter Bereich',
          },
          {
            value: 'motorway_link',
            label: 'Zufahrt einer Autobahn',
          },
          {
            value: 'motorway',
            label: 'Autobahn',
          },
          {
            value: 'path',
            label: 'Weg / Pfad',
          },
          {
            value: 'pedestrian',
            label: 'Fußgängerzone',
          },
          {
            value: 'primary_link',
            label: 'Zufahrt einer Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'primary',
            label: 'Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'residential',
            label: 'Anwohnerstraße',
          },
          {
            value: 'residential_priority_road',
            label: 'residential_priority_road',
          },
          {
            value: 'secondary_link',
            label: 'Zufahrt einer Landes&shy;straße/wichtigen Durchgangs&shy;straße',
          },
          {
            value: 'secondary',
            label: 'Landes&shy;straße/Wichtige Durchgangs&shy;straße',
          },
          {
            value: 'service_alley',
            label: 'Gasse',
          },
          {
            value: 'service_driveway',
            label: 'Grundstückszufahrt',
          },
          {
            value: 'service_emergency_access',
            label: 'Rettungsweg',
          },
          {
            value: 'service_parking_aisle',
            label: 'Parkplatzweg',
          },
          {
            value: 'service_road',
            label: 'Zufahrtsweg',
          },
          {
            value: 'service_uncategorized',
            label: 'Zufahrtsweg (unbekannte Klassifizierung)',
          },
          {
            value: 'service',
            label: 'Zufahrtsweg',
          },
          {
            value: 'steps',
            label: 'Stufen',
          },
          {
            value: 'tertiary_link',
            label: 'Zufahrt einer Kreis&shy;straße/untergeordneten Durchgangs&shy;straße',
          },
          {
            value: 'tertiary',
            label: 'Kreis&shy;straße/Untergeordnete Durchgangs&shy;straße',
          },
          {
            value: 'track',
            label: 'Wald- / Feldweg',
          },
          {
            value: 'unclassified',
            label: 'Nebenstraße mit Verbindungscharakter',
          },
          {
            value: 'unspecified_road',
            label: 'Unkategorisierte Straße',
          },
        ],
      },
      {
        key: 'highway',
        type: 'string',
        label: 'Straßentyp Fahrbahn',
        values: [
          {
            value: 'cycleway',
            label: 'Radweg',
          },
          {
            value: 'footway',
            label: 'Fußweg',
          },
          {
            value: 'living_street',
            label: 'Verkehrsberuhigter Bereich',
          },
          {
            value: 'path',
            label: 'Weg / Pfad',
          },
          {
            value: 'pedestrian',
            label: 'Fußgängerzone',
          },
          {
            value: 'primary',
            label: 'Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'primary_link',
            label: 'Zufahrt einer Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'residential',
            label: 'Anwohnerstraße',
          },
          {
            value: 'road',
            label: 'Unkategorisierte Straße',
          },
          {
            value: 'secondary',
            label: 'Landes&shy;straße/Wichtige Durchgangs&shy;straße',
          },
          {
            value: 'secondary_link',
            label: 'Zufahrt einer Landes&shy;straße/wichtigen Durchgangs&shy;straße',
          },
          {
            value: 'service',
            label: 'Zufahrtsweg',
          },
          {
            value: 'steps',
            label: 'Stufen',
          },
          {
            value: 'tertiary',
            label: 'Kreis&shy;straße/Untergeordnete Durchgangs&shy;straße',
          },
          {
            value: 'tertiary_link',
            label: 'Zufahrt einer Kreis&shy;straße/untergeordneten Durchgangs&shy;straße',
          },
          {
            value: 'track',
            label: 'Wald- / Feldweg',
          },
          {
            value: 'unclassified',
            label: 'Nebenstraße mit Verbindungscharakter',
          },
        ],
      },
      {
        key: '_parent_highway',
        type: 'string',
        label: 'Straßentyp Fahrbahn',
        values: [
          {
            value: 'cycleway',
            label: 'Radweg',
          },
          {
            value: 'footway',
            label: 'Fußweg',
          },
          {
            value: 'living_street',
            label: 'Verkehrsberuhigter Bereich',
          },
          {
            value: 'path',
            label: 'Weg / Pfad',
          },
          {
            value: 'pedestrian',
            label: 'Fußgängerzone',
          },
          {
            value: 'primary',
            label: 'Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'primary_link',
            label: 'Zufahrt einer Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'residential',
            label: 'Anwohnerstraße',
          },
          {
            value: 'road',
            label: 'Unkategorisierte Straße',
          },
          {
            value: 'secondary',
            label: 'Landes&shy;straße/Wichtige Durchgangs&shy;straße',
          },
          {
            value: 'secondary_link',
            label: 'Zufahrt einer Landes&shy;straße/wichtigen Durchgangs&shy;straße',
          },
          {
            value: 'service',
            label: 'Zufahrtsweg',
          },
          {
            value: 'steps',
            label: 'Stufen',
          },
          {
            value: 'tertiary',
            label: 'Kreis&shy;straße/Untergeordnete Durchgangs&shy;straße',
          },
          {
            value: 'tertiary_link',
            label: 'Zufahrt einer Kreis&shy;straße/untergeordneten Durchgangs&shy;straße',
          },
          {
            value: 'track',
            label: 'Wald- / Feldweg',
          },
          {
            value: 'unclassified',
            label: 'Nebenstraße mit Verbindungscharakter',
          },
        ],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
      {
        key: 'length',
        type: 'meter',
        label: 'Länge',
        description:
          'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
        values: [],
      },
      {
        key: 'prefix',
        type: 'string',
        label: 'Quellpräfix',
        purpose: 'processing',
        description:
          'Kennzeichnet, aus welcher OSM-Tagfamilie die Radverkehrsinformationen für dieses Objekt extrahiert wurden. Der Wert wird im Processing gesetzt und beschreibt die verwendete Tag-Präfixlogik, nicht die Quelle im Sinne eines externen Datensatzes.',
        values: [
          {
            value: 'cycleway',
            label: 'Aus `cycleway:*`-Tags extrahiert',
          },
          {
            value: 'sidewalk',
            label: 'Aus `sidewalk:*`-Tags extrahiert',
          },
        ],
      },
      {
        key: 'lifecycle',
        type: 'string',
        label: 'Status',
        values: [
          {
            value: 'blocked',
            label: 'Gesperrt (Sperrung)',
          },
          {
            value: 'construction',
            label: 'In Bau',
          },
          {
            value: 'construction_no_access',
            label: 'Gesperrt aufgrund einer Baustelle',
          },
          {
            value: 'temporary',
            label: 'Temporärer Weg',
          },
        ],
      },
      {
        key: 'width',
        type: 'meter',
        label: 'Breite',
        values: [],
      },
      {
        key: 'width_effective',
        type: 'meter',
        label: 'Effektive Breite',
        values: [],
      },
      {
        key: 'width_source',
        type: 'string',
        label: 'Quelle Breite',
        purpose: 'qa',
        values: [
          {
            value: 'ALKIS',
            label: 'Aus ALKIS Daten ausgemessen',
          },
          {
            value: 'ARCore',
            label: 'Mit dem Handy-Metermaß von StreetComplete gemessen',
          },
        ],
      },
      {
        key: 'oneway',
        type: 'string',
        label: 'Verkehrsrichtung',
        values: [
          {
            value: 'yes',
            label: 'Eine Richtung',
          },
          {
            value: 'no',
            label: 'Beide Richtungen',
          },
          {
            value: 'car_not_bike',
            label: 'Beide Richtungen für Fahrrad; Einbahnstraße für Kfz',
          },
          {
            value: 'assumed_no',
            label: 'Wahrscheinlich beide Richtungen',
            description:
              'Keine explizite OSM-Angabe zur Verkehrsrichtung vorhanden. Aus Führungsform und Umfeld wird hier beide Richtungen als wahrscheinlich angenommen.',
          },
          {
            value: 'implicit_yes',
            label: 'Eine Richtung (abgeleitet)',
            description:
              'Keine explizite OSM-Angabe (`oneway` / `oneway:bicycle`). Aus der Führungsform abgeleitet (z. B. Schutzstreifen), nicht aus einem oneway-Tag gelesen.',
          },
        ],
      },
      {
        key: 'bridge',
        type: 'string',
        label: 'Brücke',
        values: [
          {
            value: 'yes',
            label: 'Ja',
          },
        ],
      },
      {
        key: 'tunnel',
        type: 'string',
        label: 'Tunnel',
        values: [
          {
            value: 'yes',
            label: 'Ja',
          },
        ],
      },
      {
        key: 'surface_color',
        type: 'string',
        label: 'Ober&shy;flächen&shy;farbe',
        values: [
          {
            value: 'red',
            label: 'Rot',
          },
          {
            value: 'green',
            label: 'Grün',
          },
          {
            value: 'red;green',
            label: 'Rot und Grün',
          },
          {
            value: 'no',
            label: 'Keine besondere Farbe',
          },
        ],
      },
      {
        key: 'separation_left',
        type: 'string',
        label: 'Abgrenzung (Links)',
        values: [
          {
            value: 'no',
            label: 'Keine physische Abgrenzung',
          },
          {
            value: 'bollard',
            label: 'Poller',
          },
          {
            value: 'flex_post',
            label: 'Flexpfosten',
          },
          {
            value: 'vertical_panel',
            label: 'Vertikales Panel',
          },
          {
            value: 'studs',
            label: 'Bodenmarkierungsnägel',
          },
          {
            value: 'bump',
            label: 'Bodenschwelle',
          },
          {
            value: 'planter',
            label: 'Pflanzkübel',
          },
          {
            value: 'kerb',
            label: 'Bordstein',
          },
          {
            value: 'fence',
            label: 'Zaun',
          },
          {
            value: 'jersey_barrier',
            label: 'Betonleitwand',
          },
          {
            value: 'guard_rail',
            label: 'Leitplanke',
          },
          {
            value: 'structure',
            label: 'Struktur',
          },
          {
            value: 'ditch',
            label: 'Graben',
          },
          {
            value: 'greenery',
            label: 'Begrünung',
          },
          {
            value: 'hedge',
            label: 'Hecke',
          },
          {
            value: 'tree_row',
            label: 'Baumreihe',
          },
          {
            value: 'cone',
            label: 'Kegel',
          },
          {
            value: 'kerb;parking_lane',
            label: 'Bordstein, dann Parkstreifen',
          },
          {
            value: 'kerb;bollard',
            label: 'Bordstein, dann Poller',
          },
          {
            value: 'yes',
            label: 'Unspezifische Abgrenzung',
          },
        ],
      },
      {
        key: 'separation_right',
        type: 'string',
        label: 'Abgrenzung (Rechts)',
        values: [
          {
            value: 'no',
            label: 'Keine physische Abgrenzung',
          },
          {
            value: 'bollard',
            label: 'Poller',
          },
          {
            value: 'flex_post',
            label: 'Flexpfosten',
          },
          {
            value: 'vertical_panel',
            label: 'Vertikales Panel',
          },
          {
            value: 'studs',
            label: 'Bodenmarkierungsnägel',
          },
          {
            value: 'bump',
            label: 'Bodenschwelle',
          },
          {
            value: 'planter',
            label: 'Pflanzkübel',
          },
          {
            value: 'kerb',
            label: 'Bordstein',
          },
          {
            value: 'fence',
            label: 'Zaun',
          },
          {
            value: 'jersey_barrier',
            label: 'Betonleitwand',
          },
          {
            value: 'guard_rail',
            label: 'Leitplanke',
          },
          {
            value: 'structure',
            label: 'Struktur',
          },
          {
            value: 'ditch',
            label: 'Graben',
          },
          {
            value: 'greenery',
            label: 'Begrünung',
          },
          {
            value: 'hedge',
            label: 'Hecke',
          },
          {
            value: 'tree_row',
            label: 'Baumreihe',
          },
          {
            value: 'cone',
            label: 'Kegel',
          },
          {
            value: 'kerb;parking_lane',
            label: 'Bordstein, dann Parkstreifen',
          },
          {
            value: 'kerb;bollard',
            label: 'Bordstein, dann Poller',
          },
          {
            value: 'yes',
            label: 'Unspezifische Abgrenzung',
          },
        ],
      },
      {
        key: 'marking_left',
        type: 'string',
        label: 'Markierung (Links)',
        values: [
          {
            value: 'solid_line',
            label: 'Durchgezogene Linie',
          },
          {
            value: 'dashed_line',
            label: 'Gestrichelte Linie',
          },
          {
            value: 'double_solid_line',
            label: 'Doppelte durchgezogene Linie',
          },
          {
            value: 'barred_area',
            label: 'Schraffur',
          },
          {
            value: 'pictogram',
            label: 'Piktogramm',
          },
          {
            value: 'surface',
            label: 'Oberfläche',
          },
        ],
      },
      {
        key: 'marking_right',
        type: 'string',
        label: 'Markierung (Rechts)',
        values: [
          {
            value: 'solid_line',
            label: 'Durchgezogene Linie',
          },
          {
            value: 'dashed_line',
            label: 'Gestrichelte Linie',
          },
          {
            value: 'double_solid_line',
            label: 'Doppelte durchgezogene Linie',
          },
          {
            value: 'barred_area',
            label: 'Schraffur',
          },
          {
            value: 'pictogram',
            label: 'Piktogramm',
          },
          {
            value: 'surface',
            label: 'Oberfläche',
          },
        ],
      },
      {
        key: 'buffer_left',
        type: 'meter',
        label: 'Schutzraum (Links)',
        values: [],
      },
      {
        key: 'buffer_right',
        type: 'meter',
        label: 'Schutzraum (Rechts)',
        values: [],
      },
      {
        key: 'traffic_mode_left',
        type: 'string',
        label: 'Verkehrsform (Links)',
        values: [
          {
            value: 'bicycle',
            label: 'Fahrrad',
          },
          {
            value: 'foot',
            label: 'Fußgänger',
          },
          {
            value: 'motor_vehicle',
            label: 'Kraftfahrzeuge',
          },
          {
            value: 'no',
            label: 'Kein Verkehr',
          },
          {
            value: 'parking',
            label: 'Parken',
          },
          {
            value: 'psv',
            label: 'ÖPNV (Bus/Tram)',
          },
        ],
      },
      {
        key: 'traffic_mode_right',
        type: 'string',
        label: 'Verkehrsform (Rechts)',
        values: [
          {
            value: 'bicycle',
            label: 'Fahrrad',
          },
          {
            value: 'foot',
            label: 'Fußgänger',
          },
          {
            value: 'motor_vehicle',
            label: 'Kraftfahrzeuge',
          },
          {
            value: 'no',
            label: 'Kein Verkehr',
          },
          {
            value: 'parking',
            label: 'Parken',
          },
          {
            value: 'psv',
            label: 'ÖPNV (Bus/Tram)',
          },
        ],
      },
      {
        key: 'mapillary_coverage',
        type: 'string',
        label: 'Mapillary-Abdeckung',
        description:
          'Basiert auf einer Analyse der Mapillary-Foto-Sequenzen der letzten ca. 2 Jahre, die mit den OSM-Wegen verschnitten wurden. Mehr unter https://tilda-geo.de/docs/mapillary-coverage',
        values: [
          {
            value: 'regular',
            label: 'Standard-Aufnahmen',
          },
          {
            value: 'pano',
            label: 'Panorama-Aufnahmen',
          },
        ],
      },
      {
        key: 'mapillary',
        type: 'sanitized_strings',
        label: 'Straßenfotos (Mapillary)',
        description:
          'Mapillary-Bild-IDs (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_forward',
        type: 'sanitized_strings',
        label: 'Mapillary in Linienrichtung',
        description:
          'Mapillary-Bild-IDs in Linienrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_backward',
        type: 'sanitized_strings',
        label: 'Mapillary gegen Linienrichtung',
        description:
          'Mapillary-Bild-IDs in Gegenrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_traffic_sign',
        type: 'sanitized_strings',
        label: 'Mapillary für Verkehrszeichen',
        description:
          'Mapillary-Bild-IDs für Verkehrszeichen (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'description',
        type: 'sanitized_strings',
        label: 'Hinweis aus OSM',
        values: [],
      },
      {
        key: 'operator_type',
        type: 'string',
        label: 'Betreibertyp',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'public',
            label: 'Öffentlich',
          },
        ],
      },
      {
        key: 'informal',
        type: 'string',
        label: 'Trampelpfad',
        values: [
          {
            value: 'yes',
            label: 'Weg als informeller Weg erfasst',
          },
        ],
      },
      {
        key: 'covered',
        type: 'string',
        label: 'Überdacht',
        values: [
          {
            value: 'covered',
            label: 'Überdacht',
          },
          {
            value: 'partial',
            label: 'Teilweise überdacht',
          },
          {
            value: 'indoor',
            label: 'In einem Gebäude',
          },
        ],
      },
      {
        key: 'offset',
        type: 'meter',
        label: 'Linien-Offset',
        purpose: 'processing',
        description:
          'Seitlicher Versatz der Liniengeometrie in Metern. Der Wert wird im Processing aus der halben Straßenbreite berechnet; positive Werte liegen links der Referenzlinie, negative rechts.',
        values: [],
      },
      {
        key: 'surface',
        type: 'string',
        label: 'Oberfläche',
        values: [
          {
            value: 'asphalt',
            label: 'Asphalt',
          },
          {
            value: 'paved',
            label: 'Befestigt (unspezifisch)',
          },
          {
            value: 'unpaved',
            label: 'Unbefestigt',
          },
          {
            value: 'concrete',
            label: 'Beton',
          },
          {
            value: 'concrete:plates',
            label: 'Betonplatten',
          },
          {
            value: 'concrete:lanes',
            label: 'Betonstreifen / -bahnen',
          },
          {
            value: 'paving_stones',
            label: 'Verbund&shy;pflastersteine',
          },
          {
            value: 'paving_stones:lanes',
            label: 'Pflasterstein&shy;bahnen',
          },
          {
            value: 'sett',
            label: 'Behauenes Pflaster / Natursteinpflaster',
          },
          {
            value: 'mosaic_sett',
            label: 'Mosaikpflaster',
          },
          {
            value: 'small_sett',
            label: 'Kleinpflaster',
          },
          {
            value: 'large_sett',
            label: 'Großpflaster',
          },
          {
            value: 'bricks',
            label: 'Ziegel',
          },
          {
            value: 'stone',
            label: 'Stein',
          },
          {
            value: 'ground',
            label: 'Erde/Boden',
          },
          {
            value: 'grass',
            label: 'Gras',
          },
          {
            value: 'sand',
            label: 'Sand',
          },
          {
            value: 'compacted',
            label: 'Verdichteter Untergrund',
          },
          {
            value: 'fine_gravel',
            label: 'Splitt',
          },
          {
            value: 'gravel',
            label: 'Schotter',
          },
          {
            value: 'pebblestone',
            label: 'Kieselsteine',
          },
          {
            value: 'wood',
            label: 'Holz',
          },
          {
            value: 'woodchips',
            label: 'Hackschnitzel',
          },
          {
            value: 'metal',
            label: 'Metall',
          },
          {
            value: 'metal_grid',
            label: 'Metallgitter',
          },
          {
            value: 'plastic',
            label: 'Kunststoff',
          },
          {
            value: 'rubber',
            label: 'Gummi',
          },
          {
            value: 'grass_paver',
            label: 'Rasengitter / Grasgitter',
          },
        ],
      },
      {
        key: 'surface_source',
        type: 'string',
        label: 'Herkunft der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM',
          },
          {
            value: 'tag_transformed',
            label: 'Aus OSM-Tag normalisiert',
          },
          {
            value: 'parent_highway_tag',
            label: 'Von zugeordneter Straße (OSM)',
          },
          {
            value: 'parent_highway_tag_transformed',
            label: 'Von zugeordneter Straße, normalisiert',
          },
        ],
      },
      {
        key: 'surface_confidence',
        type: 'string',
        label: 'Konfidenz der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'smoothness',
        type: 'string',
        label: 'Ober&shy;flächen&shy;qualität',
        values: [
          {
            value: 'excellent',
            label: 'Sehr gut',
          },
          {
            value: 'good',
            label: 'Gut',
          },
          {
            value: 'intermediate',
            label: 'Mittel gut',
          },
          {
            value: 'bad',
            label: 'Schlecht',
          },
          {
            value: 'very_bad',
            label: 'Sehr schlecht',
          },
        ],
      },
      {
        key: 'smoothness_source',
        type: 'string',
        label: 'Herkunft der Ober&shy;flächen&shy;qualität',
        purpose: 'qa',
        values: [
          {
            value: 'tag',
            label: 'OSM-Tag `smoothness`',
          },
          {
            value: 'tag_normalized',
            label: 'OSM-Tag `smoothness` (normalisiert)',
          },
          {
            value: 'surface_to_smoothness',
            label: 'Abgeleitet von `surface`',
          },
          {
            value: 'tracktype_to_smoothness',
            label: 'Abgeleitet von `tracktype`',
          },
          {
            value: 'mtb:scale_to_smoothness',
            label: 'Abgeleitet von `mtb:scale`',
          },
          {
            value: 'parent_highway_tag',
            label: 'Von zugeordneter Straße (OSM)',
          },
          {
            value: 'parent_highway_tag_normalized',
            label: 'Von zugeordneter Straße (normalisiert)',
          },
          {
            value: 'parent_highway_surface_to_smoothness',
            label: 'Von Oberfläche der zugeordneten Straße abgeleitet',
          },
          {
            value: 'parent_highway_tracktype_to_smoothness',
            label: 'Von `tracktype` der zugeordneten Straße abgeleitet',
          },
          {
            value: 'parent_highway_mtb:scale_to_smoothness',
            label: 'Von `mtb:scale` der zugeordneten Straße abgeleitet',
          },
        ],
      },
      {
        key: 'smoothness_confidence',
        type: 'string',
        label: 'Konfidenz Ober&shy;flächen&shy;qualität',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
        ],
      },
      {
        key: 'traffic_sign',
        type: 'sanitized_strings',
        label: 'Beschilderung',
        values: [
          {
            value: 'never',
            label: 'Kein Verkehrszeichen erwartet',
            description:
              'Wird aktuell intern für `category=cyclewayOnHighwayBetweenLanes` verwendet um klarzustellen, dass hier nie ein Verkehrszeichen zu erwarten ist.',
          },
          {
            value: 'none',
            label: 'Unbeschildert',
          },
        ],
      },
      {
        key: 'traffic_sign:forward',
        type: 'sanitized_strings',
        label: 'Beschilderung in Verkehrsrichtung',
        values: [
          {
            value: 'never',
            label: 'Kein Verkehrszeichen erwartet',
            description:
              'Wird aktuell intern für `category=cyclewayOnHighwayBetweenLanes` verwendet um klarzustellen, dass hier nie ein Verkehrszeichen zu erwarten ist.',
          },
          {
            value: 'none',
            label: 'Unbeschildert',
          },
        ],
      },
      {
        key: 'traffic_sign:backward',
        type: 'sanitized_strings',
        label: 'Beschilderung in Gegenrichtung',
        values: [
          {
            value: 'never',
            label: 'Kein Verkehrszeichen erwartet',
            description:
              'Wird aktuell intern für `category=cyclewayOnHighwayBetweenLanes` verwendet um klarzustellen, dass hier nie ein Verkehrszeichen zu erwarten ist.',
          },
          {
            value: 'none',
            label: 'Unbeschildert',
          },
        ],
      },
      {
        key: 'todos',
        type: 'sanitized_strings',
        label: 'Todo-Liste',
        purpose: 'qa',
        values: [],
      },
      {
        key: '_in_settlement_area',
        type: 'ignore',
        label: '_in_settlement_area',
        purpose: 'processing',
        values: [],
      },
    ],
    chapters: [
      {
        id: 'versetzte-geometrien',
        title: 'Versetzte Geometrien',
        markdown:
          'Die Geometrien für Radinfrastruktur, die von der Straßen-Mittellinie abgeleitet werden (siehe Hinweise „Transformierte Geometrie“ im Inspektor in der Kartenansicht), werden als Teil der Prozessierung nach links und rechts versetzt. Dafür verwenden wir die Breite der Straße als Referenz.\n\n**HINWEIS:** Wir planen dieses Feature in der Zukunft umzubauen. Dann werden die Daten eine Eigenschaft haben, aus der der empfohlene Versatz hervorgeht, so dass man sie im Kartenstil visuell versetzen kann, aber sie in den Daten auf der Mittellinie bleiben.\n',
      },
    ],
  },
  bikelanesPresence: {
    topic: 'roads_bikelanes',
    tableName: 'bikelanesPresence',
    sourceIds: ['atlas_bikelanesPresence'],
    title: 'Daten zu Radinfrastruktur an Straßen',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'bikelane_left',
        type: 'string',
        label: 'Radinfrastruktur links',
        values: [
          {
            value: 'bicycleRoad',
            label: 'Fahrradstraße',
          },
          {
            value: 'bicycleRoad_vehicleDestination',
            label: 'Fahrradstraße mit Anlieger/Kfz frei',
          },
          {
            value: 'crossing',
            label: 'Straßenquerung',
          },
          {
            value: 'cycleway_adjoining',
            label: 'Radweg (straßenbegleitend)',
          },
          {
            value: 'cycleway_adjoiningOrIsolated',
            label: 'Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway_isolated',
            label: 'Radweg, selbstständig geführt',
          },
          {
            value: 'cyclewayLink',
            label: 'Radweg-Verbindungsstück',
          },
          {
            value: 'cyclewayOnHighway_advisory',
            label: 'Schutzstreifen',
          },
          {
            value: 'cyclewayOnHighway_advisoryOrExclusive',
            label: 'Radfahrstreifen oder Schutzstreifen (Kategorisierung unklar)',
          },
          {
            value: 'cyclewayOnHighway_exclusive',
            label: 'Radfahrstreifen',
          },
          {
            value: 'cyclewayOnHighwayBetweenLanes',
            label: 'Radfahrstreifen in Mittellage (Fahrradweiche)',
          },
          {
            value: 'cyclewayOnHighwayProtected',
            label: 'Geschützter Radfahrstreifen (PBL)',
          },
          {
            value: 'footAndCyclewaySegregated_adjoining',
            label: 'Getrennter Rad- und Gehweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewaySegregated_adjoiningOrIsolated',
            label:
              'Getrennter Rad- und Gehweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewaySegregated_isolated',
            label: 'Getrennter Rad- und Gehweg, selbstständig geführt',
          },
          {
            value: 'footAndCyclewayShared_adjoining',
            label: 'Gemeinsamer Geh- und Radweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewayShared_adjoiningOrIsolated',
            label:
              'Gemeinsamer Geh- und Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewayShared_isolated',
            label: 'Gemeinsamer Geh- und Radweg, selbstständig geführt',
          },
          {
            value: 'footwayBicycleYes_adjoining',
            label: 'Gehweg mit Radfahrer frei, straßenbegleitend',
          },
          {
            value: 'footwayBicycleYes_adjoiningOrIsolated',
            label:
              'Gehweg mit Radfahrer frei (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footwayBicycleYes_isolated',
            label: 'Gehweg mit Radfahrer frei, selbstständig geführt',
          },
          {
            value: 'livingStreet',
            label: 'Verkehrsberuhigter Bereich (Spielstraße)',
          },
          {
            value: 'pedestrianAreaBicycleYes',
            label: 'Fußgängerzone, Fahrrad frei',
          },
          {
            value: 'separate_geometry',
            label: 'RVA als separate Geometrie erfasst',
          },
          {
            value: 'sharedBusLaneBikeWithBus',
            label: 'Radfahrstreifen mit Freigabe Busverkehr',
          },
          {
            value: 'sharedBusLaneBusWithBike',
            label: 'Bussonderfahrstreifen mit Fahrrad frei',
          },
          {
            value: 'sharedMotorVehicleLane',
            label: 'Gemeinsamer Fahrstreifen',
          },
          {
            value: 'needsClarification',
            label: 'Führungsform unklar',
          },
          {
            value: 'data_no',
            label: 'Vollständig (explizit keine)',
          },
          {
            value: 'not_expected',
            label: 'Keine Infrastruktur erwartet',
          },
          {
            value: 'assumed_no',
            label: 'Vermutlich vollständig',
          },
          {
            value: 'missing',
            label: 'Unvollständig',
          },
        ],
      },
      {
        key: 'bikelane_self',
        type: 'string',
        label: 'Radinfrastruktur mittig',
        values: [
          {
            value: 'bicycleRoad',
            label: 'Fahrradstraße',
          },
          {
            value: 'bicycleRoad_vehicleDestination',
            label: 'Fahrradstraße mit Anlieger/Kfz frei',
          },
          {
            value: 'crossing',
            label: 'Straßenquerung',
          },
          {
            value: 'cycleway_adjoining',
            label: 'Radweg (straßenbegleitend)',
          },
          {
            value: 'cycleway_adjoiningOrIsolated',
            label: 'Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway_isolated',
            label: 'Radweg, selbstständig geführt',
          },
          {
            value: 'cyclewayLink',
            label: 'Radweg-Verbindungsstück',
          },
          {
            value: 'cyclewayOnHighway_advisory',
            label: 'Schutzstreifen',
          },
          {
            value: 'cyclewayOnHighway_advisoryOrExclusive',
            label: 'Radfahrstreifen oder Schutzstreifen (Kategorisierung unklar)',
          },
          {
            value: 'cyclewayOnHighway_exclusive',
            label: 'Radfahrstreifen',
          },
          {
            value: 'cyclewayOnHighwayBetweenLanes',
            label: 'Radfahrstreifen in Mittellage (Fahrradweiche)',
          },
          {
            value: 'cyclewayOnHighwayProtected',
            label: 'Geschützter Radfahrstreifen (PBL)',
          },
          {
            value: 'footAndCyclewaySegregated_adjoining',
            label: 'Getrennter Rad- und Gehweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewaySegregated_adjoiningOrIsolated',
            label:
              'Getrennter Rad- und Gehweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewaySegregated_isolated',
            label: 'Getrennter Rad- und Gehweg, selbstständig geführt',
          },
          {
            value: 'footAndCyclewayShared_adjoining',
            label: 'Gemeinsamer Geh- und Radweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewayShared_adjoiningOrIsolated',
            label:
              'Gemeinsamer Geh- und Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewayShared_isolated',
            label: 'Gemeinsamer Geh- und Radweg, selbstständig geführt',
          },
          {
            value: 'footwayBicycleYes_adjoining',
            label: 'Gehweg mit Radfahrer frei, straßenbegleitend',
          },
          {
            value: 'footwayBicycleYes_adjoiningOrIsolated',
            label:
              'Gehweg mit Radfahrer frei (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footwayBicycleYes_isolated',
            label: 'Gehweg mit Radfahrer frei, selbstständig geführt',
          },
          {
            value: 'livingStreet',
            label: 'Verkehrsberuhigter Bereich (Spielstraße)',
          },
          {
            value: 'pedestrianAreaBicycleYes',
            label: 'Fußgängerzone, Fahrrad frei',
          },
          {
            value: 'separate_geometry',
            label: 'RVA als separate Geometrie erfasst',
          },
          {
            value: 'sharedBusLaneBikeWithBus',
            label: 'Radfahrstreifen mit Freigabe Busverkehr',
          },
          {
            value: 'sharedBusLaneBusWithBike',
            label: 'Bussonderfahrstreifen mit Fahrrad frei',
          },
          {
            value: 'sharedMotorVehicleLane',
            label: 'Gemeinsamer Fahrstreifen',
          },
          {
            value: 'needsClarification',
            label: 'Führungsform unklar',
          },
          {
            value: 'data_no',
            label: 'Vollständig (explizit keine)',
          },
          {
            value: 'not_expected',
            label: 'Keine Infrastruktur erwartet',
          },
          {
            value: 'assumed_no',
            label: 'Vermutlich vollständig',
          },
          {
            value: 'missing',
            label: 'Unvollständig',
          },
        ],
      },
      {
        key: 'bikelane_right',
        type: 'string',
        label: 'Radinfrastruktur rechts',
        values: [
          {
            value: 'bicycleRoad',
            label: 'Fahrradstraße',
          },
          {
            value: 'bicycleRoad_vehicleDestination',
            label: 'Fahrradstraße mit Anlieger/Kfz frei',
          },
          {
            value: 'crossing',
            label: 'Straßenquerung',
          },
          {
            value: 'cycleway_adjoining',
            label: 'Radweg (straßenbegleitend)',
          },
          {
            value: 'cycleway_adjoiningOrIsolated',
            label: 'Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway_isolated',
            label: 'Radweg, selbstständig geführt',
          },
          {
            value: 'cyclewayLink',
            label: 'Radweg-Verbindungsstück',
          },
          {
            value: 'cyclewayOnHighway_advisory',
            label: 'Schutzstreifen',
          },
          {
            value: 'cyclewayOnHighway_advisoryOrExclusive',
            label: 'Radfahrstreifen oder Schutzstreifen (Kategorisierung unklar)',
          },
          {
            value: 'cyclewayOnHighway_exclusive',
            label: 'Radfahrstreifen',
          },
          {
            value: 'cyclewayOnHighwayBetweenLanes',
            label: 'Radfahrstreifen in Mittellage (Fahrradweiche)',
          },
          {
            value: 'cyclewayOnHighwayProtected',
            label: 'Geschützter Radfahrstreifen (PBL)',
          },
          {
            value: 'footAndCyclewaySegregated_adjoining',
            label: 'Getrennter Rad- und Gehweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewaySegregated_adjoiningOrIsolated',
            label:
              'Getrennter Rad- und Gehweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewaySegregated_isolated',
            label: 'Getrennter Rad- und Gehweg, selbstständig geführt',
          },
          {
            value: 'footAndCyclewayShared_adjoining',
            label: 'Gemeinsamer Geh- und Radweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewayShared_adjoiningOrIsolated',
            label:
              'Gemeinsamer Geh- und Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewayShared_isolated',
            label: 'Gemeinsamer Geh- und Radweg, selbstständig geführt',
          },
          {
            value: 'footwayBicycleYes_adjoining',
            label: 'Gehweg mit Radfahrer frei, straßenbegleitend',
          },
          {
            value: 'footwayBicycleYes_adjoiningOrIsolated',
            label:
              'Gehweg mit Radfahrer frei (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footwayBicycleYes_isolated',
            label: 'Gehweg mit Radfahrer frei, selbstständig geführt',
          },
          {
            value: 'livingStreet',
            label: 'Verkehrsberuhigter Bereich (Spielstraße)',
          },
          {
            value: 'pedestrianAreaBicycleYes',
            label: 'Fußgängerzone, Fahrrad frei',
          },
          {
            value: 'separate_geometry',
            label: 'RVA als separate Geometrie erfasst',
          },
          {
            value: 'sharedBusLaneBikeWithBus',
            label: 'Radfahrstreifen mit Freigabe Busverkehr',
          },
          {
            value: 'sharedBusLaneBusWithBike',
            label: 'Bussonderfahrstreifen mit Fahrrad frei',
          },
          {
            value: 'sharedMotorVehicleLane',
            label: 'Gemeinsamer Fahrstreifen',
          },
          {
            value: 'needsClarification',
            label: 'Führungsform unklar',
          },
          {
            value: 'data_no',
            label: 'Vollständig (explizit keine)',
          },
          {
            value: 'not_expected',
            label: 'Keine Infrastruktur erwartet',
          },
          {
            value: 'assumed_no',
            label: 'Vermutlich vollständig',
          },
          {
            value: 'missing',
            label: 'Unvollständig',
          },
        ],
      },
    ],
    chapters: [
      {
        id: 'versetzte-geometrien',
        title: 'Versetzte Geometrien',
        markdown:
          'Die Geometrien für Radinfrastruktur, die von der Straßen-Mittellinie abgeleitet werden (siehe Hinweise „Transformierte Geometrie“ im Inspektor in der Kartenansicht), werden als Teil der Prozessierung nach links und rechts versetzt. Dafür verwenden wir die Breite der Straße als Referenz.\n\n**HINWEIS:** Wir planen dieses Feature in der Zukunft umzubauen. Dann werden die Daten eine Eigenschaft haben, aus der der empfohlene Versatz hervorgeht, so dass man sie im Kartenstil visuell versetzen kann, aber sie in den Daten auf der Mittellinie bleiben.\n',
      },
    ],
  },
  bikeroutes: {
    topic: 'bikeroutes',
    tableName: 'bikeroutes',
    sourceIds: ['atlas_bikeroutes'],
    title: 'Fahrradrouten',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'distance',
        type: 'kilometer',
        label: 'Angabe Gesamtlänge',
        values: [],
      },
      {
        key: 'network',
        type: 'string',
        label: 'Netzwerkhierarchie',
        values: [
          {
            value: 'lcn',
            label: 'Lokale Radverkehrsnetze (`lcn`)',
          },
          {
            value: 'rcn',
            label: 'Regionale Radverkehrsnetze (`rcn`)',
          },
          {
            value: 'ncn',
            label: 'Nationales Radverkehrsnetz (`ncn`)',
          },
          {
            value: 'icn',
            label: 'Internationales Radverkehrsnetz (`icn`)',
          },
        ],
      },
      {
        key: 'cycle_highway',
        type: 'string',
        label: 'Radschnellverbindung',
        values: [
          {
            value: 'yes',
            label: 'Diese Route repräsentiert eine RSV.',
          },
        ],
      },
      {
        key: 'roundtrip',
        type: 'string',
        label: 'Rundfahrt',
        values: [
          {
            value: 'yes',
            label: 'Ja',
          },
          {
            value: 'no',
            label: 'Nein',
          },
        ],
      },
      {
        key: 'network_type',
        type: 'string',
        label: 'Netzwerkart',
        values: [
          {
            value: 'basic_network',
            label: 'Start-Ziel Route',
          },
          {
            value: 'node_network',
            label: 'Teil eines Knotennetzwerks',
          },
        ],
      },
      {
        key: 'cycle_network_key',
        type: 'sanitized_strings',
        label: 'Netzwerk-Schlüssel',
        values: [],
      },
      {
        key: 'symbol_description',
        type: 'sanitized_strings',
        label: 'Symbolbeschreibung',
        values: [],
      },
      {
        key: 'route_description',
        type: 'sanitized_strings',
        label: 'Freitext zur Route',
        values: [],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
      {
        key: 'ref',
        type: 'sanitized_strings',
        label: 'Referenz',
        values: [],
      },
      {
        key: 'operator',
        type: 'sanitized_strings',
        label: 'Betreiber/Baulastträger',
        values: [],
      },
      {
        key: 'website',
        type: 'sanitized_strings',
        label: 'Website',
        values: [],
      },
      {
        key: 'wikipedia',
        type: 'sanitized_strings',
        label: 'Wikipedia',
        values: [],
      },
      {
        key: 'colours',
        type: 'sanitized_strings',
        label: 'Farben',
        description: 'Offizielle Farbe/Farben der Route',
        values: [],
      },
    ],
    chapters: [],
  },
  bikeSuitability: {
    topic: 'roads_bikelanes',
    tableName: 'bikeSuitability',
    sourceIds: ['atlas_bikeSuitability'],
    title: 'Radeignung',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'bikeSuitability',
        type: 'string',
        label: 'Eignung des Weges für Radverkehr, Radnetze und Radrouten',
        values: [
          {
            value: 'goodSurface',
            label: 'Potentiell geeignet aufgrund einer guten Oberfläche',
          },
          {
            value: 'livingStreet',
            label: 'Geeignet durch verkehrsberuhigten Bereich',
          },
          {
            value: 'noMotorizedVehicle',
            label: 'Potentiell geeignet aufgrund des Verbots von Kfz',
          },
          {
            value: 'noOvertaking',
            label: 'Potentiell geeignet aufgrund Verkehrszeichen 277.1',
          },
        ],
      },
      {
        key: 'road',
        type: 'string',
        label: 'Straßentyp',
        values: [
          {
            value: 'bicycle_road',
            label: 'Fahrradstraße',
          },
          {
            value: 'construction',
            label: 'Straße ist in Bau',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway',
            label: 'Radweg',
          },
          {
            value: 'footway_cycleway_crossing',
            label: 'Straßenquerung (Fußverkehr)',
          },
          {
            value: 'footway_sidewalk',
            label: 'Gehweg',
          },
          {
            value: 'footway',
            label: 'Fußweg',
          },
          {
            value: 'living_street',
            label: 'Verkehrsberuhigter Bereich',
          },
          {
            value: 'motorway_link',
            label: 'Zufahrt einer Autobahn',
          },
          {
            value: 'motorway',
            label: 'Autobahn',
          },
          {
            value: 'path',
            label: 'Weg / Pfad',
          },
          {
            value: 'pedestrian',
            label: 'Fußgängerzone',
          },
          {
            value: 'primary_link',
            label: 'Zufahrt einer Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'primary',
            label: 'Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'residential',
            label: 'Anwohnerstraße',
          },
          {
            value: 'residential_priority_road',
            label: 'residential_priority_road',
          },
          {
            value: 'secondary_link',
            label: 'Zufahrt einer Landes&shy;straße/wichtigen Durchgangs&shy;straße',
          },
          {
            value: 'secondary',
            label: 'Landes&shy;straße/Wichtige Durchgangs&shy;straße',
          },
          {
            value: 'service_alley',
            label: 'Gasse',
          },
          {
            value: 'service_driveway',
            label: 'Grundstückszufahrt',
          },
          {
            value: 'service_emergency_access',
            label: 'Rettungsweg',
          },
          {
            value: 'service_parking_aisle',
            label: 'Parkplatzweg',
          },
          {
            value: 'service_road',
            label: 'Zufahrtsweg',
          },
          {
            value: 'service_uncategorized',
            label: 'Zufahrtsweg (unbekannte Klassifizierung)',
          },
          {
            value: 'service',
            label: 'Zufahrtsweg',
          },
          {
            value: 'steps',
            label: 'Stufen',
          },
          {
            value: 'tertiary_link',
            label: 'Zufahrt einer Kreis&shy;straße/untergeordneten Durchgangs&shy;straße',
          },
          {
            value: 'tertiary',
            label: 'Kreis&shy;straße/Untergeordnete Durchgangs&shy;straße',
          },
          {
            value: 'track',
            label: 'Wald- / Feldweg',
          },
          {
            value: 'unclassified',
            label: 'Nebenstraße mit Verbindungscharakter',
          },
          {
            value: 'unspecified_road',
            label: 'Unkategorisierte Straße',
          },
        ],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
      {
        key: 'length',
        type: 'meter',
        label: 'Länge',
        description:
          'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
        values: [],
      },
      {
        key: 'lifecycle',
        type: 'string',
        label: 'Status',
        values: [
          {
            value: 'blocked',
            label: 'Gesperrt (Sperrung)',
          },
          {
            value: 'construction',
            label: 'In Bau',
          },
          {
            value: 'construction_no_access',
            label: 'Gesperrt aufgrund einer Baustelle',
          },
          {
            value: 'temporary',
            label: 'Temporärer Weg',
          },
        ],
      },
      {
        key: 'mapillary_coverage',
        type: 'string',
        label: 'Mapillary-Abdeckung',
        description:
          'Basiert auf einer Analyse der Mapillary-Foto-Sequenzen der letzten ca. 2 Jahre, die mit den OSM-Wegen verschnitten wurden. Mehr unter https://tilda-geo.de/docs/mapillary-coverage',
        values: [
          {
            value: 'regular',
            label: 'Standard-Aufnahmen',
          },
          {
            value: 'pano',
            label: 'Panorama-Aufnahmen',
          },
        ],
      },
      {
        key: 'mapillary',
        type: 'sanitized_strings',
        label: 'Straßenfotos (Mapillary)',
        description:
          'Mapillary-Bild-IDs (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_forward',
        type: 'sanitized_strings',
        label: 'Mapillary in Linienrichtung',
        description:
          'Mapillary-Bild-IDs in Linienrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_backward',
        type: 'sanitized_strings',
        label: 'Mapillary gegen Linienrichtung',
        description:
          'Mapillary-Bild-IDs in Gegenrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_traffic_sign',
        type: 'sanitized_strings',
        label: 'Mapillary für Verkehrszeichen',
        description:
          'Mapillary-Bild-IDs für Verkehrszeichen (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'traffic_sign',
        type: 'sanitized_strings',
        label: 'Beschilderung',
        values: [
          {
            value: 'none',
            label: 'Unbeschildert',
          },
        ],
      },
      {
        key: 'description',
        type: 'sanitized_strings',
        label: 'Hinweis aus OSM',
        values: [],
      },
      {
        key: 'operator_type',
        type: 'string',
        label: 'Betreibertyp',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'public',
            label: 'Öffentlich',
          },
        ],
      },
      {
        key: 'informal',
        type: 'string',
        label: 'Trampelpfad',
        values: [
          {
            value: 'yes',
            label: 'Weg als informeller Weg erfasst',
          },
        ],
      },
      {
        key: 'covered',
        type: 'string',
        label: 'Überdacht',
        values: [
          {
            value: 'covered',
            label: 'Überdacht',
          },
          {
            value: 'partial',
            label: 'Teilweise überdacht',
          },
          {
            value: 'indoor',
            label: 'In einem Gebäude',
          },
        ],
      },
      {
        key: 'surface',
        type: 'string',
        label: 'Oberfläche',
        values: [
          {
            value: 'asphalt',
            label: 'Asphalt',
          },
          {
            value: 'paved',
            label: 'Befestigt (unspezifisch)',
          },
          {
            value: 'unpaved',
            label: 'Unbefestigt',
          },
          {
            value: 'concrete',
            label: 'Beton',
          },
          {
            value: 'concrete:plates',
            label: 'Betonplatten',
          },
          {
            value: 'concrete:lanes',
            label: 'Betonstreifen / -bahnen',
          },
          {
            value: 'paving_stones',
            label: 'Verbund&shy;pflastersteine',
          },
          {
            value: 'paving_stones:lanes',
            label: 'Pflasterstein&shy;bahnen',
          },
          {
            value: 'sett',
            label: 'Behauenes Pflaster / Natursteinpflaster',
          },
          {
            value: 'mosaic_sett',
            label: 'Mosaikpflaster',
          },
          {
            value: 'small_sett',
            label: 'Kleinpflaster',
          },
          {
            value: 'large_sett',
            label: 'Großpflaster',
          },
          {
            value: 'bricks',
            label: 'Ziegel',
          },
          {
            value: 'stone',
            label: 'Stein',
          },
          {
            value: 'ground',
            label: 'Erde/Boden',
          },
          {
            value: 'grass',
            label: 'Gras',
          },
          {
            value: 'sand',
            label: 'Sand',
          },
          {
            value: 'compacted',
            label: 'Verdichteter Untergrund',
          },
          {
            value: 'fine_gravel',
            label: 'Splitt',
          },
          {
            value: 'gravel',
            label: 'Schotter',
          },
          {
            value: 'pebblestone',
            label: 'Kieselsteine',
          },
          {
            value: 'wood',
            label: 'Holz',
          },
          {
            value: 'woodchips',
            label: 'Hackschnitzel',
          },
          {
            value: 'metal',
            label: 'Metall',
          },
          {
            value: 'metal_grid',
            label: 'Metallgitter',
          },
          {
            value: 'plastic',
            label: 'Kunststoff',
          },
          {
            value: 'rubber',
            label: 'Gummi',
          },
          {
            value: 'grass_paver',
            label: 'Rasengitter / Grasgitter',
          },
        ],
      },
      {
        key: 'smoothness',
        type: 'string',
        label: 'Ober&shy;flächen&shy;qualität',
        values: [
          {
            value: 'excellent',
            label: 'Sehr gut',
          },
          {
            value: 'good',
            label: 'Gut',
          },
          {
            value: 'intermediate',
            label: 'Mittel gut',
          },
          {
            value: 'bad',
            label: 'Schlecht',
          },
          {
            value: 'very_bad',
            label: 'Sehr schlecht',
          },
        ],
      },
    ],
    chapters: [
      {
        id: 'versetzte-geometrien',
        title: 'Versetzte Geometrien',
        markdown:
          'Die Geometrien für Radinfrastruktur, die von der Straßen-Mittellinie abgeleitet werden (siehe Hinweise „Transformierte Geometrie“ im Inspektor in der Kartenansicht), werden als Teil der Prozessierung nach links und rechts versetzt. Dafür verwenden wir die Breite der Straße als Referenz.\n\n**HINWEIS:** Wir planen dieses Feature in der Zukunft umzubauen. Dann werden die Daten eine Eigenschaft haben, aus der der empfohlene Versatz hervorgeht, so dass man sie im Kartenstil visuell versetzen kann, aber sie in den Daten auf der Mittellinie bleiben.\n',
      },
    ],
  },
  boundaries: {
    topic: 'boundaries',
    tableName: 'boundaries',
    sourceIds: ['atlas_boundaries'],
    title: 'Grenzen',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'admin_level',
        type: 'number',
        label: 'Grenzen Level',
        values: [
          {
            value: '7',
            label: 'Level 7 — Meistens Verwaltungsgemeinschaft, Amt',
          },
          {
            value: '8',
            label: 'Level 8 — Meistens (Kreisangehörige) Gemeinde / Stadt',
          },
        ],
      },
      {
        key: 'population',
        type: 'population_label',
        label: 'Bevölkerung',
        values: [],
      },
      {
        key: 'population_date',
        type: 'date',
        label: 'Bevölkerungsstand',
        values: [],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
      {
        key: 'name_prefix',
        type: 'sanitized_strings',
        label: 'Namenspräfix',
        values: [],
      },
      {
        key: 'wikidata',
        type: 'sanitized_strings',
        label: 'Wikidata',
        values: [],
      },
      {
        key: 'wikipedia',
        type: 'sanitized_strings',
        label: 'Wikipedia',
        values: [],
      },
      {
        key: 'regionalschluessel',
        type: 'sanitized_strings',
        label: 'Regionalschlüssel',
        values: [],
      },
      {
        key: 'category_municipality',
        type: 'string',
        label: 'Gemeindekategorie',
        values: [],
      },
      {
        key: 'category_district',
        type: 'string',
        label: 'Kreiskategorie',
        values: [],
      },
    ],
    chapters: [],
  },
  landuse: {
    topic: 'landuse',
    tableName: 'landuse',
    sourceIds: ['atlas_landuse'],
    title: 'Daten zur Landnutzung',
    summary: 'Eine vereinfachte Darstellung der Landnutzung zur Unterstützung der Radnetzplanung.',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'landuse',
        type: 'string',
        label: 'Landnutzung',
        description:
          'Enthält die zugelassenen `landuse`-Werte sowie ausgewählte `amenity`- und `leisure`-Flächen, die im Processing auf den `landuse`-Schlüssel normalisiert werden.',
        values: [
          {
            value: 'allotments',
            label: 'Kleingartenanlage',
          },
          {
            value: 'brownfield',
            label: 'Brachfläche',
          },
          {
            value: 'cemetery',
            label: 'Friedhofsgelände',
          },
          {
            value: 'civic',
            label: 'Fläche für öffentliche Einrichtungen',
          },
          {
            value: 'civic_admin',
            label: 'Verwaltungsfläche',
          },
          {
            value: 'commercial',
            label: 'Gewerbliche Nutzung',
          },
          {
            value: 'construction',
            label: 'Baufläche (im Bau)',
          },
          {
            value: 'education',
            label: 'Bildungsfläche',
          },
          {
            value: 'farmyard',
            label: 'Landwirtschaftliche Nutzung',
          },
          {
            value: 'garages',
            label: 'Garagen',
          },
          {
            value: 'industrial',
            label: 'Industrielle Nutzung',
          },
          {
            value: 'religious',
            label: 'Religiöse Nutzung',
          },
          {
            value: 'residential',
            label: 'Wohngebiet',
          },
          {
            value: 'retail',
            label: 'Gewerbliche Nutzung (Einzelhandel/Geschäfte)',
          },
          {
            value: 'school',
            label: 'Schulgelände',
          },
          {
            value: 'university',
            label: 'Universitätsgelände',
          },
          {
            value: 'kindergarten',
            label: 'Kindertagesstätte',
          },
          {
            value: 'college',
            label: 'Hochschul-/College-Gelände',
          },
          {
            value: 'hospital',
            label: 'Krankenhausgelände',
          },
          {
            value: 'clinic',
            label: 'Klinikgelände',
          },
          {
            value: 'prison',
            label: 'Justizvollzugsanstalt',
          },
          {
            value: 'park',
            label: 'Park',
          },
          {
            value: 'garden',
            label: 'Garten',
          },
          {
            value: 'dog_park',
            label: 'Hundeauslaufgebiet',
          },
          {
            value: 'sports_centre',
            label: 'Sportzentrum',
          },
          {
            value: 'stadium',
            label: 'Stadion',
          },
        ],
      },
      {
        key: 'access',
        type: 'string',
        label: 'Zugang',
        values: [
          {
            value: 'yes',
            label: 'Öffentlich',
          },
          {
            value: 'customers',
            label: 'Kund:innen',
          },
          {
            value: 'permissive',
            label: 'Öffentliche Nutzung geduldet',
          },
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'public',
            label: 'Öffentlich (explizit)',
          },
          {
            value: 'no',
            label: 'Kein Zugang',
          },
        ],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
      {
        key: 'operator',
        type: 'sanitized_strings',
        label: 'Betreiber',
        values: [],
      },
    ],
    chapters: [],
  },
  off_street_parking_areas: {
    topic: 'parking',
    tableName: 'off_street_parking_areas',
    sourceIds: ['tilda_parkings_off_street'],
    title: 'Parken abseits des Straßenraums',
    summary:
      'Parkraum abseits des Straßenraums wie Flächenparkplätze, (Tief-)Garagen und Parkhäuser mit Kapazitätsangaben.',
    groups: [
      {
        id: 'parking',
        label: 'Parkraum-Prozessierung',
      },
    ],
    attributes: [
      {
        key: 'category',
        type: 'string',
        label: 'Kategorie',
        description: 'Kategorie der Parkmöglichkeit.',
        values: [
          {
            value: 'outside',
            label: 'Außenparkplatz',
          },
          {
            value: 'garage',
            label: 'Garage',
          },
          {
            value: 'underground',
            label: 'Tiefgarage',
          },
          {
            value: 'carport',
            label: 'Carport',
          },
          {
            value: 'multi-storey',
            label: 'Parkhaus',
          },
        ],
      },
      {
        key: 'parking',
        type: 'string',
        label: 'Parkplatztyp',
        description: 'Typ der Parkmöglichkeit.',
        values: [
          {
            value: 'surface',
            label: 'Oberflächenparkplatz',
          },
          {
            value: 'underground',
            label: 'Tiefgarage',
          },
          {
            value: 'multi-storey',
            label: 'Parkhaus',
          },
          {
            value: 'rooftop',
            label: 'Dachparkplatz',
          },
          {
            value: 'carport',
            label: 'Carport',
          },
          {
            value: 'carports',
            label: 'Carports',
          },
          {
            value: 'garage_boxes',
            label: 'Garagenboxen',
          },
          {
            value: 'garage',
            label: 'Garage',
          },
        ],
      },
      {
        key: 'amenity',
        type: 'string',
        label: 'Einrichtung',
        values: [
          {
            value: 'parking',
            label: 'Parkplatz',
          },
        ],
      },
      {
        key: 'capacity',
        type: 'number',
        label: 'Stellplatzanzahl',
        description: 'Geschätzte oder explizit erfasste Anzahl von Stellplätzen.',
        chapterRefs: ['capacity-calculation'],
        values: [],
      },
      {
        key: 'capacity_source',
        type: 'string',
        label: 'Herkunft der Stellplatzanzahl',
        purpose: 'qa',
        description: 'Herkunft der Stellplatzanzahl inklusive Schätz- oder Umverteilungslogik.',
        chapterRefs: ['capacity-calculation'],
        values: [
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM.',
          },
          {
            value: 'tag_estimation',
            label: 'Explizite Angabe einer Schätzung aus OSM.',
          },
          {
            value: 'tag_redistributed',
            label: 'Explizite Angabe aus OSM, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'tag_estimation_redistributed',
            label:
              'Explizite Angabe einer Schätzung aus OSM, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_parallel',
            label: 'Berechnet auf Basis der Fläche und Parkausrichtung.',
          },
          {
            value: 'area_and_orientation_perpendicular',
            label: 'Berechnet auf Basis der Fläche und Parkausrichtung.',
          },
          {
            value: 'area_and_orientation_diagonal',
            label: 'Berechnet auf Basis der Fläche und Parkausrichtung.',
          },
          {
            value: 'area_and_orientation_parallel_redistributed',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_perpendicular_redistributed',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_diagonal_redistributed',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_fallback_parallel',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung. Allerdings war die Parkausrichtung unbekannt, so dass Parallelparken angenommen wurde.',
          },
          {
            value: 'estimated_from_length',
            label: 'Berechnet auf Basis der Linien-Länge und Ausrichtung.',
          },
          {
            value: 'estimated_from_area',
            label: 'Berechnet auf Basis der Fläche und Ausrichtung.',
          },
          {
            value: 'estimated',
            label: 'Berechnung',
          },
          {
            value: 'estimated_redistributed',
            label: 'Geschätzt, Kapazität umverteilt',
          },
          {
            value: 'assumed_default',
            label: 'Keine explizite Angabe vorgefunden; dieser Wert ist eine Annahme.',
          },
          {
            value: 'area',
            label: 'Berechnet auf Basis der Fläche.',
          },
        ],
      },
      {
        key: 'condition_category',
        type: 'string',
        label: 'Parkbeschränkung',
        chapterRefs: ['condition-category'],
        values: [
          {
            value: 'access_restriction',
            label: 'Zugangsbeschränkung',
          },
          {
            value: 'assumed_free',
            label: 'Wahrscheinlich keine Parkbeschränkungen',
          },
          {
            value: 'assumed_private',
            label: 'Sehr wahrscheinlich privat',
          },
          {
            value: 'bus_lane',
            label: 'Bussonderfahrstreifen',
          },
          {
            value: 'car_sharing',
            label: 'Nur für Carsharing-Fahrzeuge',
          },
          {
            value: 'charging',
            label: 'Laden von Elektrofahrzeugen',
          },
          {
            value: 'disabled',
            label: 'Behindertenparkplatz',
          },
          {
            value: 'disabled_private',
            label: 'Personenbezogener Behindertenparkplatz',
          },
          {
            value: 'free',
            label: 'Keine Parkbeschränkungen',
          },
          {
            value: 'loading',
            label: 'Ladezone',
          },
          {
            value: 'maxweight',
            label: 'Gewichtsbegrenzung',
          },
          {
            value: 'mixed',
            label: 'Nur mit Parkschein oder Bewohnerparkausweis',
          },
          {
            value: 'no_parking',
            label: 'Eingeschränktes Haltverbot',
          },
          {
            value: 'no_standing',
            label: 'Nur kurzes Halten erlaubt',
          },
          {
            value: 'no_stopping',
            label: 'Absolutes Haltverbot',
          },
          {
            value: 'paid',
            label: 'Nur mit Parkschein',
          },
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'residents',
            label: 'Nur mit Bewohnerparkausweis',
          },
          {
            value: 'taxi',
            label: 'Taxenstand',
          },
          {
            value: 'time_limited',
            label: 'Höchstparkdauer',
          },
          {
            value: 'unspecified',
            label: 'Unbestimmt',
          },
          {
            value: 'vehicle_restriction',
            label: 'Beschränkung auf Fahrzeugklassen',
          },
        ],
      },
      {
        key: 'access',
        type: 'string',
        label: 'Zugang',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'customers',
            label: 'Kund:innen',
          },
          {
            value: 'destination',
            label: 'Anlieger frei (Nicht-Durchgangsverkehr erlaubt)',
          },
          {
            value: 'employees',
            label: 'Mitarbeiter',
          },
          {
            value: 'permissive',
            label: 'Öffentliche Nutzung geduldet',
          },
          {
            value: 'public',
            label: 'Öffentlich (explizit)',
          },
          {
            value: 'delivery',
            label: 'Lieferverkehr',
          },
          {
            value: 'no',
            label: 'Kein Zugang',
          },
          {
            value: 'permit',
            label: 'Mit Genehmigung',
          },
          {
            value: 'residents',
            label: 'Nur mit Bewohnerparkausweis',
          },
        ],
      },
      {
        key: 'area',
        type: 'square_meter',
        label: 'Fläche',
        description: 'Fläche in Quadratmetern.',
        values: [],
      },
      {
        key: 'area_source',
        type: 'string',
        label: 'Herkunft der Flächenangabe',
        purpose: 'qa',
        values: [
          {
            value: 'estimated',
            label: 'Berechnet auf Basis der Länge der Liniengeometrie und Fahrzeugausrichtung.',
          },
          {
            value: 'geometry',
            label: 'Basiert auf dem Flächeninhalt der Geometrie aus OSM.',
          },
        ],
      },
      {
        key: 'area_confidence',
        type: 'string',
        label: 'Konfidenz der Flächenangabe',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'capacity_confidence',
        type: 'string',
        label: 'Konfidenz der Stellplatzanzahl',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'surface',
        type: 'string',
        label: 'Oberfläche',
        description: 'Oberflächenbelag des Parkraumabschnitts.',
        values: [
          {
            value: 'asphalt',
            label: 'Asphalt',
          },
          {
            value: 'paved',
            label: 'Befestigt (unspezifisch)',
          },
          {
            value: 'unpaved',
            label: 'Unbefestigt',
          },
          {
            value: 'concrete',
            label: 'Beton',
          },
          {
            value: 'concrete:plates',
            label: 'Betonplatten',
          },
          {
            value: 'concrete:lanes',
            label: 'Betonstreifen / -bahnen',
          },
          {
            value: 'paving_stones',
            label: 'Verbund&shy;pflastersteine',
          },
          {
            value: 'paving_stones:lanes',
            label: 'Pflasterstein&shy;bahnen',
          },
          {
            value: 'sett',
            label: 'Behauenes Pflaster / Natursteinpflaster',
          },
          {
            value: 'mosaic_sett',
            label: 'Mosaikpflaster',
          },
          {
            value: 'small_sett',
            label: 'Kleinpflaster',
          },
          {
            value: 'large_sett',
            label: 'Großpflaster',
          },
          {
            value: 'bricks',
            label: 'Ziegel',
          },
          {
            value: 'stone',
            label: 'Stein',
          },
          {
            value: 'ground',
            label: 'Erde/Boden',
          },
          {
            value: 'grass',
            label: 'Gras',
          },
          {
            value: 'sand',
            label: 'Sand',
          },
          {
            value: 'compacted',
            label: 'Verdichteter Untergrund',
          },
          {
            value: 'fine_gravel',
            label: 'Splitt',
          },
          {
            value: 'gravel',
            label: 'Schotter',
          },
          {
            value: 'pebblestone',
            label: 'Kieselsteine',
          },
          {
            value: 'wood',
            label: 'Holz',
          },
          {
            value: 'woodchips',
            label: 'Hackschnitzel',
          },
          {
            value: 'metal',
            label: 'Metall',
          },
          {
            value: 'metal_grid',
            label: 'Metallgitter',
          },
          {
            value: 'plastic',
            label: 'Kunststoff',
          },
          {
            value: 'rubber',
            label: 'Gummi',
          },
          {
            value: 'grass_paver',
            label: 'Rasengitter / Grasgitter',
          },
        ],
      },
      {
        key: 'surface_confidence',
        type: 'string',
        label: 'Konfidenz der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'surface_source',
        type: 'string',
        label: 'Herkunft der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM',
          },
          {
            value: 'tag_transformed',
            label: 'Aus OSM-Tag normalisiert',
          },
          {
            value: 'parent_highway_tag',
            label: 'Von zugeordneter Straße (OSM)',
          },
          {
            value: 'parent_highway_tag_transformed',
            label: 'Von zugeordneter Straße, normalisiert',
          },
        ],
      },
      {
        key: 'orientation',
        type: 'string',
        label: 'Ausrichtung',
        description: 'Ausrichtung der Fahrzeuge im Straßenland zur Verkehrsrichtung.',
        values: [
          {
            value: 'parallel',
            label: 'Parallelparken',
          },
          {
            value: 'perpendicular',
            label: 'Querparken',
          },
          {
            value: 'diagonal',
            label: 'Schrägparken',
          },
        ],
      },
      {
        key: 'location',
        type: 'string',
        label: 'Lage im Straßenraum',
        description: 'Besondere Lagemerkmale des Parkraums im Straßenland.',
        values: [
          {
            value: 'lane_centre',
            label: 'Fahrbahnmitte',
          },
          {
            value: 'median',
            label: 'Mittelstreifen',
          },
        ],
      },
      {
        key: 'markings',
        type: 'string',
        label: 'Markierungen',
        values: [
          {
            value: 'no',
            label: 'Ohne Markierungen',
          },
          {
            value: 'yes',
            label: 'Mit Markierungen',
          },
        ],
      },
      {
        key: 'covered',
        type: 'string',
        label: 'Überdacht',
        values: [
          {
            value: 'partial',
            label: 'Teilweise überdacht',
          },
          {
            value: 'yes',
            label: 'Überdacht',
          },
        ],
      },
      {
        key: 'informal',
        type: 'string',
        label: 'Duldung',
        values: [
          {
            value: 'yes',
            label: 'Parken im rechtlichen Graubereich oder etabliertes, geduldetes Falschparken.',
          },
        ],
      },
      {
        key: 'operator_type',
        type: 'string',
        label: 'Betreibertyp',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'public',
            label: 'Öffentlich',
          },
        ],
      },
      {
        key: 'operator_type_source',
        type: 'string',
        label: 'Herkunft des Betreibertyps',
        purpose: 'qa',
        values: [
          {
            value: 'default_fallback',
            label: 'Annahme bei fehlender Angabe.',
          },
          {
            value: 'driveway_inference',
            label: 'Annahme bei fehlender Angabe wenn eine Einfahrt erkannt wurde.',
          },
          {
            value: 'manual_overwrite_list',
            label: 'Anhand einer manuellen Korrekturliste in TILDA.',
          },
          {
            value: 'parent_highway_tag',
            label: 'Explizite Angabe aus OSM an der zugeordneten Straße.',
          },
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM.',
          },
        ],
      },
      {
        key: 'operator_type_confidence',
        type: 'string',
        label: 'Konfidenz des Betreibertyps',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'zone',
        type: 'sanitized_strings',
        label: 'Parkzone',
        description:
          'Parkzonennummer oder -bezeichnung entsprechend der lokalen Parkraumbewirtschaftung bei Stellplätzen, die nur mit einem entsprechenden Parkrausweis genutzt werden dürfen. Sind (insbesondere an Zonengrenzen) mehrere Parkzonen berechtigt, sind diese üblicherweise als semikolongetrennte Liste aufgeführt.',
        values: [],
      },
      {
        key: 'mapillary',
        type: 'sanitized_strings',
        label: 'Mapillary',
        description: 'Mapillary-Foto-ID für dieses Feature.',
        values: [],
      },
      {
        key: 'traffic_sign',
        type: 'sanitized_strings',
        label: 'Verkehrszeichen',
        description: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
        values: [],
      },
    ],
    chapters: [
      {
        id: 'capacity-calculation',
        title: 'Berechnung der Kapazität',
        markdown:
          'Kapazitätswerte stammen je nach Datenlage aus unterschiedlichen Quellen:\n\n- Direkte OSM-Tag-Angaben (`capacity`, inkl. Schätzungsvarianten)\n- Flächen- und ausrichtungsbasierte Schätzung\n- Längen- und ausrichtungsbasierte Schätzung\n- Konservative Standardannahmen bei fehlenden Angaben\n\nBei Segmenten mit alternierendem Parken wird die Kapazität reduziert, um realistische Manövrierverluste abzubilden.\n\nDie genaue Herleitung ist im Feld `capacity_source` nachvollziehbar dokumentiert.\n',
      },
      {
        id: 'condition-category',
        title: 'Parkbeschränkung',
        markdown:
          'Unter dem Wert "Parkbeschränkungen" (`condition_category`) wird eine Semikolon getrennte Liste ausgeliefert die verschiedene Parkbeschränkungen beschreibt.\n\nBeispiele:\n\n| Wert                                                      | Übersetzung                                                                       |\n| --------------------------------------------------------- | --------------------------------------------------------------------------------- |\n| `access_restriction (agricultural)`                       | Zugangsbeschränkung (Land-/Forstwirtschaftlicher Verkehr)                         |\n| `access_restriction (no, Tu 15:00-18:00)`                 | Zugangsbeschränkung (kein Zugang, Dienstag 15:00-18:00)                           |\n| `access_restriction (Mo-Fr 04:30-20:00, PH off)`          | Zugangsbeschränkung (Montag-Freitag 04:30-20:00, Feiertag ausgenommen)            |\n| `disabled (except emergency)`                             | Behindertenparkplatz (ausgenommen Einsatz-/Krankenfahrzeuge)                      |\n| `paid (stay > 1 hour)`                                    | Nur mit Parkschein (Parkdauer > 1 Stunde)                                         |\n| `time_limited (2 days)`                                   | Höchstparkdauer (2 Tage)                                                          |\n| `time_limited (4 hours) (08:00-18:00)`                    | Höchstparkdauer (4 Stunden) (08:00-18:00)                                         |\n| `vehicle_restriction (only motorcar, motorcycle)`         | Beschränkung auf Fahrzeugklassen (nur Pkw, Motorräder)                            |\n| `vehicle_restriction (only delivery) (Mo-Sa 07:00-20:00)` | Beschränkung auf Fahrzeugklassen (nur Lieferverkehr) (Montag-Samstag 07:00-20:00) |\n\nIn der TILDA Inspektor-Ansicht werden diese Werte übersetzt dargestellt. In der Attributtabelle sind sie aber nur beispielhaft in ihrer einfachsten Form angegeben. Ebenso kann die Masterportal-Übersetzungs-Tabelle dieser Werte leider nicht übersetzen.\n',
      },
    ],
  },
  off_street_parking_quantized: {
    topic: 'parking',
    tableName: 'off_street_parking_quantized',
    sourceIds: ['tilda_parkings_off_street_quantized'],
    title: 'Parken abseits des Straßenraums (quantisiert)',
    summary:
      'Punktförmige, quantisierte Ableitung aus `off_street_parking_areas` für rechnerische Auswertungen. Fachliche Übersetzungen werden über refs geteilt.',
    groups: [
      {
        id: 'parking',
        label: 'Parkraum-Prozessierung',
      },
    ],
    attributes: [
      {
        key: 'category',
        type: 'string',
        label: 'Kategorie',
        description: 'Kategorie der Parkmöglichkeit.',
        values: [
          {
            value: 'outside',
            label: 'Außenparkplatz',
          },
          {
            value: 'garage',
            label: 'Garage',
          },
          {
            value: 'underground',
            label: 'Tiefgarage',
          },
          {
            value: 'carport',
            label: 'Carport',
          },
          {
            value: 'multi-storey',
            label: 'Parkhaus',
          },
        ],
      },
      {
        key: 'parking',
        type: 'string',
        label: 'Parkplatztyp',
        description: 'Typ der Parkmöglichkeit.',
        values: [
          {
            value: 'surface',
            label: 'Oberflächenparkplatz',
          },
          {
            value: 'underground',
            label: 'Tiefgarage',
          },
          {
            value: 'multi-storey',
            label: 'Parkhaus',
          },
          {
            value: 'rooftop',
            label: 'Dachparkplatz',
          },
          {
            value: 'carport',
            label: 'Carport',
          },
          {
            value: 'carports',
            label: 'Carports',
          },
          {
            value: 'garage_boxes',
            label: 'Garagenboxen',
          },
          {
            value: 'garage',
            label: 'Garage',
          },
        ],
      },
      {
        key: 'amenity',
        type: 'string',
        label: 'Einrichtung',
        values: [
          {
            value: 'parking',
            label: 'Parkplatz',
          },
        ],
      },
      {
        key: 'capacity',
        type: 'number',
        label: 'Stellplatzanzahl',
        description: 'Geschätzte oder explizit erfasste Anzahl von Stellplätzen.',
        chapterRefs: ['capacity-calculation'],
        values: [],
      },
      {
        key: 'condition_category',
        type: 'string',
        label: 'Parkbeschränkung',
        chapterRefs: ['condition-category'],
        values: [
          {
            value: 'access_restriction',
            label: 'Zugangsbeschränkung',
          },
          {
            value: 'assumed_free',
            label: 'Wahrscheinlich keine Parkbeschränkungen',
          },
          {
            value: 'assumed_private',
            label: 'Sehr wahrscheinlich privat',
          },
          {
            value: 'bus_lane',
            label: 'Bussonderfahrstreifen',
          },
          {
            value: 'car_sharing',
            label: 'Nur für Carsharing-Fahrzeuge',
          },
          {
            value: 'charging',
            label: 'Laden von Elektrofahrzeugen',
          },
          {
            value: 'disabled',
            label: 'Behindertenparkplatz',
          },
          {
            value: 'disabled_private',
            label: 'Personenbezogener Behindertenparkplatz',
          },
          {
            value: 'free',
            label: 'Keine Parkbeschränkungen',
          },
          {
            value: 'loading',
            label: 'Ladezone',
          },
          {
            value: 'maxweight',
            label: 'Gewichtsbegrenzung',
          },
          {
            value: 'mixed',
            label: 'Nur mit Parkschein oder Bewohnerparkausweis',
          },
          {
            value: 'no_parking',
            label: 'Eingeschränktes Haltverbot',
          },
          {
            value: 'no_standing',
            label: 'Nur kurzes Halten erlaubt',
          },
          {
            value: 'no_stopping',
            label: 'Absolutes Haltverbot',
          },
          {
            value: 'paid',
            label: 'Nur mit Parkschein',
          },
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'residents',
            label: 'Nur mit Bewohnerparkausweis',
          },
          {
            value: 'taxi',
            label: 'Taxenstand',
          },
          {
            value: 'time_limited',
            label: 'Höchstparkdauer',
          },
          {
            value: 'unspecified',
            label: 'Unbestimmt',
          },
          {
            value: 'vehicle_restriction',
            label: 'Beschränkung auf Fahrzeugklassen',
          },
        ],
      },
      {
        key: 'access',
        type: 'string',
        label: 'Zugang',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'customers',
            label: 'Kund:innen',
          },
          {
            value: 'destination',
            label: 'Anlieger frei (Nicht-Durchgangsverkehr erlaubt)',
          },
          {
            value: 'employees',
            label: 'Mitarbeiter',
          },
          {
            value: 'permissive',
            label: 'Öffentliche Nutzung geduldet',
          },
          {
            value: 'public',
            label: 'Öffentlich (explizit)',
          },
          {
            value: 'delivery',
            label: 'Lieferverkehr',
          },
          {
            value: 'no',
            label: 'Kein Zugang',
          },
          {
            value: 'permit',
            label: 'Mit Genehmigung',
          },
          {
            value: 'residents',
            label: 'Nur mit Bewohnerparkausweis',
          },
        ],
      },
      {
        key: 'area',
        type: 'square_meter',
        label: 'Fläche',
        description: 'Fläche in Quadratmetern.',
        values: [],
      },
      {
        key: 'surface',
        type: 'string',
        label: 'Oberfläche',
        description: 'Oberflächenbelag des Parkraumabschnitts.',
        values: [
          {
            value: 'asphalt',
            label: 'Asphalt',
          },
          {
            value: 'paved',
            label: 'Befestigt (unspezifisch)',
          },
          {
            value: 'unpaved',
            label: 'Unbefestigt',
          },
          {
            value: 'concrete',
            label: 'Beton',
          },
          {
            value: 'concrete:plates',
            label: 'Betonplatten',
          },
          {
            value: 'concrete:lanes',
            label: 'Betonstreifen / -bahnen',
          },
          {
            value: 'paving_stones',
            label: 'Verbund&shy;pflastersteine',
          },
          {
            value: 'paving_stones:lanes',
            label: 'Pflasterstein&shy;bahnen',
          },
          {
            value: 'sett',
            label: 'Behauenes Pflaster / Natursteinpflaster',
          },
          {
            value: 'mosaic_sett',
            label: 'Mosaikpflaster',
          },
          {
            value: 'small_sett',
            label: 'Kleinpflaster',
          },
          {
            value: 'large_sett',
            label: 'Großpflaster',
          },
          {
            value: 'bricks',
            label: 'Ziegel',
          },
          {
            value: 'stone',
            label: 'Stein',
          },
          {
            value: 'ground',
            label: 'Erde/Boden',
          },
          {
            value: 'grass',
            label: 'Gras',
          },
          {
            value: 'sand',
            label: 'Sand',
          },
          {
            value: 'compacted',
            label: 'Verdichteter Untergrund',
          },
          {
            value: 'fine_gravel',
            label: 'Splitt',
          },
          {
            value: 'gravel',
            label: 'Schotter',
          },
          {
            value: 'pebblestone',
            label: 'Kieselsteine',
          },
          {
            value: 'wood',
            label: 'Holz',
          },
          {
            value: 'woodchips',
            label: 'Hackschnitzel',
          },
          {
            value: 'metal',
            label: 'Metall',
          },
          {
            value: 'metal_grid',
            label: 'Metallgitter',
          },
          {
            value: 'plastic',
            label: 'Kunststoff',
          },
          {
            value: 'rubber',
            label: 'Gummi',
          },
          {
            value: 'grass_paver',
            label: 'Rasengitter / Grasgitter',
          },
        ],
      },
      {
        key: 'orientation',
        type: 'string',
        label: 'Ausrichtung',
        description: 'Ausrichtung der Fahrzeuge im Straßenland zur Verkehrsrichtung.',
        values: [
          {
            value: 'parallel',
            label: 'Parallelparken',
          },
          {
            value: 'perpendicular',
            label: 'Querparken',
          },
          {
            value: 'diagonal',
            label: 'Schrägparken',
          },
        ],
      },
      {
        key: 'location',
        type: 'string',
        label: 'Lage im Straßenraum',
        description: 'Besondere Lagemerkmale des Parkraums im Straßenland.',
        values: [
          {
            value: 'lane_centre',
            label: 'Fahrbahnmitte',
          },
          {
            value: 'median',
            label: 'Mittelstreifen',
          },
        ],
      },
      {
        key: 'markings',
        type: 'string',
        label: 'Markierungen',
        values: [
          {
            value: 'no',
            label: 'Ohne Markierungen',
          },
          {
            value: 'yes',
            label: 'Mit Markierungen',
          },
        ],
      },
      {
        key: 'covered',
        type: 'string',
        label: 'Überdacht',
        values: [
          {
            value: 'partial',
            label: 'Teilweise überdacht',
          },
          {
            value: 'yes',
            label: 'Überdacht',
          },
        ],
      },
      {
        key: 'informal',
        type: 'string',
        label: 'Duldung',
        values: [
          {
            value: 'yes',
            label: 'Parken im rechtlichen Graubereich oder etabliertes, geduldetes Falschparken.',
          },
        ],
      },
      {
        key: 'operator_type',
        type: 'string',
        label: 'Betreibertyp',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'public',
            label: 'Öffentlich',
          },
        ],
      },
      {
        key: 'operator_type_source',
        type: 'string',
        label: 'Herkunft des Betreibertyps',
        purpose: 'qa',
        values: [
          {
            value: 'default_fallback',
            label: 'Annahme bei fehlender Angabe.',
          },
          {
            value: 'driveway_inference',
            label: 'Annahme bei fehlender Angabe wenn eine Einfahrt erkannt wurde.',
          },
          {
            value: 'manual_overwrite_list',
            label: 'Anhand einer manuellen Korrekturliste in TILDA.',
          },
          {
            value: 'parent_highway_tag',
            label: 'Explizite Angabe aus OSM an der zugeordneten Straße.',
          },
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM.',
          },
        ],
      },
      {
        key: 'operator_type_confidence',
        type: 'string',
        label: 'Konfidenz des Betreibertyps',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'zone',
        type: 'sanitized_strings',
        label: 'Parkzone',
        description:
          'Parkzonennummer oder -bezeichnung entsprechend der lokalen Parkraumbewirtschaftung bei Stellplätzen, die nur mit einem entsprechenden Parkrausweis genutzt werden dürfen. Sind (insbesondere an Zonengrenzen) mehrere Parkzonen berechtigt, sind diese üblicherweise als semikolongetrennte Liste aufgeführt.',
        values: [],
      },
      {
        key: 'mapillary',
        type: 'sanitized_strings',
        label: 'Mapillary',
        description: 'Mapillary-Foto-ID für dieses Feature.',
        values: [],
      },
      {
        key: 'traffic_sign',
        type: 'sanitized_strings',
        label: 'Verkehrszeichen',
        description: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
        values: [],
      },
    ],
    chapters: [
      {
        id: 'capacity-calculation',
        title: 'Berechnung der Kapazität',
        markdown:
          'Kapazitätswerte stammen je nach Datenlage aus unterschiedlichen Quellen:\n\n- Direkte OSM-Tag-Angaben (`capacity`, inkl. Schätzungsvarianten)\n- Flächen- und ausrichtungsbasierte Schätzung\n- Längen- und ausrichtungsbasierte Schätzung\n- Konservative Standardannahmen bei fehlenden Angaben\n\nBei Segmenten mit alternierendem Parken wird die Kapazität reduziert, um realistische Manövrierverluste abzubilden.\n\nDie genaue Herleitung ist im Feld `capacity_source` nachvollziehbar dokumentiert.\n',
      },
      {
        id: 'condition-category',
        title: 'Parkbeschränkung',
        markdown:
          'Unter dem Wert "Parkbeschränkungen" (`condition_category`) wird eine Semikolon getrennte Liste ausgeliefert die verschiedene Parkbeschränkungen beschreibt.\n\nBeispiele:\n\n| Wert                                                      | Übersetzung                                                                       |\n| --------------------------------------------------------- | --------------------------------------------------------------------------------- |\n| `access_restriction (agricultural)`                       | Zugangsbeschränkung (Land-/Forstwirtschaftlicher Verkehr)                         |\n| `access_restriction (no, Tu 15:00-18:00)`                 | Zugangsbeschränkung (kein Zugang, Dienstag 15:00-18:00)                           |\n| `access_restriction (Mo-Fr 04:30-20:00, PH off)`          | Zugangsbeschränkung (Montag-Freitag 04:30-20:00, Feiertag ausgenommen)            |\n| `disabled (except emergency)`                             | Behindertenparkplatz (ausgenommen Einsatz-/Krankenfahrzeuge)                      |\n| `paid (stay > 1 hour)`                                    | Nur mit Parkschein (Parkdauer > 1 Stunde)                                         |\n| `time_limited (2 days)`                                   | Höchstparkdauer (2 Tage)                                                          |\n| `time_limited (4 hours) (08:00-18:00)`                    | Höchstparkdauer (4 Stunden) (08:00-18:00)                                         |\n| `vehicle_restriction (only motorcar, motorcycle)`         | Beschränkung auf Fahrzeugklassen (nur Pkw, Motorräder)                            |\n| `vehicle_restriction (only delivery) (Mo-Sa 07:00-20:00)` | Beschränkung auf Fahrzeugklassen (nur Lieferverkehr) (Montag-Samstag 07:00-20:00) |\n\nIn der TILDA Inspektor-Ansicht werden diese Werte übersetzt dargestellt. In der Attributtabelle sind sie aber nur beispielhaft in ihrer einfachsten Form angegeben. Ebenso kann die Masterportal-Übersetzungs-Tabelle dieser Werte leider nicht übersetzen.\n',
      },
    ],
  },
  parkings: {
    topic: 'parking',
    tableName: 'parkings',
    sourceIds: ['tilda_parkings'],
    title: 'Straßenparken',
    summary:
      'Die Haupttabelle für straßenseitiges Parken in Form von Liniengeometrien. Die Geometrien sind von Straßenabschnitten sowie separat erfassten Straßenparken-Geometrien aus OpenStreetMap abgeleitet.',
    groups: [
      {
        id: 'parking',
        label: 'Parkraum-Prozessierung',
      },
    ],
    attributes: [
      {
        key: 'parking',
        type: 'string',
        label: 'Parkposition',
        description: 'Lage oder Art des Parkraums im Straßenland.',
        values: [
          {
            value: 'lane',
            label: 'Auf der Fahrbahn',
          },
          {
            value: 'half_on_kerb',
            label: 'Halb auf dem Gehweg',
          },
          {
            value: 'on_kerb',
            label: 'Ganz auf dem Gehweg',
          },
          {
            value: 'no_parking',
            label: 'Eingeschränktes Haltverbot',
          },
          {
            value: 'no_stopping',
            label: 'Absolutes Haltverbot',
          },
          {
            value: 'separate',
            label: 'Parkraum als separate Geometrie erfasst',
          },
          {
            value: 'shoulder',
            label: 'Auf dem Seitenstreifen',
          },
          {
            value: 'street_side',
            label: 'Parkbucht',
          },
          {
            value: 'yes',
            label: 'Nicht näher bestimmtes Straßenparken',
          },
          {
            value: 'no',
            label: 'Kein Parken (Sonstiger/Unbekannter Grund)',
          },
          {
            value: 'no_standing',
            label: 'Nur kurzes Halten erlaubt',
          },
          {
            value: 'missing',
            label: 'Daten in OSM fehlen',
          },
          {
            value: 'not_expected',
            label: 'Kein Parken zu erwarten',
          },
        ],
      },
      {
        key: 'capacity',
        type: 'number',
        label: 'Stellplatzanzahl',
        description: 'Geschätzte oder explizit erfasste Anzahl von Stellplätzen.',
        chapterRefs: ['capacity-calculation'],
        values: [],
      },
      {
        key: 'capacity_source',
        type: 'string',
        label: 'Herkunft der Stellplatzanzahl',
        purpose: 'qa',
        description: 'Herkunft der Stellplatzanzahl inklusive Schätz- oder Umverteilungslogik.',
        chapterRefs: ['capacity-calculation'],
        values: [
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM.',
          },
          {
            value: 'tag_estimation',
            label: 'Explizite Angabe einer Schätzung aus OSM.',
          },
          {
            value: 'tag_redistributed',
            label: 'Explizite Angabe aus OSM, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'tag_estimation_redistributed',
            label:
              'Explizite Angabe einer Schätzung aus OSM, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_parallel',
            label: 'Berechnet auf Basis der Fläche und Parkausrichtung.',
          },
          {
            value: 'area_and_orientation_perpendicular',
            label: 'Berechnet auf Basis der Fläche und Parkausrichtung.',
          },
          {
            value: 'area_and_orientation_diagonal',
            label: 'Berechnet auf Basis der Fläche und Parkausrichtung.',
          },
          {
            value: 'area_and_orientation_parallel_redistributed',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_perpendicular_redistributed',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_diagonal_redistributed',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_fallback_parallel',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung. Allerdings war die Parkausrichtung unbekannt, so dass Parallelparken angenommen wurde.',
          },
          {
            value: 'estimated_from_length',
            label: 'Berechnet auf Basis der Linien-Länge und Ausrichtung.',
          },
          {
            value: 'estimated_from_area',
            label: 'Berechnet auf Basis der Fläche und Ausrichtung.',
          },
          {
            value: 'estimated',
            label: 'Berechnung',
          },
          {
            value: 'estimated_redistributed',
            label: 'Geschätzt, Kapazität umverteilt',
          },
          {
            value: 'assumed_default',
            label: 'Keine explizite Angabe vorgefunden; dieser Wert ist eine Annahme.',
          },
        ],
      },
      {
        key: 'orientation',
        type: 'string',
        label: 'Ausrichtung',
        description: 'Ausrichtung der Fahrzeuge im Straßenland zur Verkehrsrichtung.',
        values: [
          {
            value: 'parallel',
            label: 'Parallelparken',
          },
          {
            value: 'perpendicular',
            label: 'Querparken',
          },
          {
            value: 'diagonal',
            label: 'Schrägparken',
          },
        ],
      },
      {
        key: 'condition_category',
        type: 'string',
        label: 'Parkbeschränkung',
        chapterRefs: ['condition-category'],
        values: [
          {
            value: 'access_restriction',
            label: 'Zugangsbeschränkung',
          },
          {
            value: 'assumed_free',
            label: 'Wahrscheinlich keine Parkbeschränkungen',
          },
          {
            value: 'assumed_private',
            label: 'Sehr wahrscheinlich privat',
          },
          {
            value: 'bus_lane',
            label: 'Bussonderfahrstreifen',
          },
          {
            value: 'car_sharing',
            label: 'Nur für Carsharing-Fahrzeuge',
          },
          {
            value: 'charging',
            label: 'Laden von Elektrofahrzeugen',
          },
          {
            value: 'disabled',
            label: 'Behindertenparkplatz',
          },
          {
            value: 'disabled_private',
            label: 'Personenbezogener Behindertenparkplatz',
          },
          {
            value: 'free',
            label: 'Keine Parkbeschränkungen',
          },
          {
            value: 'loading',
            label: 'Ladezone',
          },
          {
            value: 'maxweight',
            label: 'Gewichtsbegrenzung',
          },
          {
            value: 'mixed',
            label: 'Nur mit Parkschein oder Bewohnerparkausweis',
          },
          {
            value: 'no_parking',
            label: 'Eingeschränktes Haltverbot',
          },
          {
            value: 'no_standing',
            label: 'Nur kurzes Halten erlaubt',
          },
          {
            value: 'no_stopping',
            label: 'Absolutes Haltverbot',
          },
          {
            value: 'paid',
            label: 'Nur mit Parkschein',
          },
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'residents',
            label: 'Nur mit Bewohnerparkausweis',
          },
          {
            value: 'taxi',
            label: 'Taxenstand',
          },
          {
            value: 'time_limited',
            label: 'Höchstparkdauer',
          },
          {
            value: 'unspecified',
            label: 'Unbestimmt',
          },
          {
            value: 'vehicle_restriction',
            label: 'Beschränkung auf Fahrzeugklassen',
          },
        ],
      },
      {
        key: 'staggered',
        type: 'string',
        label: 'Parkweise',
        description:
          'Besondere Merkmale zur Parkweise, insbesondere bei alternierendem/versetztem Parken auf Fahrbahnen, die zu schmal sind um auf beiden Seiten gleichzeitig zu parken, keine Markierungen und Beschilderungen aufweisen, die das Parken regeln und auf denen gewöhnlich wechselseitig abschnittsweise auf der einen oder anderen Straßenseite geparkt wird oder geparkt werden kann.',
        values: [
          {
            value: 'yes',
            label: 'Alternierendes Parken',
            description:
              'Auf diesem Abschnitt ist die Fahrbahn zu schmal, um auf beiden Seiten gleichzeitig zu parken. Es gibt keine Markierungen oder Schilder, die das Parken regeln. Häufig entwickeln sich örtliche Konventionen, in welchen Bereichen auf welcher Seite geparkt wird. In die Kapazitätsberechnung fließt das ein: Die Kapazität wird um 50% reduziert (da nur eine Seite genutzt werden kann) und zusätzlich wird für jeden 60m-Abschnitt ein Manövrierraumverlust von 10m (≈1,9 Fahrzeugplätze) abgezogen, da beim Seitenwechsel Manövrierraum benötigt wird. Diese Angaben basieren auf Erfahrungswerten und können lediglich eine Schätzung des tatsächlichen Parkgeschehens abbilden.',
            chapterRefs: ['capacity-calculation'],
          },
          {
            value: 'no',
            label: 'Nicht alternierend',
          },
        ],
      },
      {
        key: 'length',
        type: 'meter',
        label: 'Länge',
        description:
          'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
        values: [],
      },
      {
        key: 'category',
        type: 'string',
        label: 'Kategorie',
        values: [
          {
            value: 'bus_stop',
            label: 'Bushaltestelle',
          },
          {
            value: 'tree',
            label: 'Baum',
          },
          {
            value: 'crossing_marked',
            label: 'Markierter Überweg',
          },
        ],
      },
      {
        key: 'source',
        type: 'string',
        label: 'Datenquelle',
        description: 'Datenquelle der Parkraumgeometrie aus OpenStreetMap.',
        values: [
          {
            value: 'parkings',
            label: 'Angaben an der Straßenlinie',
          },
          {
            value: 'separate_parking_areas',
            label: 'Separat erfasste Flächendaten',
          },
          {
            value: 'separate_parking_points',
            label: 'Separate erfasste Punktdaten',
          },
        ],
      },
      {
        key: 'geom_sources',
        type: 'sanitized_strings',
        label: '(Intern) OSM-IDs der Geometiren',
        purpose: 'qa',
        description:
          'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs die für eine Geometrie verwendeten wurden.',
        values: [],
      },
      {
        key: 'tag_sources',
        type: 'sanitized_strings',
        label: 'Tag-Quellen',
        purpose: 'qa',
        description:
          'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs aus denen die OSM-Tags abgeleitet wurden.',
        values: [],
      },
      {
        key: 'road',
        type: 'string',
        label: 'Straßentyp',
        description: 'Art der Straße, an dem der Parkraum liegt.',
        values: [
          {
            value: 'bicycle_road',
            label: 'Fahrradstraße',
          },
          {
            value: 'construction',
            label: 'Straße ist in Bau',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway',
            label: 'Radweg',
          },
          {
            value: 'footway_cycleway_crossing',
            label: 'Straßenquerung (Fußverkehr)',
          },
          {
            value: 'footway_sidewalk',
            label: 'Gehweg',
          },
          {
            value: 'footway',
            label: 'Fußweg',
          },
          {
            value: 'living_street',
            label: 'Verkehrsberuhigter Bereich',
          },
          {
            value: 'motorway_link',
            label: 'Zufahrt einer Autobahn',
          },
          {
            value: 'motorway',
            label: 'Autobahn',
          },
          {
            value: 'path',
            label: 'Weg / Pfad',
          },
          {
            value: 'pedestrian',
            label: 'Fußgängerzone',
          },
          {
            value: 'primary_link',
            label: 'Zufahrt einer Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'primary',
            label: 'Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'residential',
            label: 'Anwohnerstraße',
          },
          {
            value: 'residential_priority_road',
            label: 'residential_priority_road',
          },
          {
            value: 'secondary_link',
            label: 'Zufahrt einer Landes&shy;straße/wichtigen Durchgangs&shy;straße',
          },
          {
            value: 'secondary',
            label: 'Landes&shy;straße/Wichtige Durchgangs&shy;straße',
          },
          {
            value: 'service_alley',
            label: 'Gasse',
          },
          {
            value: 'service_driveway',
            label: 'Grundstückszufahrt',
          },
          {
            value: 'service_emergency_access',
            label: 'Rettungsweg',
          },
          {
            value: 'service_parking_aisle',
            label: 'Parkplatzweg',
          },
          {
            value: 'service_road',
            label: 'Zufahrtsweg',
          },
          {
            value: 'service_uncategorized',
            label: 'Zufahrtsweg (unbekannte Klassifizierung)',
          },
          {
            value: 'service',
            label: 'Zufahrtsweg',
          },
          {
            value: 'steps',
            label: 'Stufen',
          },
          {
            value: 'tertiary_link',
            label: 'Zufahrt einer Kreis&shy;straße/untergeordneten Durchgangs&shy;straße',
          },
          {
            value: 'tertiary',
            label: 'Kreis&shy;straße/Untergeordnete Durchgangs&shy;straße',
          },
          {
            value: 'track',
            label: 'Wald- / Feldweg',
          },
          {
            value: 'unclassified',
            label: 'Nebenstraße mit Verbindungscharakter',
          },
          {
            value: 'unspecified_road',
            label: 'Unkategorisierte Straße',
          },
        ],
      },
      {
        key: 'road_name',
        type: 'sanitized_strings',
        label: 'Straßenname',
        description: 'Name der Straße, an dem der Parkraum liegt.',
        values: [],
      },
      {
        key: 'road_oneway',
        type: 'string',
        label: 'Einbahnstraße',
        description: 'Verkehrsrichtung der Straße, an dem der Parkraum liegt.',
        values: [
          {
            value: 'no',
            label: 'Nein (in beide Richtungen befahrbar)',
          },
          {
            value: 'yes',
            label: 'Einbahnstraße',
          },
          {
            value: 'yes_dual_carriageway',
            label: 'Einbahnstraße (getrennte Richtungsfahrbahnen)',
          },
        ],
      },
      {
        key: 'road_width',
        type: 'meter',
        label: 'Fahrbahnbreite',
        description: 'Breite der Fahrbahn, an dem der Parkraum liegt.',
        values: [],
      },
      {
        key: 'road_width_source',
        type: 'string',
        label: 'Herkunft der Fahrbahnbreite',
        purpose: 'qa',
        values: [
          {
            value: 'highway_default',
            label: 'Standard-Wert für diesen Straßentyp.',
          },
          {
            value: 'highway_default_and_oneway',
            label: 'Standard-Wert für diesen Straßentyp als Einbahnstraße.',
          },
          {
            value: 'tag',
            label: 'Dieser Wert ist in OSM hinterlegt.',
          },
        ],
      },
      {
        key: 'road_width_confidence',
        type: 'string',
        label: 'Konfidenz der Fahrbahnbreite',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'side',
        type: 'string',
        label: 'Straßenseite',
        description: 'Seite des Parkraums relativ zur Linienrichtung der OSM-Geometrie.',
        values: [
          {
            value: 'left',
            label: 'Links',
          },
          {
            value: 'right',
            label: 'Rechts',
          },
        ],
      },
      {
        key: 'area',
        type: 'square_meter',
        label: 'Fläche',
        description:
          'Fläche des durch parkende Fahrzeuge auf diesem Parkraumabschnitt belegten Raumes in Quadratmetern.',
        values: [],
      },
      {
        key: 'area_source',
        type: 'string',
        label: 'Herkunft der Flächenangabe',
        purpose: 'qa',
        values: [
          {
            value: 'estimated',
            label: 'Berechnet auf Basis der Länge der Liniengeometrie und Fahrzeugausrichtung.',
          },
          {
            value: 'geometry',
            label: 'Basiert auf dem Flächeninhalt der Geometrie aus OSM.',
          },
        ],
      },
      {
        key: 'area_confidence',
        type: 'string',
        label: 'Konfidenz der Flächenangabe',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'capacity_confidence',
        type: 'string',
        label: 'Konfidenz der Stellplatzanzahl',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'surface',
        type: 'string',
        label: 'Oberfläche',
        description: 'Oberflächenbelag des Parkraumabschnitts.',
        values: [
          {
            value: 'asphalt',
            label: 'Asphalt',
          },
          {
            value: 'paved',
            label: 'Befestigt (unspezifisch)',
          },
          {
            value: 'unpaved',
            label: 'Unbefestigt',
          },
          {
            value: 'concrete',
            label: 'Beton',
          },
          {
            value: 'concrete:plates',
            label: 'Betonplatten',
          },
          {
            value: 'concrete:lanes',
            label: 'Betonstreifen / -bahnen',
          },
          {
            value: 'paving_stones',
            label: 'Verbund&shy;pflastersteine',
          },
          {
            value: 'paving_stones:lanes',
            label: 'Pflasterstein&shy;bahnen',
          },
          {
            value: 'sett',
            label: 'Behauenes Pflaster / Natursteinpflaster',
          },
          {
            value: 'mosaic_sett',
            label: 'Mosaikpflaster',
          },
          {
            value: 'small_sett',
            label: 'Kleinpflaster',
          },
          {
            value: 'large_sett',
            label: 'Großpflaster',
          },
          {
            value: 'bricks',
            label: 'Ziegel',
          },
          {
            value: 'stone',
            label: 'Stein',
          },
          {
            value: 'ground',
            label: 'Erde/Boden',
          },
          {
            value: 'grass',
            label: 'Gras',
          },
          {
            value: 'sand',
            label: 'Sand',
          },
          {
            value: 'compacted',
            label: 'Verdichteter Untergrund',
          },
          {
            value: 'fine_gravel',
            label: 'Splitt',
          },
          {
            value: 'gravel',
            label: 'Schotter',
          },
          {
            value: 'pebblestone',
            label: 'Kieselsteine',
          },
          {
            value: 'wood',
            label: 'Holz',
          },
          {
            value: 'woodchips',
            label: 'Hackschnitzel',
          },
          {
            value: 'metal',
            label: 'Metall',
          },
          {
            value: 'metal_grid',
            label: 'Metallgitter',
          },
          {
            value: 'plastic',
            label: 'Kunststoff',
          },
          {
            value: 'rubber',
            label: 'Gummi',
          },
          {
            value: 'grass_paver',
            label: 'Rasengitter / Grasgitter',
          },
        ],
      },
      {
        key: 'surface_confidence',
        type: 'string',
        label: 'Konfidenz der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'surface_source',
        type: 'string',
        label: 'Herkunft der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM',
          },
          {
            value: 'tag_transformed',
            label: 'Aus OSM-Tag normalisiert',
          },
          {
            value: 'parent_highway_tag',
            label: 'Von zugeordneter Straße (OSM)',
          },
          {
            value: 'parent_highway_tag_transformed',
            label: 'Von zugeordneter Straße, normalisiert',
          },
        ],
      },
      {
        key: 'direction',
        type: 'string',
        label: 'Einparkrichtung',
        description: 'Vorgesehene oder ausgeschilderte Fahrzeugrichtung beim Einparken.',
        values: [
          {
            value: 'back_in',
            label: 'Rückwärts einparken',
          },
          {
            value: 'head_in',
            label: 'Vorwärts einparken',
          },
        ],
      },
      {
        key: 'location',
        type: 'string',
        label: 'Lage im Straßenraum',
        description: 'Besondere Lagemerkmale des Parkraums im Straßenland.',
        values: [
          {
            value: 'lane_centre',
            label: 'Fahrbahnmitte',
          },
          {
            value: 'median',
            label: 'Mittelstreifen',
          },
        ],
      },
      {
        key: 'markings',
        type: 'string',
        label: 'Markierungen',
        values: [
          {
            value: 'no',
            label: 'Ohne Markierungen',
          },
          {
            value: 'yes',
            label: 'Mit Markierungen',
          },
        ],
      },
      {
        key: 'covered',
        type: 'string',
        label: 'Überdacht',
        values: [
          {
            value: 'partial',
            label: 'Teilweise überdacht',
          },
          {
            value: 'yes',
            label: 'Überdacht',
          },
        ],
      },
      {
        key: 'access',
        type: 'string',
        label: 'Zugang',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'customers',
            label: 'Kund:innen',
          },
          {
            value: 'destination',
            label: 'Anlieger frei (Nicht-Durchgangsverkehr erlaubt)',
          },
          {
            value: 'employees',
            label: 'Mitarbeiter',
          },
          {
            value: 'permissive',
            label: 'Öffentliche Nutzung geduldet',
          },
          {
            value: 'public',
            label: 'Öffentlich (explizit)',
          },
          {
            value: 'delivery',
            label: 'Lieferverkehr',
          },
          {
            value: 'no',
            label: 'Kein Zugang',
          },
          {
            value: 'permit',
            label: 'Mit Genehmigung',
          },
          {
            value: 'residents',
            label: 'Nur mit Bewohnerparkausweis',
          },
        ],
      },
      {
        key: 'operator_type',
        type: 'string',
        label: 'Betreibertyp',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'public',
            label: 'Öffentlich',
          },
        ],
      },
      {
        key: 'operator_type_source',
        type: 'string',
        label: 'Herkunft des Betreibertyps',
        purpose: 'qa',
        values: [
          {
            value: 'default_fallback',
            label: 'Annahme bei fehlender Angabe.',
          },
          {
            value: 'driveway_inference',
            label: 'Annahme bei fehlender Angabe wenn eine Einfahrt erkannt wurde.',
          },
          {
            value: 'manual_overwrite_list',
            label: 'Anhand einer manuellen Korrekturliste in TILDA.',
          },
          {
            value: 'parent_highway_tag',
            label: 'Explizite Angabe aus OSM an der zugeordneten Straße.',
          },
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM.',
          },
        ],
      },
      {
        key: 'operator_type_confidence',
        type: 'string',
        label: 'Konfidenz des Betreibertyps',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'informal',
        type: 'string',
        label: 'Duldung',
        values: [
          {
            value: 'yes',
            label: 'Parken im rechtlichen Graubereich oder etabliertes, geduldetes Falschparken.',
          },
        ],
      },
      {
        key: 'zone',
        type: 'sanitized_strings',
        label: 'Parkzone',
        description:
          'Parkzonennummer oder -bezeichnung entsprechend der lokalen Parkraumbewirtschaftung bei Stellplätzen, die nur mit einem entsprechenden Parkrausweis genutzt werden dürfen. Sind (insbesondere an Zonengrenzen) mehrere Parkzonen berechtigt, sind diese üblicherweise als semikolongetrennte Liste aufgeführt.',
        values: [],
      },
      {
        key: 'reason',
        type: 'string',
        label: 'Grund',
        description: 'Angabe eines Grundes bei Nicht-Parken.',
        values: [
          {
            value: 'missing_data',
            label: 'Keine Parkraum-Daten in OpenStreetMap erfasst',
          },
          {
            value: 'parking_tag',
            label: 'Explizite Angabe in den Daten',
          },
          {
            value: 'restriction_no_parking',
            label: 'Explizites Parkverbot aus OSM',
          },
          {
            value: 'restriction_no_stopping',
            label: 'Explizites Halteverbot aus OSM',
          },
          {
            value: 'restriction_no_standing',
            label: 'Eingeschränktes Halteverbot aus OSM',
          },
          {
            value: 'bus_stop',
            label: 'Haltestelle',
          },
          {
            value: 'cycleway',
            label: 'Radverkehrsanlage',
          },
          {
            value: 'dual_carriage',
            label: 'Getrennte Richtungsfahrbahnen',
          },
          {
            value: 'junction',
            label: 'Knotenpunkt / Einmündung',
          },
          {
            value: 'narrow',
            label: 'Zu schmale Fahrbahn',
          },
        ],
      },
      {
        key: 'mapillary',
        type: 'sanitized_strings',
        label: 'Mapillary',
        description: 'Mapillary-Foto-ID für dieses Feature.',
        values: [],
      },
      {
        key: 'traffic_sign',
        type: 'sanitized_strings',
        label: 'Verkehrszeichen',
        description: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
        values: [],
      },
      {
        key: '_staggered_maneuvering_loss',
        type: 'number',
        label: '(Intern) Manövrierraumverlust (alternierendes Parken)',
        purpose: 'qa',
        description: 'Interner Wert aus der Kapazitätsberechnung bei alternierendem Parken',
        values: [],
      },
      {
        key: '_staggered_original_capacity',
        type: 'number',
        label: '(Intern) Ursprüngliche Kapazität (vor Staggered-Anpassung)',
        purpose: 'qa',
        description: 'Interner Zwischenwert vor Anwendung der alternierenden-Parken-Logik',
        values: [],
      },
    ],
    chapters: [
      {
        id: 'capacity-calculation',
        title: 'Berechnung der Kapazität',
        markdown:
          'Kapazitätswerte stammen je nach Datenlage aus unterschiedlichen Quellen:\n\n- Direkte OSM-Tag-Angaben (`capacity`, inkl. Schätzungsvarianten)\n- Flächen- und ausrichtungsbasierte Schätzung\n- Längen- und ausrichtungsbasierte Schätzung\n- Konservative Standardannahmen bei fehlenden Angaben\n\nBei Segmenten mit alternierendem Parken wird die Kapazität reduziert, um realistische Manövrierverluste abzubilden.\n\nDie genaue Herleitung ist im Feld `capacity_source` nachvollziehbar dokumentiert.\n',
      },
      {
        id: 'condition-category',
        title: 'Parkbeschränkung',
        markdown:
          'Unter dem Wert "Parkbeschränkungen" (`condition_category`) wird eine Semikolon getrennte Liste ausgeliefert die verschiedene Parkbeschränkungen beschreibt.\n\nBeispiele:\n\n| Wert                                                      | Übersetzung                                                                       |\n| --------------------------------------------------------- | --------------------------------------------------------------------------------- |\n| `access_restriction (agricultural)`                       | Zugangsbeschränkung (Land-/Forstwirtschaftlicher Verkehr)                         |\n| `access_restriction (no, Tu 15:00-18:00)`                 | Zugangsbeschränkung (kein Zugang, Dienstag 15:00-18:00)                           |\n| `access_restriction (Mo-Fr 04:30-20:00, PH off)`          | Zugangsbeschränkung (Montag-Freitag 04:30-20:00, Feiertag ausgenommen)            |\n| `disabled (except emergency)`                             | Behindertenparkplatz (ausgenommen Einsatz-/Krankenfahrzeuge)                      |\n| `paid (stay > 1 hour)`                                    | Nur mit Parkschein (Parkdauer > 1 Stunde)                                         |\n| `time_limited (2 days)`                                   | Höchstparkdauer (2 Tage)                                                          |\n| `time_limited (4 hours) (08:00-18:00)`                    | Höchstparkdauer (4 Stunden) (08:00-18:00)                                         |\n| `vehicle_restriction (only motorcar, motorcycle)`         | Beschränkung auf Fahrzeugklassen (nur Pkw, Motorräder)                            |\n| `vehicle_restriction (only delivery) (Mo-Sa 07:00-20:00)` | Beschränkung auf Fahrzeugklassen (nur Lieferverkehr) (Montag-Samstag 07:00-20:00) |\n\nIn der TILDA Inspektor-Ansicht werden diese Werte übersetzt dargestellt. In der Attributtabelle sind sie aber nur beispielhaft in ihrer einfachsten Form angegeben. Ebenso kann die Masterportal-Übersetzungs-Tabelle dieser Werte leider nicht übersetzen.\n',
      },
    ],
  },
  parkings_cutouts: {
    topic: 'parking',
    tableName: 'parkings_cutouts',
    sourceIds: ['tilda_parkings_cutouts'],
    title: 'Parkraumstanzungen',
    summary:
      'Stanzungen sind ein Kernbestandteil der Parkraumprozessierung. Mit ihnen werden aus den zu Beginn der Prozessierung groben Straßengeometrien präzise Parkraum-Abschnitte abgeleitet. Stanzungen können zum Beispiel Kreuzungen, Einfahrten, Bushaltestellen, Gehwegübergänge oder Hindernisse wie Bäume oder Poller sein. Solche Merkmale und Objekte im Straßenraum werden zu Stanzungsgeometrien umgewandelt und auf die Parkraumgeometrien angewendet. Die Attribute beschreiben die Stanzung, nicht den Parkraum.',
    groups: [
      {
        id: 'parking',
        label: 'Parkraum-Prozessierung',
      },
    ],
    attributes: [
      {
        key: 'category',
        type: 'string',
        label: 'Stanzungen',
        values: [
          {
            value: 'advertising',
            label: 'Werbeträger',
          },
          {
            value: 'barrier',
            label: 'Barriere',
          },
          {
            value: 'bicycle_parking',
            label: 'Fahrradparkplatz',
          },
          {
            value: 'bicycle_rental',
            label: 'Fahrradverleih',
          },
          {
            value: 'bollard',
            label: 'Poller',
          },
          {
            value: 'bus_stop',
            label: 'Bushaltestelle',
          },
          {
            value: 'bus_stop_conditional',
            label: 'Bushaltestelle mit zeitlichen Einschränkungen (Nachtbusse, Schulbusse)',
          },
          {
            value: 'bus_stop_centerline',
            label: 'Bushaltestelle (Mittellinie)',
          },
          {
            value: 'bus_stop_kerb',
            label: 'Bushaltestelle (Bordstein)',
          },
          {
            value: 'collision_protection',
            label: 'Baumschutzbügel',
          },
          {
            value: 'crossing_buffer_marking',
            label: 'Markierung (Sperrfläche u.ä.) an Querungsstelle',
          },
          {
            value: 'crossing_kerb_extension',
            label: 'Gehwegvorstreckung an Querungsstelle',
          },
          {
            value: 'crossing_continuous',
            label: 'Durchgängige Querung',
          },
          {
            value: 'crossing_marked',
            label: 'Markierte Querungsstelle',
          },
          {
            value: 'crossing_traffic_signals',
            label: 'Ampelquerung',
          },
          {
            value: 'crossing_zebra',
            label: 'Fußgängerüberweg (Zebrastreifen)',
          },
          {
            value: 'driveway',
            label: 'Einfahrt',
          },
          {
            value: 'driveway_corner_kerb',
            label: 'Implizites Halteverbot am Beginn einer Einfahrt',
          },
          {
            value: 'fire_hydrant',
            label: 'Hydrant',
          },
          {
            value: 'intersection_corner',
            label: 'Implizites Halteverbot an Straßenecke',
          },
          {
            value: 'kerb_lowered',
            label: 'Abgesenkter Bordstein',
          },
          {
            value: 'kerb_extension',
            label: 'Gehwegvorstreckung',
          },
          {
            value: 'loading_ramp',
            label: 'Transportüberweg',
          },
          {
            value: 'mobility_hub',
            label: 'Mobilitätsstation',
          },
          {
            value: 'motorcycle_parking',
            label: 'Motorradparkplatz',
          },
          {
            value: 'other',
            label: 'Sonstiges Hindernis',
          },
          {
            value: 'parklet',
            label: 'Parklet',
          },
          {
            value: 'recycling',
            label: 'Recyclingstation',
          },
          {
            value: 'road_marking_restricted_area',
            label: 'Sperrfläche (Markierung)',
          },
          {
            value: 'small_electric_vehicle_parking',
            label: 'Abstellfläche für Elektrokleinstfahrzeuge',
          },
          {
            value: 'street_cabinet',
            label: 'Schaltkasten, Straßenkasten, u.ä.',
          },
          {
            value: 'street_lamp',
            label: 'Straßenlaterne',
          },
          {
            value: 'traffic_calming_choker',
            label: 'Angelegte Fahrbahnverengung',
          },
          {
            value: 'traffic_sign',
            label: 'Verkehrszeichen',
          },
          {
            value: 'tram_stop',
            label: 'Straßenbahnhaltestelle',
          },
          {
            value: 'tree',
            label: 'Baum',
          },
          {
            value: 'tree_pit',
            label: 'Baumscheibe',
          },
          {
            value: 'vending_parking_tickets',
            label: 'Parkscheinautomat',
          },
          {
            value: 'water_well',
            label: 'Straßenbrunnen / Wasserstelle',
          },
        ],
      },
      {
        key: 'source',
        type: 'string',
        label: 'Datenquelle',
        description:
          'In der Export-Tabelle `parkings_cutouts` erscheinen nur Stanzungen, deren `source` nicht parking_roads, separate_parking_areas oder separate_parking_points ist.',
        values: [
          {
            value: 'crossing',
            label: 'Überwege',
          },
          {
            value: 'driveway_corner_kerbs',
            label: 'Implizites Halteverbot am Beginn einer Einfahrt',
          },
          {
            value: 'driveways',
            label: 'Einfahrten',
          },
          {
            value: 'external_cutouts_euvm',
            label: 'Externe Hindernisdaten (eUVM)',
          },
          {
            value: 'intersections',
            label: 'Kreuzungen',
          },
          {
            value: 'obstacle_areas',
            label: 'Flächige Hindernisse',
          },
          {
            value: 'obstacle_lines',
            label: 'Linienhafte Hindernisse',
          },
          {
            value: 'obstacle_points',
            label: 'Punktuelle Hindernisse',
          },
          {
            value: 'public_transport_stops',
            label: 'ÖPNV-Haltestellen',
          },
          {
            value: 'separate_parking_areas',
            label: 'Parkplätze die separat als Fläche erfasst sind',
          },
          {
            value: 'separate_parking_points',
            label: 'Parkplätze die separat als Punkt erfasst sind',
          },
        ],
      },
      {
        key: 'buffer_radius',
        type: 'meter',
        label: 'Radius der Stanzung',
        description: 'Radius der Stanzung in Metern.',
        values: [],
      },
      {
        key: 'radius',
        type: 'meter',
        label: 'Pufferradius',
        description:
          'Radius eines Puffers in Metern, u. a. an Kreuzungs-Ecken (Bordsteinschnittpunkte) und eUVM-Punkten.',
        values: [],
      },
      {
        key: 'side',
        type: 'string',
        label: 'Seite relativ zur Fahrbahn',
        values: [
          {
            value: 'left',
            label: 'Links',
          },
          {
            value: 'right',
            label: 'Rechts',
          },
          {
            value: 'platform',
            label: 'Bahnsteig / ohne Kerb-Seite',
          },
        ],
      },
      {
        key: 'width',
        type: 'meter',
        label: 'Breite',
        values: [],
      },
      {
        key: 'no_cutout_for_restrictions',
        type: 'string',
        label: 'Gilt nicht bei Park-/Halteverbot entlang der Linie',
        values: [
          {
            value: 'true',
            label: 'Ja (Stanzung wird bei echten Verbotssegmenten nicht angewendet)',
          },
        ],
      },
      {
        key: 'road',
        type: 'sanitized_strings',
        label: 'Fahrbahn-Referenz (Einfahrt)',
        values: [],
      },
      {
        key: 'street:name',
        type: 'sanitized_strings',
        label: 'Straßenname (Einfahrt)',
        values: [],
      },
      {
        key: 'amenity',
        type: 'sanitized_strings',
        label: 'OSM-Kategorie "amenity"',
        values: [],
      },
      {
        key: 'barrier',
        type: 'sanitized_strings',
        label: 'OSM-Kategorie "barrier"',
        values: [],
      },
      {
        key: 'capacity',
        type: 'number',
        label: 'Kapazität (OSM / Zwischenwert)',
        values: [],
      },
      {
        key: 'capacity:cargo_bike',
        type: 'number',
        label: 'Kapazität Lastenrad (OSM)',
        values: [],
      },
      {
        key: 'direction',
        type: 'sanitized_strings',
        label: 'Richtung (OSM)',
        values: [],
      },
      {
        key: 'emergency',
        type: 'sanitized_strings',
        label: 'OSM-Kategorie "emergency"',
        values: [],
      },
      {
        key: 'geom_sources',
        type: 'string',
        label: 'Geometrie-Quellen',
        purpose: 'qa',
        description: 'Interne Aufschlüsselung der für die Geometrie verwendeten Quellen (JSON).',
        values: [],
      },
      {
        key: 'geometry_source',
        type: 'sanitized_strings',
        label: 'Geometrieherkunft',
        purpose: 'qa',
        values: [],
      },
      {
        key: 'kerb',
        type: 'sanitized_strings',
        label: 'Bordstein (OSM-Kategorie "kerb")',
        values: [],
      },
      {
        key: 'landuse',
        type: 'sanitized_strings',
        label: 'Flächennutzung (OSM-Kategorie "landuse")',
        values: [],
      },
      {
        key: 'man_made',
        type: 'sanitized_strings',
        label: 'Künstliche Objekte (OSM-Kategorie "man_made")',
        values: [],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name (OSM)',
        values: [],
      },
      {
        key: 'natural',
        type: 'sanitized_strings',
        label: 'Natur (OSM-Kategorie "natural")',
        values: [],
      },
      {
        key: 'operator',
        type: 'sanitized_strings',
        label: 'Betreiber (OSM)',
        values: [],
      },
      {
        key: 'ref',
        type: 'sanitized_strings',
        label: 'Referenz (OSM-Kategorie "ref")',
        values: [],
      },
      {
        key: 'separate_parking',
        type: 'sanitized_strings',
        label: 'Separater Parkplatz (OSM-Bezug)',
        values: [],
      },
      {
        key: 'tag_sources',
        type: 'string',
        label: 'Tag-Quellen',
        purpose: 'qa',
        description: 'Interne Aufschlüsselung der OSM-Tag-Herkunft (JSON).',
        values: [],
      },
      {
        key: 'traffic_calming',
        type: 'sanitized_strings',
        label: 'Verkehrsberuhigung (OSM-Kategorie "traffic_calming")',
        values: [],
      },
      {
        key: 'osm_area:highway',
        type: 'ignore',
        label: 'osm_area:highway',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_barrier',
        type: 'ignore',
        label: 'osm_barrier',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_capacity',
        type: 'ignore',
        label: 'osm_capacity',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_crossing',
        type: 'ignore',
        label: 'osm_crossing',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_crossing:buffer_marking',
        type: 'ignore',
        label: 'osm_crossing:buffer_marking',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_crossing:kerb_extension',
        type: 'ignore',
        label: 'osm_crossing:kerb_extension',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_crossing:continuous',
        type: 'ignore',
        label: 'osm_crossing:continuous',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_crossing:markings',
        type: 'ignore',
        label: 'osm_crossing:markings',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_crossing:signals',
        type: 'ignore',
        label: 'osm_crossing:signals',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_crossing_ref',
        type: 'ignore',
        label: 'osm_crossing_ref',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_fire_hydrant:position',
        type: 'ignore',
        label: 'osm_fire_hydrant:position',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_fire_hydrant:type',
        type: 'ignore',
        label: 'osm_fire_hydrant:type',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_highway',
        type: 'ignore',
        label: 'osm_highway',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_leisure',
        type: 'ignore',
        label: 'osm_leisure',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_mapillary',
        type: 'ignore',
        label: 'osm_mapillary',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_natural',
        type: 'ignore',
        label: 'osm_natural',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_network',
        type: 'ignore',
        label: 'osm_network',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_outdoor_seating',
        type: 'ignore',
        label: 'osm_outdoor_seating',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_position',
        type: 'ignore',
        label: 'osm_position',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_ref',
        type: 'ignore',
        label: 'osm_ref',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_road_marking',
        type: 'ignore',
        label: 'osm_road_marking',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_small_electric_vehicle_parking:position',
        type: 'ignore',
        label: 'osm_small_electric_vehicle_parking:position',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_street_cabinet',
        type: 'ignore',
        label: 'osm_street_cabinet',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_traffic_calming',
        type: 'ignore',
        label: 'osm_traffic_calming',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_traffic_sign',
        type: 'ignore',
        label: 'osm_traffic_sign',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_vending',
        type: 'ignore',
        label: 'osm_vending',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_zone',
        type: 'ignore',
        label: 'osm_zone',
        purpose: 'experimentation',
        values: [],
      },
    ],
    chapters: [
      {
        id: 'capacity-calculation',
        title: 'Berechnung der Kapazität',
        markdown:
          'Kapazitätswerte stammen je nach Datenlage aus unterschiedlichen Quellen:\n\n- Direkte OSM-Tag-Angaben (`capacity`, inkl. Schätzungsvarianten)\n- Flächen- und ausrichtungsbasierte Schätzung\n- Längen- und ausrichtungsbasierte Schätzung\n- Konservative Standardannahmen bei fehlenden Angaben\n\nBei Segmenten mit alternierendem Parken wird die Kapazität reduziert, um realistische Manövrierverluste abzubilden.\n\nDie genaue Herleitung ist im Feld `capacity_source` nachvollziehbar dokumentiert.\n',
      },
      {
        id: 'condition-category',
        title: 'Parkbeschränkung',
        markdown:
          'Unter dem Wert "Parkbeschränkungen" (`condition_category`) wird eine Semikolon getrennte Liste ausgeliefert die verschiedene Parkbeschränkungen beschreibt.\n\nBeispiele:\n\n| Wert                                                      | Übersetzung                                                                       |\n| --------------------------------------------------------- | --------------------------------------------------------------------------------- |\n| `access_restriction (agricultural)`                       | Zugangsbeschränkung (Land-/Forstwirtschaftlicher Verkehr)                         |\n| `access_restriction (no, Tu 15:00-18:00)`                 | Zugangsbeschränkung (kein Zugang, Dienstag 15:00-18:00)                           |\n| `access_restriction (Mo-Fr 04:30-20:00, PH off)`          | Zugangsbeschränkung (Montag-Freitag 04:30-20:00, Feiertag ausgenommen)            |\n| `disabled (except emergency)`                             | Behindertenparkplatz (ausgenommen Einsatz-/Krankenfahrzeuge)                      |\n| `paid (stay > 1 hour)`                                    | Nur mit Parkschein (Parkdauer > 1 Stunde)                                         |\n| `time_limited (2 days)`                                   | Höchstparkdauer (2 Tage)                                                          |\n| `time_limited (4 hours) (08:00-18:00)`                    | Höchstparkdauer (4 Stunden) (08:00-18:00)                                         |\n| `vehicle_restriction (only motorcar, motorcycle)`         | Beschränkung auf Fahrzeugklassen (nur Pkw, Motorräder)                            |\n| `vehicle_restriction (only delivery) (Mo-Sa 07:00-20:00)` | Beschränkung auf Fahrzeugklassen (nur Lieferverkehr) (Montag-Samstag 07:00-20:00) |\n\nIn der TILDA Inspektor-Ansicht werden diese Werte übersetzt dargestellt. In der Attributtabelle sind sie aber nur beispielhaft in ihrer einfachsten Form angegeben. Ebenso kann die Masterportal-Übersetzungs-Tabelle dieser Werte leider nicht übersetzen.\n',
      },
    ],
  },
  parkings_no: {
    topic: 'parking',
    tableName: 'parkings_no',
    sourceIds: ['tilda_parkings_no'],
    title: 'Kein Parken',
    summary:
      'Abschnitte ohne reguläres Parken, inklusive Verboten und Bereichen mit fehlenden Parkraumdaten.',
    groups: [
      {
        id: 'parking',
        label: 'Parkraum-Prozessierung',
      },
    ],
    attributes: [
      {
        key: 'parking',
        type: 'string',
        label: 'Parkposition',
        description: 'Lage oder Art des Parkraums im Straßenland.',
        values: [
          {
            value: 'lane',
            label: 'Auf der Fahrbahn',
          },
          {
            value: 'half_on_kerb',
            label: 'Halb auf dem Gehweg',
          },
          {
            value: 'on_kerb',
            label: 'Ganz auf dem Gehweg',
          },
          {
            value: 'no_parking',
            label: 'Eingeschränktes Haltverbot',
          },
          {
            value: 'no_stopping',
            label: 'Absolutes Haltverbot',
          },
          {
            value: 'separate',
            label: 'Parkraum als separate Geometrie erfasst',
          },
          {
            value: 'shoulder',
            label: 'Auf dem Seitenstreifen',
          },
          {
            value: 'street_side',
            label: 'Parkbucht',
          },
          {
            value: 'yes',
            label: 'Nicht näher bestimmtes Straßenparken',
          },
          {
            value: 'no',
            label: 'Kein Parken (Sonstiger/Unbekannter Grund)',
          },
          {
            value: 'no_standing',
            label: 'Nur kurzes Halten erlaubt',
          },
          {
            value: 'missing',
            label: 'Daten in OSM fehlen',
          },
          {
            value: 'not_expected',
            label: 'Kein Parken zu erwarten',
          },
        ],
      },
      {
        key: 'reason',
        type: 'string',
        label: 'Grund',
        description: 'Angabe eines Grundes bei Nicht-Parken.',
        values: [
          {
            value: 'missing_data',
            label: 'Keine Parkraum-Daten in OpenStreetMap erfasst',
          },
          {
            value: 'parking_tag',
            label: 'Explizite Angabe in den Daten',
          },
          {
            value: 'restriction_no_parking',
            label: 'Explizites Parkverbot aus OSM',
          },
          {
            value: 'restriction_no_stopping',
            label: 'Explizites Halteverbot aus OSM',
          },
          {
            value: 'restriction_no_standing',
            label: 'Eingeschränktes Halteverbot aus OSM',
          },
          {
            value: 'bus_stop',
            label: 'Haltestelle',
          },
          {
            value: 'cycleway',
            label: 'Radverkehrsanlage',
          },
          {
            value: 'dual_carriage',
            label: 'Getrennte Richtungsfahrbahnen',
          },
          {
            value: 'junction',
            label: 'Knotenpunkt / Einmündung',
          },
          {
            value: 'narrow',
            label: 'Zu schmale Fahrbahn',
          },
          {
            value: 'capacity_below_zero',
            label: 'Abschnitt zu klein für ein Fahrzeug',
          },
        ],
      },
      {
        key: 'condition_category',
        type: 'string',
        label: 'Parkbeschränkung',
        chapterRefs: ['condition-category'],
        values: [
          {
            value: 'access_restriction',
            label: 'Zugangsbeschränkung',
          },
          {
            value: 'assumed_free',
            label: 'Wahrscheinlich keine Parkbeschränkungen',
          },
          {
            value: 'assumed_private',
            label: 'Sehr wahrscheinlich privat',
          },
          {
            value: 'bus_lane',
            label: 'Bussonderfahrstreifen',
          },
          {
            value: 'car_sharing',
            label: 'Nur für Carsharing-Fahrzeuge',
          },
          {
            value: 'charging',
            label: 'Laden von Elektrofahrzeugen',
          },
          {
            value: 'disabled',
            label: 'Behindertenparkplatz',
          },
          {
            value: 'disabled_private',
            label: 'Personenbezogener Behindertenparkplatz',
          },
          {
            value: 'free',
            label: 'Keine Parkbeschränkungen',
          },
          {
            value: 'loading',
            label: 'Ladezone',
          },
          {
            value: 'maxweight',
            label: 'Gewichtsbegrenzung',
          },
          {
            value: 'mixed',
            label: 'Nur mit Parkschein oder Bewohnerparkausweis',
          },
          {
            value: 'no_parking',
            label: 'Eingeschränktes Haltverbot',
          },
          {
            value: 'no_standing',
            label: 'Nur kurzes Halten erlaubt',
          },
          {
            value: 'no_stopping',
            label: 'Absolutes Haltverbot',
          },
          {
            value: 'paid',
            label: 'Nur mit Parkschein',
          },
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'residents',
            label: 'Nur mit Bewohnerparkausweis',
          },
          {
            value: 'taxi',
            label: 'Taxenstand',
          },
          {
            value: 'time_limited',
            label: 'Höchstparkdauer',
          },
          {
            value: 'unspecified',
            label: 'Unbestimmt',
          },
          {
            value: 'vehicle_restriction',
            label: 'Beschränkung auf Fahrzeugklassen',
          },
        ],
      },
      {
        key: 'capacity',
        type: 'number',
        label: 'Stellplatzanzahl',
        description: 'Geschätzte oder explizit erfasste Anzahl von Stellplätzen.',
        chapterRefs: ['capacity-calculation'],
        values: [],
      },
      {
        key: 'capacity_source',
        type: 'string',
        label: 'Herkunft der Stellplatzanzahl',
        purpose: 'qa',
        description: 'Herkunft der Stellplatzanzahl inklusive Schätz- oder Umverteilungslogik.',
        chapterRefs: ['capacity-calculation'],
        values: [
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM.',
          },
          {
            value: 'tag_estimation',
            label: 'Explizite Angabe einer Schätzung aus OSM.',
          },
          {
            value: 'tag_redistributed',
            label: 'Explizite Angabe aus OSM, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'tag_estimation_redistributed',
            label:
              'Explizite Angabe einer Schätzung aus OSM, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_parallel',
            label: 'Berechnet auf Basis der Fläche und Parkausrichtung.',
          },
          {
            value: 'area_and_orientation_perpendicular',
            label: 'Berechnet auf Basis der Fläche und Parkausrichtung.',
          },
          {
            value: 'area_and_orientation_diagonal',
            label: 'Berechnet auf Basis der Fläche und Parkausrichtung.',
          },
          {
            value: 'area_and_orientation_parallel_redistributed',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_perpendicular_redistributed',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_diagonal_redistributed',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung, dann anteilig aufgeteilt nach Stanzung.',
          },
          {
            value: 'area_and_orientation_fallback_parallel',
            label:
              'Berechnet auf Basis der Fläche und Parkausrichtung. Allerdings war die Parkausrichtung unbekannt, so dass Parallelparken angenommen wurde.',
          },
          {
            value: 'estimated_from_length',
            label: 'Berechnet auf Basis der Linien-Länge und Ausrichtung.',
          },
          {
            value: 'estimated_from_area',
            label: 'Berechnet auf Basis der Fläche und Ausrichtung.',
          },
          {
            value: 'estimated',
            label: 'Berechnung',
          },
          {
            value: 'estimated_redistributed',
            label: 'Geschätzt, Kapazität umverteilt',
          },
          {
            value: 'assumed_default',
            label: 'Keine explizite Angabe vorgefunden; dieser Wert ist eine Annahme.',
          },
        ],
      },
      {
        key: 'orientation',
        type: 'string',
        label: 'Ausrichtung',
        description: 'Ausrichtung der Fahrzeuge im Straßenland zur Verkehrsrichtung.',
        values: [
          {
            value: 'parallel',
            label: 'Parallelparken',
          },
          {
            value: 'perpendicular',
            label: 'Querparken',
          },
          {
            value: 'diagonal',
            label: 'Schrägparken',
          },
        ],
      },
      {
        key: 'staggered',
        type: 'string',
        label: 'Parkweise',
        description:
          'Besondere Merkmale zur Parkweise, insbesondere bei alternierendem/versetztem Parken auf Fahrbahnen, die zu schmal sind um auf beiden Seiten gleichzeitig zu parken, keine Markierungen und Beschilderungen aufweisen, die das Parken regeln und auf denen gewöhnlich wechselseitig abschnittsweise auf der einen oder anderen Straßenseite geparkt wird oder geparkt werden kann.',
        values: [
          {
            value: 'yes',
            label: 'Alternierendes Parken',
            description:
              'Auf diesem Abschnitt ist die Fahrbahn zu schmal, um auf beiden Seiten gleichzeitig zu parken. Es gibt keine Markierungen oder Schilder, die das Parken regeln. Häufig entwickeln sich örtliche Konventionen, in welchen Bereichen auf welcher Seite geparkt wird. In die Kapazitätsberechnung fließt das ein: Die Kapazität wird um 50% reduziert (da nur eine Seite genutzt werden kann) und zusätzlich wird für jeden 60m-Abschnitt ein Manövrierraumverlust von 10m (≈1,9 Fahrzeugplätze) abgezogen, da beim Seitenwechsel Manövrierraum benötigt wird. Diese Angaben basieren auf Erfahrungswerten und können lediglich eine Schätzung des tatsächlichen Parkgeschehens abbilden.',
            chapterRefs: ['capacity-calculation'],
          },
          {
            value: 'no',
            label: 'Nicht alternierend',
          },
        ],
      },
      {
        key: 'source',
        type: 'string',
        label: 'Datenquelle',
        description: 'Datenquelle der Parkraumgeometrie aus OpenStreetMap.',
        values: [
          {
            value: 'parkings',
            label: 'Angaben an der Straßenlinie',
          },
          {
            value: 'separate_parking_areas',
            label: 'Separat erfasste Flächendaten',
          },
          {
            value: 'separate_parking_points',
            label: 'Separate erfasste Punktdaten',
          },
        ],
      },
      {
        key: 'geom_sources',
        type: 'sanitized_strings',
        label: '(Intern) OSM-IDs der Geometiren',
        purpose: 'qa',
        description:
          'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs die für eine Geometrie verwendeten wurden.',
        values: [],
      },
      {
        key: 'tag_sources',
        type: 'sanitized_strings',
        label: 'Tag-Quellen',
        purpose: 'qa',
        description:
          'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs aus denen die OSM-Tags abgeleitet wurden.',
        values: [],
      },
      {
        key: 'road',
        type: 'string',
        label: 'Straßentyp',
        description: 'Art der Straße, an dem der Parkraum liegt.',
        values: [
          {
            value: 'bicycle_road',
            label: 'Fahrradstraße',
          },
          {
            value: 'construction',
            label: 'Straße ist in Bau',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway',
            label: 'Radweg',
          },
          {
            value: 'footway_cycleway_crossing',
            label: 'Straßenquerung (Fußverkehr)',
          },
          {
            value: 'footway_sidewalk',
            label: 'Gehweg',
          },
          {
            value: 'footway',
            label: 'Fußweg',
          },
          {
            value: 'living_street',
            label: 'Verkehrsberuhigter Bereich',
          },
          {
            value: 'motorway_link',
            label: 'Zufahrt einer Autobahn',
          },
          {
            value: 'motorway',
            label: 'Autobahn',
          },
          {
            value: 'path',
            label: 'Weg / Pfad',
          },
          {
            value: 'pedestrian',
            label: 'Fußgängerzone',
          },
          {
            value: 'primary_link',
            label: 'Zufahrt einer Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'primary',
            label: 'Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'residential',
            label: 'Anwohnerstraße',
          },
          {
            value: 'residential_priority_road',
            label: 'residential_priority_road',
          },
          {
            value: 'secondary_link',
            label: 'Zufahrt einer Landes&shy;straße/wichtigen Durchgangs&shy;straße',
          },
          {
            value: 'secondary',
            label: 'Landes&shy;straße/Wichtige Durchgangs&shy;straße',
          },
          {
            value: 'service_alley',
            label: 'Gasse',
          },
          {
            value: 'service_driveway',
            label: 'Grundstückszufahrt',
          },
          {
            value: 'service_emergency_access',
            label: 'Rettungsweg',
          },
          {
            value: 'service_parking_aisle',
            label: 'Parkplatzweg',
          },
          {
            value: 'service_road',
            label: 'Zufahrtsweg',
          },
          {
            value: 'service_uncategorized',
            label: 'Zufahrtsweg (unbekannte Klassifizierung)',
          },
          {
            value: 'service',
            label: 'Zufahrtsweg',
          },
          {
            value: 'steps',
            label: 'Stufen',
          },
          {
            value: 'tertiary_link',
            label: 'Zufahrt einer Kreis&shy;straße/untergeordneten Durchgangs&shy;straße',
          },
          {
            value: 'tertiary',
            label: 'Kreis&shy;straße/Untergeordnete Durchgangs&shy;straße',
          },
          {
            value: 'track',
            label: 'Wald- / Feldweg',
          },
          {
            value: 'unclassified',
            label: 'Nebenstraße mit Verbindungscharakter',
          },
          {
            value: 'unspecified_road',
            label: 'Unkategorisierte Straße',
          },
        ],
      },
      {
        key: 'road_name',
        type: 'sanitized_strings',
        label: 'Straßenname',
        description: 'Name der Straße, an dem der Parkraum liegt.',
        values: [],
      },
      {
        key: 'road_oneway',
        type: 'string',
        label: 'Einbahnstraße',
        description: 'Verkehrsrichtung der Straße, an dem der Parkraum liegt.',
        values: [
          {
            value: 'no',
            label: 'Nein (in beide Richtungen befahrbar)',
          },
          {
            value: 'yes',
            label: 'Einbahnstraße',
          },
          {
            value: 'yes_dual_carriageway',
            label: 'Einbahnstraße (getrennte Richtungsfahrbahnen)',
          },
        ],
      },
      {
        key: 'road_width',
        type: 'meter',
        label: 'Fahrbahnbreite',
        description: 'Breite der Fahrbahn, an dem der Parkraum liegt.',
        values: [],
      },
      {
        key: 'road_width_source',
        type: 'string',
        label: 'Herkunft der Fahrbahnbreite',
        purpose: 'qa',
        values: [
          {
            value: 'highway_default',
            label: 'Standard-Wert für diesen Straßentyp.',
          },
          {
            value: 'highway_default_and_oneway',
            label: 'Standard-Wert für diesen Straßentyp als Einbahnstraße.',
          },
          {
            value: 'tag',
            label: 'Dieser Wert ist in OSM hinterlegt.',
          },
        ],
      },
      {
        key: 'road_width_confidence',
        type: 'string',
        label: 'Konfidenz der Fahrbahnbreite',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'side',
        type: 'string',
        label: 'Straßenseite',
        description: 'Seite des Parkraums relativ zur Linienrichtung der OSM-Geometrie.',
        values: [
          {
            value: 'left',
            label: 'Links',
          },
          {
            value: 'right',
            label: 'Rechts',
          },
        ],
      },
      {
        key: 'area',
        type: 'square_meter',
        label: 'Fläche',
        description:
          'Fläche des durch parkende Fahrzeuge auf diesem Parkraumabschnitt belegten Raumes in Quadratmetern.',
        values: [],
      },
      {
        key: 'area_source',
        type: 'string',
        label: 'Herkunft der Flächenangabe',
        purpose: 'qa',
        values: [
          {
            value: 'estimated',
            label: 'Berechnet auf Basis der Länge der Liniengeometrie und Fahrzeugausrichtung.',
          },
          {
            value: 'geometry',
            label: 'Basiert auf dem Flächeninhalt der Geometrie aus OSM.',
          },
        ],
      },
      {
        key: 'area_confidence',
        type: 'string',
        label: 'Konfidenz der Flächenangabe',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'capacity_confidence',
        type: 'string',
        label: 'Konfidenz der Stellplatzanzahl',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'surface',
        type: 'string',
        label: 'Oberfläche',
        description: 'Oberflächenbelag des Parkraumabschnitts.',
        values: [
          {
            value: 'asphalt',
            label: 'Asphalt',
          },
          {
            value: 'paved',
            label: 'Befestigt (unspezifisch)',
          },
          {
            value: 'unpaved',
            label: 'Unbefestigt',
          },
          {
            value: 'concrete',
            label: 'Beton',
          },
          {
            value: 'concrete:plates',
            label: 'Betonplatten',
          },
          {
            value: 'concrete:lanes',
            label: 'Betonstreifen / -bahnen',
          },
          {
            value: 'paving_stones',
            label: 'Verbund&shy;pflastersteine',
          },
          {
            value: 'paving_stones:lanes',
            label: 'Pflasterstein&shy;bahnen',
          },
          {
            value: 'sett',
            label: 'Behauenes Pflaster / Natursteinpflaster',
          },
          {
            value: 'mosaic_sett',
            label: 'Mosaikpflaster',
          },
          {
            value: 'small_sett',
            label: 'Kleinpflaster',
          },
          {
            value: 'large_sett',
            label: 'Großpflaster',
          },
          {
            value: 'bricks',
            label: 'Ziegel',
          },
          {
            value: 'stone',
            label: 'Stein',
          },
          {
            value: 'ground',
            label: 'Erde/Boden',
          },
          {
            value: 'grass',
            label: 'Gras',
          },
          {
            value: 'sand',
            label: 'Sand',
          },
          {
            value: 'compacted',
            label: 'Verdichteter Untergrund',
          },
          {
            value: 'fine_gravel',
            label: 'Splitt',
          },
          {
            value: 'gravel',
            label: 'Schotter',
          },
          {
            value: 'pebblestone',
            label: 'Kieselsteine',
          },
          {
            value: 'wood',
            label: 'Holz',
          },
          {
            value: 'woodchips',
            label: 'Hackschnitzel',
          },
          {
            value: 'metal',
            label: 'Metall',
          },
          {
            value: 'metal_grid',
            label: 'Metallgitter',
          },
          {
            value: 'plastic',
            label: 'Kunststoff',
          },
          {
            value: 'rubber',
            label: 'Gummi',
          },
          {
            value: 'grass_paver',
            label: 'Rasengitter / Grasgitter',
          },
        ],
      },
      {
        key: 'surface_confidence',
        type: 'string',
        label: 'Konfidenz der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'surface_source',
        type: 'string',
        label: 'Herkunft der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM',
          },
          {
            value: 'tag_transformed',
            label: 'Aus OSM-Tag normalisiert',
          },
          {
            value: 'parent_highway_tag',
            label: 'Von zugeordneter Straße (OSM)',
          },
          {
            value: 'parent_highway_tag_transformed',
            label: 'Von zugeordneter Straße, normalisiert',
          },
        ],
      },
      {
        key: 'direction',
        type: 'string',
        label: 'Einparkrichtung',
        description: 'Vorgesehene oder ausgeschilderte Fahrzeugrichtung beim Einparken.',
        values: [
          {
            value: 'back_in',
            label: 'Rückwärts einparken',
          },
          {
            value: 'head_in',
            label: 'Vorwärts einparken',
          },
        ],
      },
      {
        key: 'location',
        type: 'string',
        label: 'Lage im Straßenraum',
        description: 'Besondere Lagemerkmale des Parkraums im Straßenland.',
        values: [
          {
            value: 'lane_centre',
            label: 'Fahrbahnmitte',
          },
          {
            value: 'median',
            label: 'Mittelstreifen',
          },
        ],
      },
      {
        key: 'markings',
        type: 'string',
        label: 'Markierungen',
        values: [
          {
            value: 'no',
            label: 'Ohne Markierungen',
          },
          {
            value: 'yes',
            label: 'Mit Markierungen',
          },
        ],
      },
      {
        key: 'covered',
        type: 'string',
        label: 'Überdacht',
        values: [
          {
            value: 'partial',
            label: 'Teilweise überdacht',
          },
          {
            value: 'yes',
            label: 'Überdacht',
          },
        ],
      },
      {
        key: 'access',
        type: 'string',
        label: 'Zugang',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'customers',
            label: 'Kund:innen',
          },
          {
            value: 'destination',
            label: 'Anlieger frei (Nicht-Durchgangsverkehr erlaubt)',
          },
          {
            value: 'employees',
            label: 'Mitarbeiter',
          },
          {
            value: 'permissive',
            label: 'Öffentliche Nutzung geduldet',
          },
          {
            value: 'public',
            label: 'Öffentlich (explizit)',
          },
          {
            value: 'delivery',
            label: 'Lieferverkehr',
          },
          {
            value: 'no',
            label: 'Kein Zugang',
          },
          {
            value: 'permit',
            label: 'Mit Genehmigung',
          },
          {
            value: 'residents',
            label: 'Nur mit Bewohnerparkausweis',
          },
        ],
      },
      {
        key: 'operator_type',
        type: 'string',
        label: 'Betreibertyp',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'public',
            label: 'Öffentlich',
          },
        ],
      },
      {
        key: 'operator_type_source',
        type: 'string',
        label: 'Herkunft des Betreibertyps',
        purpose: 'qa',
        values: [
          {
            value: 'default_fallback',
            label: 'Annahme bei fehlender Angabe.',
          },
          {
            value: 'driveway_inference',
            label: 'Annahme bei fehlender Angabe wenn eine Einfahrt erkannt wurde.',
          },
          {
            value: 'manual_overwrite_list',
            label: 'Anhand einer manuellen Korrekturliste in TILDA.',
          },
          {
            value: 'parent_highway_tag',
            label: 'Explizite Angabe aus OSM an der zugeordneten Straße.',
          },
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM.',
          },
        ],
      },
      {
        key: 'operator_type_confidence',
        type: 'string',
        label: 'Konfidenz des Betreibertyps',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'informal',
        type: 'string',
        label: 'Duldung',
        values: [
          {
            value: 'yes',
            label: 'Parken im rechtlichen Graubereich oder etabliertes, geduldetes Falschparken.',
          },
        ],
      },
      {
        key: 'zone',
        type: 'sanitized_strings',
        label: 'Parkzone',
        description:
          'Parkzonennummer oder -bezeichnung entsprechend der lokalen Parkraumbewirtschaftung bei Stellplätzen, die nur mit einem entsprechenden Parkrausweis genutzt werden dürfen. Sind (insbesondere an Zonengrenzen) mehrere Parkzonen berechtigt, sind diese üblicherweise als semikolongetrennte Liste aufgeführt.',
        values: [],
      },
      {
        key: 'mapillary',
        type: 'sanitized_strings',
        label: 'Mapillary',
        description: 'Mapillary-Foto-ID für dieses Feature.',
        values: [],
      },
      {
        key: 'traffic_sign',
        type: 'sanitized_strings',
        label: 'Verkehrszeichen',
        description: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
        values: [],
      },
      {
        key: '_staggered_maneuvering_loss',
        type: 'number',
        label: '(Intern) Manövrierraumverlust (alternierendes Parken)',
        purpose: 'qa',
        description: 'Interner Wert aus der Kapazitätsberechnung bei alternierendem Parken',
        values: [],
      },
      {
        key: '_staggered_original_capacity',
        type: 'number',
        label: '(Intern) Ursprüngliche Kapazität (vor Staggered-Anpassung)',
        purpose: 'qa',
        description: 'Interner Zwischenwert vor Anwendung der alternierenden-Parken-Logik',
        values: [],
      },
    ],
    chapters: [
      {
        id: 'capacity-calculation',
        title: 'Berechnung der Kapazität',
        markdown:
          'Kapazitätswerte stammen je nach Datenlage aus unterschiedlichen Quellen:\n\n- Direkte OSM-Tag-Angaben (`capacity`, inkl. Schätzungsvarianten)\n- Flächen- und ausrichtungsbasierte Schätzung\n- Längen- und ausrichtungsbasierte Schätzung\n- Konservative Standardannahmen bei fehlenden Angaben\n\nBei Segmenten mit alternierendem Parken wird die Kapazität reduziert, um realistische Manövrierverluste abzubilden.\n\nDie genaue Herleitung ist im Feld `capacity_source` nachvollziehbar dokumentiert.\n',
      },
      {
        id: 'condition-category',
        title: 'Parkbeschränkung',
        markdown:
          'Unter dem Wert "Parkbeschränkungen" (`condition_category`) wird eine Semikolon getrennte Liste ausgeliefert die verschiedene Parkbeschränkungen beschreibt.\n\nBeispiele:\n\n| Wert                                                      | Übersetzung                                                                       |\n| --------------------------------------------------------- | --------------------------------------------------------------------------------- |\n| `access_restriction (agricultural)`                       | Zugangsbeschränkung (Land-/Forstwirtschaftlicher Verkehr)                         |\n| `access_restriction (no, Tu 15:00-18:00)`                 | Zugangsbeschränkung (kein Zugang, Dienstag 15:00-18:00)                           |\n| `access_restriction (Mo-Fr 04:30-20:00, PH off)`          | Zugangsbeschränkung (Montag-Freitag 04:30-20:00, Feiertag ausgenommen)            |\n| `disabled (except emergency)`                             | Behindertenparkplatz (ausgenommen Einsatz-/Krankenfahrzeuge)                      |\n| `paid (stay > 1 hour)`                                    | Nur mit Parkschein (Parkdauer > 1 Stunde)                                         |\n| `time_limited (2 days)`                                   | Höchstparkdauer (2 Tage)                                                          |\n| `time_limited (4 hours) (08:00-18:00)`                    | Höchstparkdauer (4 Stunden) (08:00-18:00)                                         |\n| `vehicle_restriction (only motorcar, motorcycle)`         | Beschränkung auf Fahrzeugklassen (nur Pkw, Motorräder)                            |\n| `vehicle_restriction (only delivery) (Mo-Sa 07:00-20:00)` | Beschränkung auf Fahrzeugklassen (nur Lieferverkehr) (Montag-Samstag 07:00-20:00) |\n\nIn der TILDA Inspektor-Ansicht werden diese Werte übersetzt dargestellt. In der Attributtabelle sind sie aber nur beispielhaft in ihrer einfachsten Form angegeben. Ebenso kann die Masterportal-Übersetzungs-Tabelle dieser Werte leider nicht übersetzen.\n',
      },
    ],
  },
  parkings_quantized: {
    topic: 'parking',
    tableName: 'parkings_quantized',
    sourceIds: ['tilda_parkings_quantized'],
    title: 'Straßenparken (quantisiert)',
    summary:
      'Punktförmige, quantisierte Ableitung aus `parkings` für rechnerische Auswertungen. Teilt die fachlichen Übersetzungen mit der Basistabelle über refs.',
    groups: [
      {
        id: 'parking',
        label: 'Parkraum-Prozessierung',
      },
    ],
    attributes: [
      {
        key: 'parking',
        type: 'string',
        label: 'Parkposition',
        description: 'Lage oder Art des Parkraums im Straßenland.',
        values: [
          {
            value: 'lane',
            label: 'Auf der Fahrbahn',
          },
          {
            value: 'half_on_kerb',
            label: 'Halb auf dem Gehweg',
          },
          {
            value: 'on_kerb',
            label: 'Ganz auf dem Gehweg',
          },
          {
            value: 'no_parking',
            label: 'Eingeschränktes Haltverbot',
          },
          {
            value: 'no_stopping',
            label: 'Absolutes Haltverbot',
          },
          {
            value: 'separate',
            label: 'Parkraum als separate Geometrie erfasst',
          },
          {
            value: 'shoulder',
            label: 'Auf dem Seitenstreifen',
          },
          {
            value: 'street_side',
            label: 'Parkbucht',
          },
          {
            value: 'yes',
            label: 'Nicht näher bestimmtes Straßenparken',
          },
          {
            value: 'no',
            label: 'Kein Parken (Sonstiger/Unbekannter Grund)',
          },
          {
            value: 'no_standing',
            label: 'Nur kurzes Halten erlaubt',
          },
          {
            value: 'missing',
            label: 'Daten in OSM fehlen',
          },
          {
            value: 'not_expected',
            label: 'Kein Parken zu erwarten',
          },
        ],
      },
      {
        key: 'capacity',
        type: 'number',
        label: 'Stellplatzanzahl',
        description: 'Geschätzte oder explizit erfasste Anzahl von Stellplätzen.',
        chapterRefs: ['capacity-calculation'],
        values: [],
      },
      {
        key: 'orientation',
        type: 'string',
        label: 'Ausrichtung',
        description: 'Ausrichtung der Fahrzeuge im Straßenland zur Verkehrsrichtung.',
        values: [
          {
            value: 'parallel',
            label: 'Parallelparken',
          },
          {
            value: 'perpendicular',
            label: 'Querparken',
          },
          {
            value: 'diagonal',
            label: 'Schrägparken',
          },
        ],
      },
      {
        key: 'condition_category',
        type: 'string',
        label: 'Parkbeschränkung',
        chapterRefs: ['condition-category'],
        values: [
          {
            value: 'access_restriction',
            label: 'Zugangsbeschränkung',
          },
          {
            value: 'assumed_free',
            label: 'Wahrscheinlich keine Parkbeschränkungen',
          },
          {
            value: 'assumed_private',
            label: 'Sehr wahrscheinlich privat',
          },
          {
            value: 'bus_lane',
            label: 'Bussonderfahrstreifen',
          },
          {
            value: 'car_sharing',
            label: 'Nur für Carsharing-Fahrzeuge',
          },
          {
            value: 'charging',
            label: 'Laden von Elektrofahrzeugen',
          },
          {
            value: 'disabled',
            label: 'Behindertenparkplatz',
          },
          {
            value: 'disabled_private',
            label: 'Personenbezogener Behindertenparkplatz',
          },
          {
            value: 'free',
            label: 'Keine Parkbeschränkungen',
          },
          {
            value: 'loading',
            label: 'Ladezone',
          },
          {
            value: 'maxweight',
            label: 'Gewichtsbegrenzung',
          },
          {
            value: 'mixed',
            label: 'Nur mit Parkschein oder Bewohnerparkausweis',
          },
          {
            value: 'no_parking',
            label: 'Eingeschränktes Haltverbot',
          },
          {
            value: 'no_standing',
            label: 'Nur kurzes Halten erlaubt',
          },
          {
            value: 'no_stopping',
            label: 'Absolutes Haltverbot',
          },
          {
            value: 'paid',
            label: 'Nur mit Parkschein',
          },
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'residents',
            label: 'Nur mit Bewohnerparkausweis',
          },
          {
            value: 'taxi',
            label: 'Taxenstand',
          },
          {
            value: 'time_limited',
            label: 'Höchstparkdauer',
          },
          {
            value: 'unspecified',
            label: 'Unbestimmt',
          },
          {
            value: 'vehicle_restriction',
            label: 'Beschränkung auf Fahrzeugklassen',
          },
        ],
      },
      {
        key: 'staggered',
        type: 'string',
        label: 'Parkweise',
        description:
          'Besondere Merkmale zur Parkweise, insbesondere bei alternierendem/versetztem Parken auf Fahrbahnen, die zu schmal sind um auf beiden Seiten gleichzeitig zu parken, keine Markierungen und Beschilderungen aufweisen, die das Parken regeln und auf denen gewöhnlich wechselseitig abschnittsweise auf der einen oder anderen Straßenseite geparkt wird oder geparkt werden kann.',
        values: [
          {
            value: 'yes',
            label: 'Alternierendes Parken',
            description:
              'Auf diesem Abschnitt ist die Fahrbahn zu schmal, um auf beiden Seiten gleichzeitig zu parken. Es gibt keine Markierungen oder Schilder, die das Parken regeln. Häufig entwickeln sich örtliche Konventionen, in welchen Bereichen auf welcher Seite geparkt wird. In die Kapazitätsberechnung fließt das ein: Die Kapazität wird um 50% reduziert (da nur eine Seite genutzt werden kann) und zusätzlich wird für jeden 60m-Abschnitt ein Manövrierraumverlust von 10m (≈1,9 Fahrzeugplätze) abgezogen, da beim Seitenwechsel Manövrierraum benötigt wird. Diese Angaben basieren auf Erfahrungswerten und können lediglich eine Schätzung des tatsächlichen Parkgeschehens abbilden.',
            chapterRefs: ['capacity-calculation'],
          },
          {
            value: 'no',
            label: 'Nicht alternierend',
          },
        ],
      },
      {
        key: 'length',
        type: 'meter',
        label: 'Länge',
        description:
          'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
        values: [],
      },
      {
        key: 'category',
        type: 'string',
        label: 'Kategorie',
        values: [
          {
            value: 'bus_stop',
            label: 'Bushaltestelle',
          },
          {
            value: 'tree',
            label: 'Baum',
          },
          {
            value: 'crossing_marked',
            label: 'Markierter Überweg',
          },
        ],
      },
      {
        key: 'source',
        type: 'string',
        label: 'Datenquelle',
        description: 'Datenquelle der Parkraumgeometrie aus OpenStreetMap.',
        values: [
          {
            value: 'parkings',
            label: 'Angaben an der Straßenlinie',
          },
          {
            value: 'separate_parking_areas',
            label: 'Separat erfasste Flächendaten',
          },
          {
            value: 'separate_parking_points',
            label: 'Separate erfasste Punktdaten',
          },
        ],
      },
      {
        key: 'geom_sources',
        type: 'sanitized_strings',
        label: '(Intern) OSM-IDs der Geometiren',
        purpose: 'qa',
        description:
          'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs die für eine Geometrie verwendeten wurden.',
        values: [],
      },
      {
        key: 'tag_sources',
        type: 'sanitized_strings',
        label: 'Tag-Quellen',
        purpose: 'qa',
        description:
          'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs aus denen die OSM-Tags abgeleitet wurden.',
        values: [],
      },
      {
        key: 'road',
        type: 'string',
        label: 'Straßentyp',
        description: 'Art der Straße, an dem der Parkraum liegt.',
        values: [
          {
            value: 'bicycle_road',
            label: 'Fahrradstraße',
          },
          {
            value: 'construction',
            label: 'Straße ist in Bau',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway',
            label: 'Radweg',
          },
          {
            value: 'footway_cycleway_crossing',
            label: 'Straßenquerung (Fußverkehr)',
          },
          {
            value: 'footway_sidewalk',
            label: 'Gehweg',
          },
          {
            value: 'footway',
            label: 'Fußweg',
          },
          {
            value: 'living_street',
            label: 'Verkehrsberuhigter Bereich',
          },
          {
            value: 'motorway_link',
            label: 'Zufahrt einer Autobahn',
          },
          {
            value: 'motorway',
            label: 'Autobahn',
          },
          {
            value: 'path',
            label: 'Weg / Pfad',
          },
          {
            value: 'pedestrian',
            label: 'Fußgängerzone',
          },
          {
            value: 'primary_link',
            label: 'Zufahrt einer Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'primary',
            label: 'Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'residential',
            label: 'Anwohnerstraße',
          },
          {
            value: 'residential_priority_road',
            label: 'residential_priority_road',
          },
          {
            value: 'secondary_link',
            label: 'Zufahrt einer Landes&shy;straße/wichtigen Durchgangs&shy;straße',
          },
          {
            value: 'secondary',
            label: 'Landes&shy;straße/Wichtige Durchgangs&shy;straße',
          },
          {
            value: 'service_alley',
            label: 'Gasse',
          },
          {
            value: 'service_driveway',
            label: 'Grundstückszufahrt',
          },
          {
            value: 'service_emergency_access',
            label: 'Rettungsweg',
          },
          {
            value: 'service_parking_aisle',
            label: 'Parkplatzweg',
          },
          {
            value: 'service_road',
            label: 'Zufahrtsweg',
          },
          {
            value: 'service_uncategorized',
            label: 'Zufahrtsweg (unbekannte Klassifizierung)',
          },
          {
            value: 'service',
            label: 'Zufahrtsweg',
          },
          {
            value: 'steps',
            label: 'Stufen',
          },
          {
            value: 'tertiary_link',
            label: 'Zufahrt einer Kreis&shy;straße/untergeordneten Durchgangs&shy;straße',
          },
          {
            value: 'tertiary',
            label: 'Kreis&shy;straße/Untergeordnete Durchgangs&shy;straße',
          },
          {
            value: 'track',
            label: 'Wald- / Feldweg',
          },
          {
            value: 'unclassified',
            label: 'Nebenstraße mit Verbindungscharakter',
          },
          {
            value: 'unspecified_road',
            label: 'Unkategorisierte Straße',
          },
        ],
      },
      {
        key: 'road_name',
        type: 'sanitized_strings',
        label: 'Straßenname',
        description: 'Name der Straße, an dem der Parkraum liegt.',
        values: [],
      },
      {
        key: 'road_oneway',
        type: 'string',
        label: 'Einbahnstraße',
        description: 'Verkehrsrichtung der Straße, an dem der Parkraum liegt.',
        values: [
          {
            value: 'no',
            label: 'Nein (in beide Richtungen befahrbar)',
          },
          {
            value: 'yes',
            label: 'Einbahnstraße',
          },
          {
            value: 'yes_dual_carriageway',
            label: 'Einbahnstraße (getrennte Richtungsfahrbahnen)',
          },
        ],
      },
      {
        key: 'road_width',
        type: 'meter',
        label: 'Fahrbahnbreite',
        description: 'Breite der Fahrbahn, an dem der Parkraum liegt.',
        values: [],
      },
      {
        key: 'side',
        type: 'string',
        label: 'Straßenseite',
        description: 'Seite des Parkraums relativ zur Linienrichtung der OSM-Geometrie.',
        values: [
          {
            value: 'left',
            label: 'Links',
          },
          {
            value: 'right',
            label: 'Rechts',
          },
        ],
      },
      {
        key: 'area',
        type: 'square_meter',
        label: 'Fläche',
        description:
          'Fläche des durch parkende Fahrzeuge auf diesem Parkraumabschnitt belegten Raumes in Quadratmetern.',
        values: [],
      },
      {
        key: 'surface',
        type: 'string',
        label: 'Oberfläche',
        description: 'Oberflächenbelag des Parkraumabschnitts.',
        values: [
          {
            value: 'asphalt',
            label: 'Asphalt',
          },
          {
            value: 'paved',
            label: 'Befestigt (unspezifisch)',
          },
          {
            value: 'unpaved',
            label: 'Unbefestigt',
          },
          {
            value: 'concrete',
            label: 'Beton',
          },
          {
            value: 'concrete:plates',
            label: 'Betonplatten',
          },
          {
            value: 'concrete:lanes',
            label: 'Betonstreifen / -bahnen',
          },
          {
            value: 'paving_stones',
            label: 'Verbund&shy;pflastersteine',
          },
          {
            value: 'paving_stones:lanes',
            label: 'Pflasterstein&shy;bahnen',
          },
          {
            value: 'sett',
            label: 'Behauenes Pflaster / Natursteinpflaster',
          },
          {
            value: 'mosaic_sett',
            label: 'Mosaikpflaster',
          },
          {
            value: 'small_sett',
            label: 'Kleinpflaster',
          },
          {
            value: 'large_sett',
            label: 'Großpflaster',
          },
          {
            value: 'bricks',
            label: 'Ziegel',
          },
          {
            value: 'stone',
            label: 'Stein',
          },
          {
            value: 'ground',
            label: 'Erde/Boden',
          },
          {
            value: 'grass',
            label: 'Gras',
          },
          {
            value: 'sand',
            label: 'Sand',
          },
          {
            value: 'compacted',
            label: 'Verdichteter Untergrund',
          },
          {
            value: 'fine_gravel',
            label: 'Splitt',
          },
          {
            value: 'gravel',
            label: 'Schotter',
          },
          {
            value: 'pebblestone',
            label: 'Kieselsteine',
          },
          {
            value: 'wood',
            label: 'Holz',
          },
          {
            value: 'woodchips',
            label: 'Hackschnitzel',
          },
          {
            value: 'metal',
            label: 'Metall',
          },
          {
            value: 'metal_grid',
            label: 'Metallgitter',
          },
          {
            value: 'plastic',
            label: 'Kunststoff',
          },
          {
            value: 'rubber',
            label: 'Gummi',
          },
          {
            value: 'grass_paver',
            label: 'Rasengitter / Grasgitter',
          },
        ],
      },
      {
        key: 'direction',
        type: 'string',
        label: 'Einparkrichtung',
        description: 'Vorgesehene oder ausgeschilderte Fahrzeugrichtung beim Einparken.',
        values: [
          {
            value: 'back_in',
            label: 'Rückwärts einparken',
          },
          {
            value: 'head_in',
            label: 'Vorwärts einparken',
          },
        ],
      },
      {
        key: 'location',
        type: 'string',
        label: 'Lage im Straßenraum',
        description: 'Besondere Lagemerkmale des Parkraums im Straßenland.',
        values: [
          {
            value: 'lane_centre',
            label: 'Fahrbahnmitte',
          },
          {
            value: 'median',
            label: 'Mittelstreifen',
          },
        ],
      },
      {
        key: 'markings',
        type: 'string',
        label: 'Markierungen',
        values: [
          {
            value: 'no',
            label: 'Ohne Markierungen',
          },
          {
            value: 'yes',
            label: 'Mit Markierungen',
          },
        ],
      },
      {
        key: 'covered',
        type: 'string',
        label: 'Überdacht',
        values: [
          {
            value: 'partial',
            label: 'Teilweise überdacht',
          },
          {
            value: 'yes',
            label: 'Überdacht',
          },
        ],
      },
      {
        key: 'access',
        type: 'string',
        label: 'Zugang',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'customers',
            label: 'Kund:innen',
          },
          {
            value: 'destination',
            label: 'Anlieger frei (Nicht-Durchgangsverkehr erlaubt)',
          },
          {
            value: 'employees',
            label: 'Mitarbeiter',
          },
          {
            value: 'permissive',
            label: 'Öffentliche Nutzung geduldet',
          },
          {
            value: 'public',
            label: 'Öffentlich (explizit)',
          },
          {
            value: 'delivery',
            label: 'Lieferverkehr',
          },
          {
            value: 'no',
            label: 'Kein Zugang',
          },
          {
            value: 'permit',
            label: 'Mit Genehmigung',
          },
          {
            value: 'residents',
            label: 'Nur mit Bewohnerparkausweis',
          },
        ],
      },
      {
        key: 'operator_type',
        type: 'string',
        label: 'Betreibertyp',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'public',
            label: 'Öffentlich',
          },
        ],
      },
      {
        key: 'operator_type_source',
        type: 'string',
        label: 'Herkunft des Betreibertyps',
        purpose: 'qa',
        values: [
          {
            value: 'default_fallback',
            label: 'Annahme bei fehlender Angabe.',
          },
          {
            value: 'driveway_inference',
            label: 'Annahme bei fehlender Angabe wenn eine Einfahrt erkannt wurde.',
          },
          {
            value: 'manual_overwrite_list',
            label: 'Anhand einer manuellen Korrekturliste in TILDA.',
          },
          {
            value: 'parent_highway_tag',
            label: 'Explizite Angabe aus OSM an der zugeordneten Straße.',
          },
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM.',
          },
        ],
      },
      {
        key: 'operator_type_confidence',
        type: 'string',
        label: 'Konfidenz des Betreibertyps',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'informal',
        type: 'string',
        label: 'Duldung',
        values: [
          {
            value: 'yes',
            label: 'Parken im rechtlichen Graubereich oder etabliertes, geduldetes Falschparken.',
          },
        ],
      },
      {
        key: 'zone',
        type: 'sanitized_strings',
        label: 'Parkzone',
        description:
          'Parkzonennummer oder -bezeichnung entsprechend der lokalen Parkraumbewirtschaftung bei Stellplätzen, die nur mit einem entsprechenden Parkrausweis genutzt werden dürfen. Sind (insbesondere an Zonengrenzen) mehrere Parkzonen berechtigt, sind diese üblicherweise als semikolongetrennte Liste aufgeführt.',
        values: [],
      },
      {
        key: 'reason',
        type: 'string',
        label: 'Grund',
        description: 'Angabe eines Grundes bei Nicht-Parken.',
        values: [
          {
            value: 'missing_data',
            label: 'Keine Parkraum-Daten in OpenStreetMap erfasst',
          },
          {
            value: 'parking_tag',
            label: 'Explizite Angabe in den Daten',
          },
          {
            value: 'restriction_no_parking',
            label: 'Explizites Parkverbot aus OSM',
          },
          {
            value: 'restriction_no_stopping',
            label: 'Explizites Halteverbot aus OSM',
          },
          {
            value: 'restriction_no_standing',
            label: 'Eingeschränktes Halteverbot aus OSM',
          },
          {
            value: 'bus_stop',
            label: 'Haltestelle',
          },
          {
            value: 'cycleway',
            label: 'Radverkehrsanlage',
          },
          {
            value: 'dual_carriage',
            label: 'Getrennte Richtungsfahrbahnen',
          },
          {
            value: 'junction',
            label: 'Knotenpunkt / Einmündung',
          },
          {
            value: 'narrow',
            label: 'Zu schmale Fahrbahn',
          },
        ],
      },
      {
        key: 'mapillary',
        type: 'sanitized_strings',
        label: 'Mapillary',
        description: 'Mapillary-Foto-ID für dieses Feature.',
        values: [],
      },
      {
        key: 'traffic_sign',
        type: 'sanitized_strings',
        label: 'Verkehrszeichen',
        description: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
        values: [],
      },
      {
        key: '_staggered_maneuvering_loss',
        type: 'number',
        label: '(Intern) Manövrierraumverlust (alternierendes Parken)',
        purpose: 'qa',
        description: 'Interner Wert aus der Kapazitätsberechnung bei alternierendem Parken',
        values: [],
      },
      {
        key: '_staggered_original_capacity',
        type: 'number',
        label: '(Intern) Ursprüngliche Kapazität (vor Staggered-Anpassung)',
        purpose: 'qa',
        description: 'Interner Zwischenwert vor Anwendung der alternierenden-Parken-Logik',
        values: [],
      },
    ],
    chapters: [
      {
        id: 'capacity-calculation',
        title: 'Berechnung der Kapazität',
        markdown:
          'Kapazitätswerte stammen je nach Datenlage aus unterschiedlichen Quellen:\n\n- Direkte OSM-Tag-Angaben (`capacity`, inkl. Schätzungsvarianten)\n- Flächen- und ausrichtungsbasierte Schätzung\n- Längen- und ausrichtungsbasierte Schätzung\n- Konservative Standardannahmen bei fehlenden Angaben\n\nBei Segmenten mit alternierendem Parken wird die Kapazität reduziert, um realistische Manövrierverluste abzubilden.\n\nDie genaue Herleitung ist im Feld `capacity_source` nachvollziehbar dokumentiert.\n',
      },
      {
        id: 'condition-category',
        title: 'Parkbeschränkung',
        markdown:
          'Unter dem Wert "Parkbeschränkungen" (`condition_category`) wird eine Semikolon getrennte Liste ausgeliefert die verschiedene Parkbeschränkungen beschreibt.\n\nBeispiele:\n\n| Wert                                                      | Übersetzung                                                                       |\n| --------------------------------------------------------- | --------------------------------------------------------------------------------- |\n| `access_restriction (agricultural)`                       | Zugangsbeschränkung (Land-/Forstwirtschaftlicher Verkehr)                         |\n| `access_restriction (no, Tu 15:00-18:00)`                 | Zugangsbeschränkung (kein Zugang, Dienstag 15:00-18:00)                           |\n| `access_restriction (Mo-Fr 04:30-20:00, PH off)`          | Zugangsbeschränkung (Montag-Freitag 04:30-20:00, Feiertag ausgenommen)            |\n| `disabled (except emergency)`                             | Behindertenparkplatz (ausgenommen Einsatz-/Krankenfahrzeuge)                      |\n| `paid (stay > 1 hour)`                                    | Nur mit Parkschein (Parkdauer > 1 Stunde)                                         |\n| `time_limited (2 days)`                                   | Höchstparkdauer (2 Tage)                                                          |\n| `time_limited (4 hours) (08:00-18:00)`                    | Höchstparkdauer (4 Stunden) (08:00-18:00)                                         |\n| `vehicle_restriction (only motorcar, motorcycle)`         | Beschränkung auf Fahrzeugklassen (nur Pkw, Motorräder)                            |\n| `vehicle_restriction (only delivery) (Mo-Sa 07:00-20:00)` | Beschränkung auf Fahrzeugklassen (nur Lieferverkehr) (Montag-Samstag 07:00-20:00) |\n\nIn der TILDA Inspektor-Ansicht werden diese Werte übersetzt dargestellt. In der Attributtabelle sind sie aber nur beispielhaft in ihrer einfachsten Form angegeben. Ebenso kann die Masterportal-Übersetzungs-Tabelle dieser Werte leider nicht übersetzen.\n',
      },
    ],
  },
  places: {
    topic: 'places',
    tableName: 'places',
    sourceIds: ['atlas_places'],
    title: 'Daten zu Orten',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'place',
        type: 'string',
        label: 'Ortskategorie',
        values: [
          {
            value: 'borough',
            label: 'Stadtteil/Stadtbezirk',
          },
          {
            value: 'city',
            label: 'Stadt',
          },
          {
            value: 'hamlet',
            label: 'Siedlung',
          },
          {
            value: 'suburb',
            label: 'Stadtteil',
          },
          {
            value: 'town',
            label: 'Stadt oder große Gemeinde',
          },
          {
            value: 'village',
            label: 'Dorf',
          },
        ],
      },
      {
        key: 'capital',
        type: 'string',
        label: 'Hauptstadtstatus',
        values: [],
      },
      {
        key: 'population',
        type: 'population_label',
        label: 'Einwohner:innen-Anzahl',
        values: [],
      },
      {
        key: 'population_date',
        type: 'date',
        label: 'Datum der Quelle der Einwohner:innen-Anzahl',
        values: [],
      },
      {
        key: 'admin_level',
        type: 'number',
        label: 'Admin-Level',
        values: [],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
      {
        key: 'website',
        type: 'sanitized_strings',
        label: 'Website',
        values: [],
      },
      {
        key: 'wikidata',
        type: 'sanitized_strings',
        label: 'Wikidata',
        values: [],
      },
      {
        key: 'wikipedia',
        type: 'sanitized_strings',
        label: 'Wikipedia',
        values: [],
      },
    ],
    chapters: [],
  },
  poiClassification: {
    topic: 'poiClassification',
    tableName: 'poiClassification',
    sourceIds: ['atlas_poiClassification'],
    title: 'Daten zu Start-Ziel-Punkten',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name POI',
        values: [],
      },
      {
        key: 'addr_street',
        type: 'sanitized_strings',
        label: 'Straße',
        values: [],
      },
      {
        key: 'addr_zip',
        type: 'sanitized_strings',
        label: 'Postleitzahl',
        values: [],
      },
      {
        key: 'addr_city',
        type: 'sanitized_strings',
        label: 'Ort',
        values: [],
      },
      {
        key: 'addr_number',
        type: 'sanitized_strings',
        label: 'Hausnummer',
        values: [],
      },
      {
        key: 'category',
        type: 'string',
        label: 'Kategorisierung des POI',
        values: [
          {
            value: 'Grundversorgung',
            label: 'Grundversorgung',
          },
          {
            value: 'Bildung',
            label: 'Bildung',
          },
          {
            value: 'Einkauf',
            label: 'Einkauf',
          },
          {
            value: 'Freizeit',
            label: 'Freizeit',
          },
        ],
      },
      {
        key: 'type',
        type: 'string',
        label: 'Detail-Kategorie',
        values: [
          {
            value: 'leisure-pitch',
            label: 'Sportplatz',
          },
          {
            value: 'leisure-playground',
            label: 'Spielplatz',
          },
          {
            value: 'amenity-restaurant',
            label: 'Restaurant',
          },
          {
            value: 'amenity-place_of_worship',
            label: 'Andachtsstätte',
          },
          {
            value: 'amenity-kindergarten',
            label: 'Kindergarten',
          },
          {
            value: 'tourism-artwork',
            label: 'Kunst',
          },
          {
            value: 'amenity-fast_food',
            label: 'Schnellimbiss',
          },
          {
            value: 'shop-hairdresser',
            label: 'Friseur',
          },
          {
            value: 'amenity-doctors',
            label: 'Arzt',
          },
          {
            value: 'leisure-sports_centre',
            label: 'Sportzentrum / -komplex',
          },
          {
            value: 'amenity-school',
            label: 'Schule',
          },
          {
            value: 'shop-clothes',
            label: 'Bekleidungsgeschäft',
          },
          {
            value: 'shop-supermarket',
            label: 'Supermarkt',
          },
          {
            value: 'shop-bakery',
            label: 'Bäckerei',
          },
          {
            value: 'amenity-cafe',
            label: 'Café',
          },
          {
            value: 'tourism-picnic_site',
            label: 'Picknickplatz',
          },
          {
            value: 'tourism-viewpoint',
            label: 'Aussichtspunkt',
          },
          {
            value: 'amenity-social_facility',
            label: 'Sozialeinrichtung',
          },
          {
            value: 'tourism-hotel',
            label: 'Hotel',
          },
          {
            value: 'shop-car_repair',
            label: 'Autowerkstatt',
          },
          {
            value: 'leisure-swimming_pool',
            label: 'Schwimmbecken',
          },
          {
            value: 'tourism-attraction',
            label: 'Sehenswürdigkeit',
          },
          {
            value: 'amenity-bank',
            label: 'Bank-Filiale',
          },
          {
            value: 'amenity-community_centre',
            label: 'Gemeindezentrum',
          },
          {
            value: 'shop-car',
            label: 'Autohändler',
          },
          {
            value: 'amenity-fuel',
            label: 'Tankstelle',
          },
          {
            value: 'amenity-pharmacy',
            label: 'Apotheke',
          },
          {
            value: 'amenity-dentist',
            label: 'Zahnarzt',
          },
          {
            value: 'amenity-pub',
            label: 'Kneipe',
          },
          {
            value: 'tourism-guest_house',
            label: 'Pension',
          },
          {
            value: 'shop-beauty',
            label: 'Schönheitssalon',
          },
          {
            value: 'tourism-chalet',
            label: 'Ferienhaus',
          },
          {
            value: 'shop-kiosk',
            label: 'Kiosk',
          },
          {
            value: 'shop-florist',
            label: 'Blumenhändler',
          },
          {
            value: 'shop-butcher',
            label: 'Metzgerei',
          },
          {
            value: 'amenity-post_office',
            label: 'Postfiliale',
          },
          {
            value: 'amenity-car_wash',
            label: 'Autowäsche',
          },
          {
            value: 'shop-convenience',
            label: 'Minimarkt',
          },
          {
            value: 'tourism-museum',
            label: 'Museum',
          },
          {
            value: 'shop-optician',
            label: 'Optiker',
          },
          {
            value: 'shop-beverages',
            label: 'Getränkehandel',
          },
          {
            value: 'amenity-driving_school',
            label: 'Fahrschule',
          },
          {
            value: 'amenity-bar',
            label: 'Bar',
          },
          {
            value: 'amenity-townhall',
            label: 'Rathaus, Gemeindeamt',
          },
          {
            value: 'shop-vacant',
            label: 'Leerstehendes Geschäft',
          },
          {
            value: 'shop-bicycle',
            label: 'Fahrradladen',
          },
          {
            value: 'tourism-camp_pitch',
            label: 'Zeltplatz/Wohnwagenplatz',
          },
          {
            value: 'leisure-fitness_centre',
            label: 'Fitness-Studio',
          },
          {
            value: 'shop-shoes',
            label: 'Schuhgeschäft',
          },
          {
            value: 'shop-jewelry',
            label: 'Juwelier',
          },
          {
            value: 'shop-farm',
            label: 'Hofladen',
          },
          {
            value: 'shop-furniture',
            label: 'Möbelhaus',
          },
          {
            value: 'leisure-sports_hall',
            label: 'Sporthalle',
          },
          {
            value: 'shop-travel_agency',
            label: 'Reisebüro',
          },
          {
            value: 'amenity-library',
            label: 'Bibliothek',
          },
          {
            value: 'amenity-biergarten',
            label: 'Biergarten',
          },
          {
            value: 'amenity-ice_cream',
            label: 'Eisgeschäft',
          },
          {
            value: 'shop-chemist',
            label: 'Drogerie',
          },
          {
            value: 'shop-doityourself',
            label: 'Heimwerkerladen',
          },
          {
            value: 'amenity-veterinary',
            label: 'Tierarztpraxis',
          },
          {
            value: 'amenity-bicycle_rental',
            label: 'Fahrradverleih',
          },
          {
            value: 'leisure-horse_riding',
            label: 'Reitanlage',
          },
          {
            value: 'amenity-bbq',
            label: 'Grill',
          },
          {
            value: 'shop-mobile_phone',
            label: 'Mobiltelefonladen',
          },
          {
            value: 'shop-electronics',
            label: 'Elektronikfachgeschäft',
          },
          {
            value: 'shop-variety_store',
            label: 'Sonderpostenmarkt',
          },
          {
            value: 'shop-books',
            label: 'Buchhandlung',
          },
          {
            value: 'shop-gift',
            label: 'Geschenkeladen',
          },
          {
            value: 'tourism-camp_site',
            label: 'Campingplatz',
          },
          {
            value: 'tourism-caravan_site',
            label: 'Wohnmobil-Stellplatz',
          },
          {
            value: 'shop-funeral_directors',
            label: 'Beerdigungsinstitut',
          },
          {
            value: 'shop-interior_decoration',
            label: 'Innenausstattungsgeschäft',
          },
          {
            value: 'shop-massage',
            label: 'Massagesalon',
          },
          {
            value: 'shop-tailor',
            label: 'Schneider',
          },
          {
            value: 'shop-hearing_aids',
            label: 'Hörgerätegeschäft',
          },
          {
            value: 'amenity-childcare',
            label: 'Kinderbetreuung',
          },
          {
            value: 'shop-garden_centre',
            label: 'Gartenzentrum',
          },
          {
            value: 'tourism-information',
            label: 'Information',
          },
          {
            value: 'shop-medical_supply',
            label: 'Sanitätshaus',
          },
          {
            value: 'leisure-water_park',
            label: 'Erlebnisbad',
          },
          {
            value: 'amenity-theatre',
            label: 'Theater',
          },
          {
            value: 'shop-sports',
            label: 'Sportgeschäft',
          },
          {
            value: 'shop-pet',
            label: 'Zoofachgeschäft',
          },
          {
            value: 'shop-tattoo',
            label: 'Tätowierer',
          },
          {
            value: 'shop-stationery',
            label: 'Schreibwarengeschäft',
          },
          {
            value: 'amenity-clinic',
            label: 'Ärztezentrum',
          },
          {
            value: 'shop-trade',
            label: 'Baustoffhandel',
          },
          {
            value: 'shop-wine',
            label: 'Weinhandel',
          },
          {
            value: 'leisure-stadium',
            label: 'Stadion',
          },
          {
            value: 'amenity-events_venue',
            label: 'Veranstaltungsstätte',
          },
          {
            value: 'shop-yes',
            label: 'Geschäft (nicht spezifizierter Typ)',
          },
          {
            value: 'shop-cosmetics',
            label: 'Kosmetikladen',
          },
          {
            value: 'amenity-hospital',
            label: 'Krankenhaus',
          },
          {
            value: 'shop-deli',
            label: 'Feinkostladen',
          },
          {
            value: 'shop-greengrocer',
            label: 'Obst- und Gemüseladen',
          },
          {
            value: 'tourism-hostel',
            label: 'Hostel',
          },
          {
            value: 'amenity-car_rental',
            label: 'Autovermietung',
          },
          {
            value: 'amenity-arts_centre',
            label: 'Kunstzentrum',
          },
          {
            value: 'shop-computer',
            label: 'Fachgeschäft für Computer',
          },
          {
            value: 'amenity-marketplace',
            label: 'Marktplatz',
          },
          {
            value: 'shop-laundry',
            label: 'Wäscherei',
          },
          {
            value: 'amenity-college',
            label: 'Hochschule',
          },
          {
            value: 'shop-toys',
            label: 'Spielwarengeschäft',
          },
          {
            value: 'amenity-music_school',
            label: 'Musikschule',
          },
          {
            value: 'shop-kitchen',
            label: 'Küchenfachmarkt',
          },
          {
            value: 'shop-motorcycle',
            label: 'Motorradhändler',
          },
          {
            value: 'shop-dry_cleaning',
            label: 'Chemische Reinigung',
          },
          {
            value: 'shop-car_parts',
            label: 'Autoteilehandel',
          },
          {
            value: 'amenity-nightclub',
            label: 'Diskothek',
          },
          {
            value: 'shop-alcohol',
            label: 'Spirituosenladen',
          },
          {
            value: 'shop-hardware',
            label: 'Eisenwarenhandel',
          },
          {
            value: 'shop-tyres',
            label: 'Reifenhandel',
          },
          {
            value: 'shop-mall',
            label: 'Einkaufszentrum',
          },
          {
            value: 'shop-department_store',
            label: 'Kaufhaus',
          },
          {
            value: 'shop-ticket',
            label: 'Eintrittskartenverkäufer',
          },
          {
            value: 'shop-art',
            label: 'Kunsthandlung',
          },
          {
            value: 'amenity-university',
            label: 'Universität',
          },
          {
            value: 'shop-second_hand',
            label: 'Second-Hand-Laden',
          },
          {
            value: 'shop-wholesale',
            label: 'Großhandel',
          },
          {
            value: 'amenity-cinema',
            label: 'Kino',
          },
          {
            value: 'shop-newsagent',
            label: 'Zeitschriftenhandel',
          },
          {
            value: 'shop-fabric',
            label: 'Stoffgeschäft',
          },
          {
            value: 'shop-tobacco',
            label: 'Tabakwarengeschäft',
          },
          {
            value: 'amenity-vehicle_inspection',
            label: 'Fahrzeuginspektion',
          },
          {
            value: 'shop-antiques',
            label: 'Antiquitätenhändler',
          },
          {
            value: 'shop-bed',
            label: 'Betten- / Matratzengeschäft',
          },
          {
            value: 'shop-copyshop',
            label: 'Kopierladen',
          },
          {
            value: 'amenity-courthouse',
            label: 'Gericht',
          },
          {
            value: 'shop-photo',
            label: 'Fotofachgeschäft',
          },
          {
            value: 'shop-perfumery',
            label: 'Parfümerie',
          },
          {
            value: 'shop-houseware',
            label: 'Haushaltswarengeschäft',
          },
          {
            value: 'tourism-zoo',
            label: 'Zoo',
          },
          {
            value: 'shop-coffee',
            label: 'Kaffeegeschäft',
          },
          {
            value: 'shop-musical_instrument',
            label: 'Musikinstrumentegeschäft',
          },
          {
            value: 'shop-confectionery',
            label: 'Süßwarenladen',
          },
          {
            value: 'shop-bookmaker',
            label: 'Wettbüro',
          },
          {
            value: 'amenity-gambling',
            label: 'Spielhalle',
          },
          {
            value: 'leisure-swimming_area',
            label: 'Natürlicher Badebereich',
          },
          {
            value: 'shop-seafood',
            label: 'Fischgeschäft',
          },
          {
            value: 'shop-craft',
            label: 'Geschäft für Künstlerbedarf',
          },
          {
            value: 'leisure-picnic_table',
            label: 'Picknicktisch',
          },
          {
            value: 'shop-paint',
            label: 'Farbengeschäft',
          },
          {
            value: 'amenity-public_building',
            label: 'Öffentliches Gebäude',
          },
          {
            value: 'amenity-boat_rental',
            label: 'Bootsvermietung',
          },
          {
            value: 'shop-outdoor',
            label: 'Outdoorgeschäft',
          },
          {
            value: 'shop-locksmith',
            label: 'Schlüsseldienst',
          },
          {
            value: 'amenity-post_depot',
            label: 'Postverteilzentrum',
          },
          {
            value: 'leisure-golf_course',
            label: 'Golfplatz',
          },
          {
            value: 'amenity-casino',
            label: 'Kasino',
          },
          {
            value: 'amenity-prep_school',
            label: 'Vorschule',
          },
          {
            value: 'shop-tea',
            label: 'Teegeschäft',
          },
          {
            value: 'shop-pet_grooming',
            label: 'Tierfriseur',
          },
          {
            value: 'shop-telecommunication',
            label: 'Telekommunikationsfachgeschäft',
          },
          {
            value: 'amenity-social_centre',
            label: 'Sozialzentrum',
          },
          {
            value: 'shop-charity',
            label: 'Sozialkaufhaus',
          },
          {
            value: 'shop-agrarian',
            label: 'Agrarmarkt',
          },
          {
            value: 'shop-hifi',
            label: 'HiFi-Laden',
          },
          {
            value: 'amenity-animal_training',
            label: 'Tiertraining',
          },
          {
            value: 'shop-lottery',
            label: 'Lottoannahmestelle',
          },
          {
            value: 'shop-storage_rental',
            label: 'Lagerraumvermieter',
          },
          {
            value: 'shop-bathroom_furnishing',
            label: 'Badeinrichtungsgeschäft',
          },
          {
            value: 'shop-pastry',
            label: 'Konditorei',
          },
          {
            value: 'shop-electrical',
            label: 'Elektrofachgeschaft',
          },
          {
            value: 'shop-bag',
            label: 'Taschen / Koffergeschäft',
          },
          {
            value: 'shop-music',
            label: 'Musikgeschäft',
          },
          {
            value: 'shop-rental',
            label: 'Verleih',
          },
          {
            value: 'shop-tiles',
            label: 'Fliesenhändler',
          },
          {
            value: 'amenity-dojo',
            label: 'Kampfsportstudio',
          },
          {
            value: 'shop-e-cigarette',
            label: 'E-Zigarettenladen',
          },
          {
            value: 'shop-watches',
            label: 'Uhrengeschäft',
          },
          {
            value: 'leisure-bathing_place',
            label: 'Badeplatz',
          },
          {
            value: 'shop-fireplace',
            label: 'Kachelofenladen',
          },
          {
            value: 'shop-health_food',
            label: 'Reformhaus',
          },
          {
            value: 'amenity-animal_boarding',
            label: 'Tierpension',
          },
          {
            value: 'shop-carpet',
            label: 'Teppichgeschäft',
          },
          {
            value: 'shop-curtain',
            label: 'Vorhanggeschäft',
          },
          {
            value: 'amenity-language_school',
            label: 'Sprachschule',
          },
          {
            value: 'amenity-research_institute',
            label: 'Forschungseinrichtung',
          },
          {
            value: 'shop-fishing',
            label: 'Angelgeschäft',
          },
          {
            value: 'tourism-theme_park',
            label: 'Themenpark',
          },
          {
            value: 'shop-sewing',
            label: 'Geschäft für Nähzubehör',
          },
          {
            value: 'amenity-dancing_school',
            label: 'Tanzschule',
          },
          {
            value: 'shop-erotic',
            label: 'Erotikgeschäft',
          },
          {
            value: 'shop-fashion_accessories',
            label: 'Geschäft für Modeaccessoires',
          },
          {
            value: 'shop-general',
            label: 'Gemischtwarenhandlung',
          },
          {
            value: 'shop-boutique',
            label: 'Boutique',
          },
          {
            value: 'shop-leather',
            label: 'Lederwarengeschäft',
          },
          {
            value: 'amenity-stables',
            label: 'Reitstall',
          },
          {
            value: 'amenity-canteen',
            label: 'Kantine',
          },
          {
            value: 'shop-baby_goods',
            label: 'Babyausstattung',
          },
          {
            value: 'leisure-park',
            label: 'Park',
          },
          {
            value: 'shop-appliance',
            label: 'Haushaltselektrogerätegeschäft',
          },
          {
            value: 'shop-pottery',
            label: 'Keramikladen',
          },
          {
            value: 'amenity-traffic_park',
            label: 'Verkehrsübungsplatz',
          },
          {
            value: 'amenity-prison',
            label: 'Gefängnisanlage',
          },
          {
            value: 'shop-caravan',
            label: 'Wohnwagengeschäft',
          },
          {
            value: 'shop-lighting',
            label: 'Leuchten- und Lampengeschäft',
          },
          {
            value: 'shop-pawnbroker',
            label: 'Pfandleihe',
          },
          {
            value: 'shop-cheese',
            label: 'Käseladen',
          },
          {
            value: 'shop-motorcycle_repair',
            label: 'Motorradwerkstatt',
          },
          {
            value: 'tourism-motel',
            label: 'Motel',
          },
          {
            value: 'shop-frame',
            label: 'Bilderrahmengeschäft',
          },
          {
            value: 'shop-window_blind',
            label: 'Fensterladengeschäft',
          },
          {
            value: 'shop-chocolate',
            label: 'Schokoladenladen',
          },
          {
            value: 'shop-weapons',
            label: 'Waffengeschäft',
          },
          {
            value: 'leisure-beach_resort',
            label: 'Strandresort',
          },
          {
            value: 'tourism-gallery',
            label: 'Kunstgalerie',
          },
          {
            value: 'shop-shoe_repair',
            label: 'Schuhreparatur',
          },
          {
            value: 'shop-repair',
            label: 'Reparaturgeschäft',
          },
          {
            value: 'shop-model',
            label: 'Modellbaugeschäft',
          },
          {
            value: 'shop-glaziery',
            label: 'Glaserei',
          },
          {
            value: 'shop-estate_agent',
            label: 'Immobilienbüro',
          },
          {
            value: 'shop-wool',
            label: 'Wollladen',
          },
          {
            value: 'shop-honey',
            label: 'Honiggeschäft',
          },
          {
            value: 'shop-flooring',
            label: 'Fußbodengeschäft',
          },
          {
            value: 'amenity-internet_cafe',
            label: 'Internetcafé',
          },
          {
            value: 'shop-gas',
            label: 'Gasflaschenverkauf',
          },
          {
            value: 'shop-gold_buyer',
            label: 'Goldankauf',
          },
          {
            value: 'leisure-firepit',
            label: 'Feuerstelle',
          },
          {
            value: 'shop-video',
            label: 'Videothek',
          },
          {
            value: 'shop-collector',
            label: 'Sammlergeschäft',
          },
          {
            value: 'amenity-conference_centre',
            label: 'Kongresszentrum',
          },
          {
            value: 'shop-tool_hire',
            label: 'Werkzeugverleih',
          },
          {
            value: 'shop-games',
            label: 'Brettspielgeschäft',
          },
          {
            value: 'leisure-garden',
            label: 'Garten',
          },
          {
            value: 'shop-radiotechnics',
            label: 'Radio / Elektronik-Geschäft',
          },
          {
            value: 'amenity-boat_storage',
            label: 'Bootslagerplatz',
          },
          {
            value: 'shop-hairdresser_supply',
            label: 'Friseurbedarf',
          },
          {
            value: 'shop-party',
            label: 'Partyzubehör',
          },
          {
            value: 'shop-cannabis',
            label: 'Cannabisgeschäft',
          },
          {
            value: 'shop-doors',
            label: 'Türgeschäft',
          },
          {
            value: 'shop-outpost',
            label: 'Abholstelle eines Onlinehändlers',
          },
          {
            value: 'amenity-vending_machine',
            label: 'Verkaufsautomat',
          },
          {
            value: 'leisure-adult_gaming_centre',
            label: 'Spielothek für Erwachsene',
          },
          {
            value: 'shop-printing',
            label: 'Druckerei',
          },
          {
            value: 'shop-boat',
            label: 'Bootsgeschäft',
          },
          {
            value: 'shop-nutrition_supplements',
            label: 'Nahrungsergänzungsmittelgeschäft',
          },
          {
            value: 'shop-fuel',
            label: 'Tankstelle',
          },
          {
            value: 'shop-truck_repair',
            label: 'Lkw-Werkstatt',
          },
          {
            value: 'leisure-outdoor_seating',
            label: 'Außengastronomie',
          },
          {
            value: 'shop-vacuum_cleaner',
            label: 'Staubsaugergeschäft',
          },
          {
            value: 'shop-hookah',
            label: 'Shisha-Shop',
          },
          {
            value: 'amenity-money_transfer',
            label: 'Geldtransferstation',
          },
          {
            value: 'shop-security',
            label: 'Sicherheitsfachgeschäft',
          },
          {
            value: 'shop-spices',
            label: 'Gewürzladen',
          },
          {
            value: 'tourism-alpine_hut',
            label: 'Berghütte',
          },
          {
            value: 'shop-truck',
            label: 'Lkw-Handel',
          },
          {
            value: 'tourism-apartment',
            label: 'Ferienwohnung',
          },
          {
            value: 'shop-scuba_diving',
            label: 'Tauchwarengeschäft',
          },
          {
            value: 'tourism-trail_riding_station',
            label: 'Reitstation',
          },
          {
            value: 'leisure-bird_hide',
            label: 'Vogelbeobachtungsstation',
          },
          {
            value: 'shop-wigs',
            label: 'Perückenladen',
          },
          {
            value: 'shop-country_store',
            label: 'Dorfladen',
          },
          {
            value: 'shop-plant_hire',
            label: 'Maschinenvermietung',
          },
          {
            value: 'shop-food',
            label: 'Lebensmittelgeschäft',
          },
          {
            value: 'shop-groundskeeping',
            label: 'Geschäft für Gartengeräte',
          },
          {
            value: 'shop-video_games',
            label: 'Videospielgeschäft',
          },
          {
            value: 'amenity-fallback',
            label: 'Einrichtung (Auffangkategorie)',
            description:
              'Auffangkategorie für seltene oder uneinheitliche amenity-Werte unterhalb des Volumen-Schwellenwertes.',
          },
          {
            value: 'leisure-fallback',
            label: 'Freizeit (Auffangkategorie)',
            description:
              'Auffangkategorie für seltene oder uneinheitliche leisure-Werte unterhalb des Volumen-Schwellenwertes.',
          },
          {
            value: 'shop-fallback',
            label: 'Geschäft (Auffangkategorie)',
            description:
              'Auffangkategorie für seltene oder uneinheitliche shop-Werte unterhalb des Volumen-Schwellenwertes.',
          },
          {
            value: 'tourism-fallback',
            label: 'Tourismus (Auffangkategorie)',
            description:
              'Auffangkategorie für seltene oder uneinheitliche tourism-Werte unterhalb des Volumen-Schwellenwertes.',
          },
        ],
      },
      {
        key: 'formalEducation',
        type: 'string',
        label: 'Bildungseinrichtung',
        values: [
          {
            value: 'childcare',
            label: 'Kinderbetreuung',
          },
          {
            value: 'college',
            label: 'Berufsfachschule / Weiterbildungseinrichtung',
          },
          {
            value: 'kindergarten',
            label: 'Kindergarten',
          },
          {
            value: 'research_institute',
            label: 'Forschungsinstitut',
          },
          {
            value: 'school',
            label: 'Schule',
          },
          {
            value: 'university',
            label: 'Universität',
          },
        ],
      },
    ],
    chapters: [],
  },
  publicTransport: {
    topic: 'publicTransport',
    tableName: 'publicTransport',
    sourceIds: ['atlas_publicTransport'],
    title: 'ÖPNV-Haltepunkte und Fähranleger',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'category',
        type: 'string',
        label: 'Art',
        values: [
          {
            value: 'ferry_station',
            label: 'Fähranleger',
          },
          {
            value: 'light_rail_station',
            label: 'S-Bahn-Station',
          },
          {
            value: 'railway_station',
            label: 'Bahnhof regional / überregional',
          },
          {
            value: 'subway_station',
            label: 'U-Bahn-Station',
          },
          {
            value: 'tram_station',
            label: 'Tramstation',
          },
          {
            value: 'undefined',
            label: 'Nicht kategorisiert',
          },
        ],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
      {
        key: 'operator',
        type: 'sanitized_strings',
        label: 'Betreiber',
        values: [],
      },
      {
        key: 'wikidata',
        type: 'sanitized_strings',
        label: 'Wikidata',
        values: [],
      },
      {
        key: 'wikipedia',
        type: 'sanitized_strings',
        label: 'Wikipedia',
        values: [],
      },
      {
        key: 'description',
        type: 'sanitized_strings',
        label: 'Beschreibung',
        values: [],
      },
      {
        key: 'network',
        type: 'sanitized_strings',
        label: 'Verkehrsnetz',
        values: [],
      },
      {
        key: 'network_short',
        type: 'sanitized_strings',
        label: 'Verkehrsnetz (Kurzname)',
        values: [],
      },
    ],
    chapters: [],
  },
  roads: {
    topic: 'roads_bikelanes',
    tableName: 'roads',
    sourceIds: ['atlas_roads'],
    title: 'Daten zur Straße',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'road',
        type: 'string',
        label: 'Straßentyp',
        values: [
          {
            value: 'bicycle_road',
            label: 'Fahrradstraße',
          },
          {
            value: 'construction',
            label: 'Straße ist in Bau',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway',
            label: 'Radweg',
          },
          {
            value: 'footway_cycleway_crossing',
            label: 'Straßenquerung (Fußverkehr)',
          },
          {
            value: 'footway_sidewalk',
            label: 'Gehweg',
          },
          {
            value: 'footway',
            label: 'Fußweg',
          },
          {
            value: 'living_street',
            label: 'Verkehrsberuhigter Bereich',
          },
          {
            value: 'motorway_link',
            label: 'Zufahrt einer Autobahn',
          },
          {
            value: 'motorway',
            label: 'Autobahn',
          },
          {
            value: 'path',
            label: 'Weg / Pfad',
          },
          {
            value: 'pedestrian',
            label: 'Fußgängerzone',
          },
          {
            value: 'primary_link',
            label: 'Zufahrt einer Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'primary',
            label: 'Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'residential',
            label: 'Anwohnerstraße',
          },
          {
            value: 'residential_priority_road',
            label: 'residential_priority_road',
          },
          {
            value: 'secondary_link',
            label: 'Zufahrt einer Landes&shy;straße/wichtigen Durchgangs&shy;straße',
          },
          {
            value: 'secondary',
            label: 'Landes&shy;straße/Wichtige Durchgangs&shy;straße',
          },
          {
            value: 'service_alley',
            label: 'Gasse',
          },
          {
            value: 'service_driveway',
            label: 'Grundstückszufahrt',
          },
          {
            value: 'service_emergency_access',
            label: 'Rettungsweg',
          },
          {
            value: 'service_parking_aisle',
            label: 'Parkplatzweg',
          },
          {
            value: 'service_road',
            label: 'Zufahrtsweg',
          },
          {
            value: 'service_uncategorized',
            label: 'Zufahrtsweg (unbekannte Klassifizierung)',
          },
          {
            value: 'service',
            label: 'Zufahrtsweg',
          },
          {
            value: 'steps',
            label: 'Stufen',
          },
          {
            value: 'tertiary_link',
            label: 'Zufahrt einer Kreis&shy;straße/untergeordneten Durchgangs&shy;straße',
          },
          {
            value: 'tertiary',
            label: 'Kreis&shy;straße/Untergeordnete Durchgangs&shy;straße',
          },
          {
            value: 'track',
            label: 'Wald- / Feldweg',
          },
          {
            value: 'unclassified',
            label: 'Nebenstraße mit Verbindungscharakter',
          },
          {
            value: 'unspecified_road',
            label: 'Unkategorisierte Straße',
          },
        ],
      },
      {
        key: 'highway',
        type: 'string',
        label: 'OSM-Straßentyp',
        description: 'Wert des OSM-Tags `highway` ohne weitere Normalisierung.',
        values: [
          {
            value: 'cycleway',
            label: 'Radweg',
          },
          {
            value: 'footway',
            label: 'Fußweg',
          },
          {
            value: 'living_street',
            label: 'Verkehrsberuhigter Bereich',
          },
          {
            value: 'motorway',
            label: 'Autobahn',
          },
          {
            value: 'motorway_link',
            label: 'Zufahrt einer Autobahn',
          },
          {
            value: 'path',
            label: 'Weg / Pfad',
          },
          {
            value: 'pedestrian',
            label: 'Fußgängerzone',
          },
          {
            value: 'primary',
            label: 'Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'primary_link',
            label: 'Zufahrt einer Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'residential',
            label: 'Anwohnerstraße',
          },
          {
            value: 'road',
            label: 'Unkategorisierte Straße',
          },
          {
            value: 'secondary',
            label: 'Landes&shy;straße/Wichtige Durchgangs&shy;straße',
          },
          {
            value: 'secondary_link',
            label: 'Zufahrt einer Landes&shy;straße/wichtigen Durchgangs&shy;straße',
          },
          {
            value: 'service',
            label: 'Zufahrtsweg',
          },
          {
            value: 'steps',
            label: 'Stufen',
          },
          {
            value: 'tertiary',
            label: 'Kreis&shy;straße/Untergeordnete Durchgangs&shy;straße',
          },
          {
            value: 'tertiary_link',
            label: 'Zufahrt einer Kreis&shy;straße/untergeordneten Durchgangs&shy;straße',
          },
          {
            value: 'track',
            label: 'Wald- / Feldweg',
          },
          {
            value: 'trunk',
            label: 'Kraftfahrstraße',
          },
          {
            value: 'trunk_link',
            label: 'Kraftfahrstraßen-Anschluss',
          },
          {
            value: 'unclassified',
            label: 'Nebenstraße mit Verbindungscharakter',
          },
        ],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
      {
        key: 'name_ref',
        type: 'sanitized_strings',
        label: 'Referenzname',
        description: 'Enthält Kurznamen wie `A 100` oder `B 96`, übernommen aus dem OSM-Tag `ref`.',
        values: [],
      },
      {
        key: 'length',
        type: 'meter',
        label: 'Länge',
        description:
          'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
        values: [],
      },
      {
        key: 'lifecycle',
        type: 'string',
        label: 'Status',
        values: [
          {
            value: 'blocked',
            label: 'Gesperrt (Sperrung)',
          },
          {
            value: 'construction',
            label: 'In Bau',
          },
          {
            value: 'construction_no_access',
            label: 'Gesperrt aufgrund einer Baustelle',
          },
          {
            value: 'temporary',
            label: 'Temporärer Weg',
          },
        ],
      },
      {
        key: 'width',
        type: 'meter',
        label: 'Breite',
        values: [],
      },
      {
        key: 'width_effective',
        type: 'meter',
        label: 'Effektive Breite',
        values: [],
      },
      {
        key: 'width_source',
        type: 'string',
        label: 'Quelle Breite',
        purpose: 'qa',
        values: [
          {
            value: 'ALKIS',
            label: 'Aus ALKIS Daten ausgemessen',
          },
          {
            value: 'ARCore',
            label: 'Mit dem Handy-Metermaß von StreetComplete gemessen',
          },
        ],
      },
      {
        key: 'oneway',
        type: 'string',
        label: 'Verkehrsrichtung',
        values: [
          {
            value: 'no',
            label: 'Beide Richtungen',
          },
          {
            value: 'yes',
            label: 'Einbahnstraße',
          },
          {
            value: 'yes_dual_carriageway',
            label: 'Einbahnstraße da separate Geometrie pro Seite',
          },
        ],
      },
      {
        key: 'oneway_bicycle',
        type: 'string',
        label: 'Verkehrsrichtung Fahrrad',
        values: [
          {
            value: 'no',
            label: 'Beide Richtungen für Radverkehr',
          },
          {
            value: 'yes',
            label: 'Eine Richtung (auch für Radverkehr)',
          },
        ],
      },
      {
        key: 'bridge',
        type: 'string',
        label: 'Brücke',
        values: [
          {
            value: 'yes',
            label: 'Ja',
          },
        ],
      },
      {
        key: 'tunnel',
        type: 'string',
        label: 'Tunnel',
        values: [
          {
            value: 'yes',
            label: 'Ja',
          },
        ],
      },
      {
        key: 'mapillary_coverage',
        type: 'string',
        label: 'Mapillary-Abdeckung',
        description:
          'Basiert auf einer Analyse der Mapillary-Foto-Sequenzen der letzten ca. 2 Jahre, die mit den OSM-Wegen verschnitten wurden. Mehr unter https://tilda-geo.de/docs/mapillary-coverage',
        values: [
          {
            value: 'regular',
            label: 'Standard-Aufnahmen',
          },
          {
            value: 'pano',
            label: 'Panorama-Aufnahmen',
          },
        ],
      },
      {
        key: 'mapillary',
        type: 'sanitized_strings',
        label: 'Straßenfotos (Mapillary)',
        description:
          'Mapillary-Bild-IDs (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_forward',
        type: 'sanitized_strings',
        label: 'Mapillary in Linienrichtung',
        description:
          'Mapillary-Bild-IDs in Linienrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_backward',
        type: 'sanitized_strings',
        label: 'Mapillary gegen Linienrichtung',
        description:
          'Mapillary-Bild-IDs in Gegenrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_traffic_sign',
        type: 'sanitized_strings',
        label: 'Mapillary für Verkehrszeichen',
        description:
          'Mapillary-Bild-IDs für Verkehrszeichen (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'traffic_sign',
        type: 'sanitized_strings',
        label: 'Beschilderung',
        values: [
          {
            value: 'none',
            label: 'Unbeschildert',
          },
        ],
      },
      {
        key: 'traffic_sign:forward',
        type: 'sanitized_strings',
        label: 'Beschilderung in Verkehrsrichtung',
        values: [
          {
            value: 'none',
            label: 'Unbeschildert',
          },
        ],
      },
      {
        key: 'traffic_sign:backward',
        type: 'sanitized_strings',
        label: 'Beschilderung in Gegenrichtung',
        values: [
          {
            value: 'none',
            label: 'Unbeschildert',
          },
        ],
      },
      {
        key: 'description',
        type: 'sanitized_strings',
        label: 'Hinweis aus OSM',
        values: [],
      },
      {
        key: 'operator_type',
        type: 'string',
        label: 'Betreibertyp',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'public',
            label: 'Öffentlich',
          },
        ],
      },
      {
        key: 'informal',
        type: 'string',
        label: 'Trampelpfad',
        values: [
          {
            value: 'yes',
            label: 'Weg als informeller Weg erfasst',
          },
        ],
      },
      {
        key: 'covered',
        type: 'string',
        label: 'Überdacht',
        values: [
          {
            value: 'covered',
            label: 'Überdacht',
          },
          {
            value: 'partial',
            label: 'Teilweise überdacht',
          },
          {
            value: 'indoor',
            label: 'In einem Gebäude',
          },
        ],
      },
      {
        key: 'bikelane_left',
        type: 'string',
        label: 'Radinfrastruktur links',
        values: [
          {
            value: 'bicycleRoad',
            label: 'Fahrradstraße',
          },
          {
            value: 'bicycleRoad_vehicleDestination',
            label: 'Fahrradstraße mit Anlieger/Kfz frei',
          },
          {
            value: 'crossing',
            label: 'Straßenquerung',
          },
          {
            value: 'cycleway_adjoining',
            label: 'Radweg (straßenbegleitend)',
          },
          {
            value: 'cycleway_adjoiningOrIsolated',
            label: 'Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway_isolated',
            label: 'Radweg, selbstständig geführt',
          },
          {
            value: 'cyclewayLink',
            label: 'Radweg-Verbindungsstück',
          },
          {
            value: 'cyclewayOnHighway_advisory',
            label: 'Schutzstreifen',
          },
          {
            value: 'cyclewayOnHighway_advisoryOrExclusive',
            label: 'Radfahrstreifen oder Schutzstreifen (Kategorisierung unklar)',
          },
          {
            value: 'cyclewayOnHighway_exclusive',
            label: 'Radfahrstreifen',
          },
          {
            value: 'cyclewayOnHighwayBetweenLanes',
            label: 'Radfahrstreifen in Mittellage (Fahrradweiche)',
          },
          {
            value: 'cyclewayOnHighwayProtected',
            label: 'Geschützter Radfahrstreifen (PBL)',
          },
          {
            value: 'footAndCyclewaySegregated_adjoining',
            label: 'Getrennter Rad- und Gehweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewaySegregated_adjoiningOrIsolated',
            label:
              'Getrennter Rad- und Gehweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewaySegregated_isolated',
            label: 'Getrennter Rad- und Gehweg, selbstständig geführt',
          },
          {
            value: 'footAndCyclewayShared_adjoining',
            label: 'Gemeinsamer Geh- und Radweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewayShared_adjoiningOrIsolated',
            label:
              'Gemeinsamer Geh- und Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewayShared_isolated',
            label: 'Gemeinsamer Geh- und Radweg, selbstständig geführt',
          },
          {
            value: 'footwayBicycleYes_adjoining',
            label: 'Gehweg mit Radfahrer frei, straßenbegleitend',
          },
          {
            value: 'footwayBicycleYes_adjoiningOrIsolated',
            label:
              'Gehweg mit Radfahrer frei (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footwayBicycleYes_isolated',
            label: 'Gehweg mit Radfahrer frei, selbstständig geführt',
          },
          {
            value: 'livingStreet',
            label: 'Verkehrsberuhigter Bereich (Spielstraße)',
          },
          {
            value: 'pedestrianAreaBicycleYes',
            label: 'Fußgängerzone, Fahrrad frei',
          },
          {
            value: 'separate_geometry',
            label: 'RVA als separate Geometrie erfasst',
          },
          {
            value: 'sharedBusLaneBikeWithBus',
            label: 'Radfahrstreifen mit Freigabe Busverkehr',
          },
          {
            value: 'sharedBusLaneBusWithBike',
            label: 'Bussonderfahrstreifen mit Fahrrad frei',
          },
          {
            value: 'sharedMotorVehicleLane',
            label: 'Gemeinsamer Fahrstreifen',
          },
          {
            value: 'needsClarification',
            label: 'Führungsform unklar',
          },
          {
            value: 'data_no',
            label: 'Vollständig (explizit keine)',
          },
          {
            value: 'not_expected',
            label: 'Keine Infrastruktur erwartet',
          },
          {
            value: 'assumed_no',
            label: 'Vermutlich vollständig',
          },
          {
            value: 'missing',
            label: 'Unvollständig',
          },
        ],
      },
      {
        key: 'bikelane_self',
        type: 'string',
        label: 'Radinfrastruktur mittig',
        values: [
          {
            value: 'bicycleRoad',
            label: 'Fahrradstraße',
          },
          {
            value: 'bicycleRoad_vehicleDestination',
            label: 'Fahrradstraße mit Anlieger/Kfz frei',
          },
          {
            value: 'crossing',
            label: 'Straßenquerung',
          },
          {
            value: 'cycleway_adjoining',
            label: 'Radweg (straßenbegleitend)',
          },
          {
            value: 'cycleway_adjoiningOrIsolated',
            label: 'Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway_isolated',
            label: 'Radweg, selbstständig geführt',
          },
          {
            value: 'cyclewayLink',
            label: 'Radweg-Verbindungsstück',
          },
          {
            value: 'cyclewayOnHighway_advisory',
            label: 'Schutzstreifen',
          },
          {
            value: 'cyclewayOnHighway_advisoryOrExclusive',
            label: 'Radfahrstreifen oder Schutzstreifen (Kategorisierung unklar)',
          },
          {
            value: 'cyclewayOnHighway_exclusive',
            label: 'Radfahrstreifen',
          },
          {
            value: 'cyclewayOnHighwayBetweenLanes',
            label: 'Radfahrstreifen in Mittellage (Fahrradweiche)',
          },
          {
            value: 'cyclewayOnHighwayProtected',
            label: 'Geschützter Radfahrstreifen (PBL)',
          },
          {
            value: 'footAndCyclewaySegregated_adjoining',
            label: 'Getrennter Rad- und Gehweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewaySegregated_adjoiningOrIsolated',
            label:
              'Getrennter Rad- und Gehweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewaySegregated_isolated',
            label: 'Getrennter Rad- und Gehweg, selbstständig geführt',
          },
          {
            value: 'footAndCyclewayShared_adjoining',
            label: 'Gemeinsamer Geh- und Radweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewayShared_adjoiningOrIsolated',
            label:
              'Gemeinsamer Geh- und Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewayShared_isolated',
            label: 'Gemeinsamer Geh- und Radweg, selbstständig geführt',
          },
          {
            value: 'footwayBicycleYes_adjoining',
            label: 'Gehweg mit Radfahrer frei, straßenbegleitend',
          },
          {
            value: 'footwayBicycleYes_adjoiningOrIsolated',
            label:
              'Gehweg mit Radfahrer frei (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footwayBicycleYes_isolated',
            label: 'Gehweg mit Radfahrer frei, selbstständig geführt',
          },
          {
            value: 'livingStreet',
            label: 'Verkehrsberuhigter Bereich (Spielstraße)',
          },
          {
            value: 'pedestrianAreaBicycleYes',
            label: 'Fußgängerzone, Fahrrad frei',
          },
          {
            value: 'separate_geometry',
            label: 'RVA als separate Geometrie erfasst',
          },
          {
            value: 'sharedBusLaneBikeWithBus',
            label: 'Radfahrstreifen mit Freigabe Busverkehr',
          },
          {
            value: 'sharedBusLaneBusWithBike',
            label: 'Bussonderfahrstreifen mit Fahrrad frei',
          },
          {
            value: 'sharedMotorVehicleLane',
            label: 'Gemeinsamer Fahrstreifen',
          },
          {
            value: 'needsClarification',
            label: 'Führungsform unklar',
          },
          {
            value: 'data_no',
            label: 'Vollständig (explizit keine)',
          },
          {
            value: 'not_expected',
            label: 'Keine Infrastruktur erwartet',
          },
          {
            value: 'assumed_no',
            label: 'Vermutlich vollständig',
          },
          {
            value: 'missing',
            label: 'Unvollständig',
          },
        ],
      },
      {
        key: 'bikelane_right',
        type: 'string',
        label: 'Radinfrastruktur rechts',
        values: [
          {
            value: 'bicycleRoad',
            label: 'Fahrradstraße',
          },
          {
            value: 'bicycleRoad_vehicleDestination',
            label: 'Fahrradstraße mit Anlieger/Kfz frei',
          },
          {
            value: 'crossing',
            label: 'Straßenquerung',
          },
          {
            value: 'cycleway_adjoining',
            label: 'Radweg (straßenbegleitend)',
          },
          {
            value: 'cycleway_adjoiningOrIsolated',
            label: 'Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway_isolated',
            label: 'Radweg, selbstständig geführt',
          },
          {
            value: 'cyclewayLink',
            label: 'Radweg-Verbindungsstück',
          },
          {
            value: 'cyclewayOnHighway_advisory',
            label: 'Schutzstreifen',
          },
          {
            value: 'cyclewayOnHighway_advisoryOrExclusive',
            label: 'Radfahrstreifen oder Schutzstreifen (Kategorisierung unklar)',
          },
          {
            value: 'cyclewayOnHighway_exclusive',
            label: 'Radfahrstreifen',
          },
          {
            value: 'cyclewayOnHighwayBetweenLanes',
            label: 'Radfahrstreifen in Mittellage (Fahrradweiche)',
          },
          {
            value: 'cyclewayOnHighwayProtected',
            label: 'Geschützter Radfahrstreifen (PBL)',
          },
          {
            value: 'footAndCyclewaySegregated_adjoining',
            label: 'Getrennter Rad- und Gehweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewaySegregated_adjoiningOrIsolated',
            label:
              'Getrennter Rad- und Gehweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewaySegregated_isolated',
            label: 'Getrennter Rad- und Gehweg, selbstständig geführt',
          },
          {
            value: 'footAndCyclewayShared_adjoining',
            label: 'Gemeinsamer Geh- und Radweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewayShared_adjoiningOrIsolated',
            label:
              'Gemeinsamer Geh- und Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewayShared_isolated',
            label: 'Gemeinsamer Geh- und Radweg, selbstständig geführt',
          },
          {
            value: 'footwayBicycleYes_adjoining',
            label: 'Gehweg mit Radfahrer frei, straßenbegleitend',
          },
          {
            value: 'footwayBicycleYes_adjoiningOrIsolated',
            label:
              'Gehweg mit Radfahrer frei (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footwayBicycleYes_isolated',
            label: 'Gehweg mit Radfahrer frei, selbstständig geführt',
          },
          {
            value: 'livingStreet',
            label: 'Verkehrsberuhigter Bereich (Spielstraße)',
          },
          {
            value: 'pedestrianAreaBicycleYes',
            label: 'Fußgängerzone, Fahrrad frei',
          },
          {
            value: 'separate_geometry',
            label: 'RVA als separate Geometrie erfasst',
          },
          {
            value: 'sharedBusLaneBikeWithBus',
            label: 'Radfahrstreifen mit Freigabe Busverkehr',
          },
          {
            value: 'sharedBusLaneBusWithBike',
            label: 'Bussonderfahrstreifen mit Fahrrad frei',
          },
          {
            value: 'sharedMotorVehicleLane',
            label: 'Gemeinsamer Fahrstreifen',
          },
          {
            value: 'needsClarification',
            label: 'Führungsform unklar',
          },
          {
            value: 'data_no',
            label: 'Vollständig (explizit keine)',
          },
          {
            value: 'not_expected',
            label: 'Keine Infrastruktur erwartet',
          },
          {
            value: 'assumed_no',
            label: 'Vermutlich vollständig',
          },
          {
            value: 'missing',
            label: 'Unvollständig',
          },
        ],
      },
      {
        key: 'maxspeed',
        type: 'kilometer_per_hour',
        label: 'Höchstgeschwindigkeit',
        values: [],
      },
      {
        key: 'maxspeed_source',
        type: 'string',
        label: 'Höchstgeschwindigkeit Quelle',
        purpose: 'qa',
        values: [
          {
            value: 'maxspeed',
            label: 'In OSM erfasst als Tag `maxspeed`',
          },
          {
            value: 'maxspeed_tag',
            label: 'In OSM erfasst über einen `maxspeed`-Kategorie-Tag',
          },
          {
            value: 'zone',
            label: 'OSM-Zonen-Tag',
          },
          {
            value: 'inferred_from_highway',
            label: 'Abgeleitet vom `highway`-Tag',
          },
        ],
      },
      {
        key: 'maxspeed_confidence',
        type: 'string',
        label: 'Konfidenz Höchstgeschwindigkeit',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'osm_maxspeed:backward',
        type: 'sanitized_strings',
        label: 'Spezielle Höchstgeschwindigkeit gegen die Linienrichtung',
        purpose: 'qa',
        values: [],
      },
      {
        key: 'osm_maxspeed:forward',
        type: 'sanitized_strings',
        label: 'Spezielle Höchstgeschwindigkeit mit der Linienrichtung',
        purpose: 'qa',
        values: [],
      },
      {
        key: 'osm_maxspeed:conditional',
        type: 'sanitized_strings',
        label: 'Spezielle Höchstgeschwindigkeit mit Einschränkungen',
        purpose: 'qa',
        values: [],
      },
      {
        key: 'lit',
        type: 'string',
        label: 'Beleuchtung',
        values: [
          {
            value: 'yes',
            label: 'Beleuchtet',
          },
          {
            value: 'no',
            label: 'Nicht beleuchtet',
          },
          {
            value: 'special',
            label: 'Spezielle Angaben',
          },
        ],
      },
      {
        key: 'surface',
        type: 'string',
        label: 'Oberfläche',
        values: [
          {
            value: 'asphalt',
            label: 'Asphalt',
          },
          {
            value: 'paved',
            label: 'Befestigt (unspezifisch)',
          },
          {
            value: 'unpaved',
            label: 'Unbefestigt',
          },
          {
            value: 'concrete',
            label: 'Beton',
          },
          {
            value: 'concrete:plates',
            label: 'Betonplatten',
          },
          {
            value: 'concrete:lanes',
            label: 'Betonstreifen / -bahnen',
          },
          {
            value: 'paving_stones',
            label: 'Verbund&shy;pflastersteine',
          },
          {
            value: 'paving_stones:lanes',
            label: 'Pflasterstein&shy;bahnen',
          },
          {
            value: 'sett',
            label: 'Behauenes Pflaster / Natursteinpflaster',
          },
          {
            value: 'mosaic_sett',
            label: 'Mosaikpflaster',
          },
          {
            value: 'small_sett',
            label: 'Kleinpflaster',
          },
          {
            value: 'large_sett',
            label: 'Großpflaster',
          },
          {
            value: 'bricks',
            label: 'Ziegel',
          },
          {
            value: 'stone',
            label: 'Stein',
          },
          {
            value: 'ground',
            label: 'Erde/Boden',
          },
          {
            value: 'grass',
            label: 'Gras',
          },
          {
            value: 'sand',
            label: 'Sand',
          },
          {
            value: 'compacted',
            label: 'Verdichteter Untergrund',
          },
          {
            value: 'fine_gravel',
            label: 'Splitt',
          },
          {
            value: 'gravel',
            label: 'Schotter',
          },
          {
            value: 'pebblestone',
            label: 'Kieselsteine',
          },
          {
            value: 'wood',
            label: 'Holz',
          },
          {
            value: 'woodchips',
            label: 'Hackschnitzel',
          },
          {
            value: 'metal',
            label: 'Metall',
          },
          {
            value: 'metal_grid',
            label: 'Metallgitter',
          },
          {
            value: 'plastic',
            label: 'Kunststoff',
          },
          {
            value: 'rubber',
            label: 'Gummi',
          },
          {
            value: 'grass_paver',
            label: 'Rasengitter / Grasgitter',
          },
        ],
      },
      {
        key: 'surface_source',
        type: 'string',
        label: 'Herkunft der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM',
          },
          {
            value: 'tag_transformed',
            label: 'Aus OSM-Tag normalisiert',
          },
          {
            value: 'parent_highway_tag',
            label: 'Von zugeordneter Straße (OSM)',
          },
          {
            value: 'parent_highway_tag_transformed',
            label: 'Von zugeordneter Straße, normalisiert',
          },
        ],
      },
      {
        key: 'surface_confidence',
        type: 'string',
        label: 'Konfidenz der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'smoothness',
        type: 'string',
        label: 'Ober&shy;flächen&shy;qualität',
        values: [
          {
            value: 'excellent',
            label: 'Sehr gut',
          },
          {
            value: 'good',
            label: 'Gut',
          },
          {
            value: 'intermediate',
            label: 'Mittel gut',
          },
          {
            value: 'bad',
            label: 'Schlecht',
          },
          {
            value: 'very_bad',
            label: 'Sehr schlecht',
          },
        ],
      },
      {
        key: 'smoothness_source',
        type: 'string',
        label: 'Herkunft der Ober&shy;flächen&shy;qualität',
        purpose: 'qa',
        values: [
          {
            value: 'tag',
            label: 'OSM-Tag `smoothness`',
          },
          {
            value: 'tag_normalized',
            label: 'OSM-Tag `smoothness` (normalisiert)',
          },
          {
            value: 'surface_to_smoothness',
            label: 'Abgeleitet von `surface`',
          },
          {
            value: 'tracktype_to_smoothness',
            label: 'Abgeleitet von `tracktype`',
          },
          {
            value: 'mtb:scale_to_smoothness',
            label: 'Abgeleitet von `mtb:scale`',
          },
        ],
      },
      {
        key: 'smoothness_confidence',
        type: 'string',
        label: 'Konfidenz Ober&shy;flächen&shy;qualität',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
        ],
      },
      {
        key: 'surface_color',
        type: 'string',
        label: 'Ober&shy;flächen&shy;farbe',
        values: [
          {
            value: 'red',
            label: 'Rot',
          },
          {
            value: 'green',
            label: 'Grün',
          },
          {
            value: 'red;green',
            label: 'Rot und Grün',
          },
          {
            value: 'no',
            label: 'Keine besondere Farbe',
          },
        ],
      },
      {
        key: 'todos',
        type: 'sanitized_strings',
        label: 'Todo-Liste',
        purpose: 'qa',
        values: [],
      },
      {
        key: '_is_sidepath',
        type: 'ignore',
        label: '_is_sidepath',
        purpose: 'processing',
        values: [],
      },
      {
        key: '_in_settlement_area',
        type: 'ignore',
        label: '_in_settlement_area',
        purpose: 'processing',
        values: [],
      },
    ],
    chapters: [
      {
        id: 'versetzte-geometrien',
        title: 'Versetzte Geometrien',
        markdown:
          'Die Geometrien für Radinfrastruktur, die von der Straßen-Mittellinie abgeleitet werden (siehe Hinweise „Transformierte Geometrie“ im Inspektor in der Kartenansicht), werden als Teil der Prozessierung nach links und rechts versetzt. Dafür verwenden wir die Breite der Straße als Referenz.\n\n**HINWEIS:** Wir planen dieses Feature in der Zukunft umzubauen. Dann werden die Daten eine Eigenschaft haben, aus der der empfohlene Versatz hervorgeht, so dass man sie im Kartenstil visuell versetzen kann, aber sie in den Daten auf der Mittellinie bleiben.\n',
      },
    ],
  },
  roadsPathClasses: {
    topic: 'roads_bikelanes',
    tableName: 'roadsPathClasses',
    sourceIds: ['atlas_roadsPathClasses'],
    title: 'Daten zu Wegen',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'road',
        type: 'string',
        label: 'Straßentyp',
        values: [
          {
            value: 'bicycle_road',
            label: 'Fahrradstraße',
          },
          {
            value: 'construction',
            label: 'Straße ist in Bau',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway',
            label: 'Radweg',
          },
          {
            value: 'footway_cycleway_crossing',
            label: 'Straßenquerung (Fußverkehr)',
          },
          {
            value: 'footway_sidewalk',
            label: 'Gehweg',
          },
          {
            value: 'footway',
            label: 'Fußweg',
          },
          {
            value: 'living_street',
            label: 'Verkehrsberuhigter Bereich',
          },
          {
            value: 'motorway_link',
            label: 'Zufahrt einer Autobahn',
          },
          {
            value: 'motorway',
            label: 'Autobahn',
          },
          {
            value: 'path',
            label: 'Weg / Pfad',
          },
          {
            value: 'pedestrian',
            label: 'Fußgängerzone',
          },
          {
            value: 'primary_link',
            label: 'Zufahrt einer Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'primary',
            label: 'Bundes&shy;straße/Haupt&shy;verbindungs&shy;straße',
          },
          {
            value: 'residential',
            label: 'Anwohnerstraße',
          },
          {
            value: 'residential_priority_road',
            label: 'residential_priority_road',
          },
          {
            value: 'secondary_link',
            label: 'Zufahrt einer Landes&shy;straße/wichtigen Durchgangs&shy;straße',
          },
          {
            value: 'secondary',
            label: 'Landes&shy;straße/Wichtige Durchgangs&shy;straße',
          },
          {
            value: 'service_alley',
            label: 'Gasse',
          },
          {
            value: 'service_driveway',
            label: 'Grundstückszufahrt',
          },
          {
            value: 'service_emergency_access',
            label: 'Rettungsweg',
          },
          {
            value: 'service_parking_aisle',
            label: 'Parkplatzweg',
          },
          {
            value: 'service_road',
            label: 'Zufahrtsweg',
          },
          {
            value: 'service_uncategorized',
            label: 'Zufahrtsweg (unbekannte Klassifizierung)',
          },
          {
            value: 'service',
            label: 'Zufahrtsweg',
          },
          {
            value: 'steps',
            label: 'Stufen',
          },
          {
            value: 'tertiary_link',
            label: 'Zufahrt einer Kreis&shy;straße/untergeordneten Durchgangs&shy;straße',
          },
          {
            value: 'tertiary',
            label: 'Kreis&shy;straße/Untergeordnete Durchgangs&shy;straße',
          },
          {
            value: 'track',
            label: 'Wald- / Feldweg',
          },
          {
            value: 'unclassified',
            label: 'Nebenstraße mit Verbindungscharakter',
          },
          {
            value: 'unspecified_road',
            label: 'Unkategorisierte Straße',
          },
        ],
      },
      {
        key: 'name',
        type: 'sanitized_strings',
        label: 'Name',
        values: [],
      },
      {
        key: 'length',
        type: 'meter',
        label: 'Länge',
        description:
          'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
        values: [],
      },
      {
        key: 'lifecycle',
        type: 'string',
        label: 'Status',
        values: [
          {
            value: 'blocked',
            label: 'Gesperrt (Sperrung)',
          },
          {
            value: 'construction',
            label: 'In Bau',
          },
          {
            value: 'construction_no_access',
            label: 'Gesperrt aufgrund einer Baustelle',
          },
          {
            value: 'temporary',
            label: 'Temporärer Weg',
          },
        ],
      },
      {
        key: 'oneway',
        type: 'string',
        label: 'Verkehrsrichtung',
        values: [
          {
            value: 'no',
            label: 'Beide Richtungen',
          },
          {
            value: 'yes',
            label: 'Einbahnstraße',
          },
          {
            value: 'yes_dual_carriageway',
            label: 'Einbahnstraße da separate Geometrie pro Seite',
          },
        ],
      },
      {
        key: 'oneway_bicycle',
        type: 'string',
        label: 'Verkehrsrichtung Fahrrad',
        values: [
          {
            value: 'no',
            label: 'Beide Richtungen für Radverkehr',
          },
          {
            value: 'yes',
            label: 'Eine Richtung (auch für Radverkehr)',
          },
        ],
      },
      {
        key: 'mapillary_coverage',
        type: 'string',
        label: 'Mapillary-Abdeckung',
        description:
          'Basiert auf einer Analyse der Mapillary-Foto-Sequenzen der letzten ca. 2 Jahre, die mit den OSM-Wegen verschnitten wurden. Mehr unter https://tilda-geo.de/docs/mapillary-coverage',
        values: [
          {
            value: 'regular',
            label: 'Standard-Aufnahmen',
          },
          {
            value: 'pano',
            label: 'Panorama-Aufnahmen',
          },
        ],
      },
      {
        key: 'mapillary',
        type: 'sanitized_strings',
        label: 'Straßenfotos (Mapillary)',
        description:
          'Mapillary-Bild-IDs (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_forward',
        type: 'sanitized_strings',
        label: 'Mapillary in Linienrichtung',
        description:
          'Mapillary-Bild-IDs in Linienrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_backward',
        type: 'sanitized_strings',
        label: 'Mapillary gegen Linienrichtung',
        description:
          'Mapillary-Bild-IDs in Gegenrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'mapillary_traffic_sign',
        type: 'sanitized_strings',
        label: 'Mapillary für Verkehrszeichen',
        description:
          'Mapillary-Bild-IDs für Verkehrszeichen (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'traffic_sign',
        type: 'sanitized_strings',
        label: 'Beschilderung',
        values: [
          {
            value: 'none',
            label: 'Unbeschildert',
          },
        ],
      },
      {
        key: 'description',
        type: 'sanitized_strings',
        label: 'Hinweis aus OSM',
        values: [],
      },
      {
        key: 'operator_type',
        type: 'string',
        label: 'Betreibertyp',
        values: [
          {
            value: 'private',
            label: 'Privat',
          },
          {
            value: 'public',
            label: 'Öffentlich',
          },
        ],
      },
      {
        key: 'informal',
        type: 'string',
        label: 'Trampelpfad',
        values: [
          {
            value: 'yes',
            label: 'Weg als informeller Weg erfasst',
          },
        ],
      },
      {
        key: 'covered',
        type: 'string',
        label: 'Überdacht',
        values: [
          {
            value: 'covered',
            label: 'Überdacht',
          },
          {
            value: 'partial',
            label: 'Teilweise überdacht',
          },
          {
            value: 'indoor',
            label: 'In einem Gebäude',
          },
        ],
      },
      {
        key: 'lit',
        type: 'string',
        label: 'Beleuchtung',
        values: [
          {
            value: 'yes',
            label: 'Beleuchtet',
          },
          {
            value: 'no',
            label: 'Nicht beleuchtet',
          },
          {
            value: 'special',
            label: 'Spezielle Angaben',
          },
        ],
      },
      {
        key: 'width',
        type: 'meter',
        label: 'Breite',
        values: [],
      },
      {
        key: 'width_source',
        type: 'string',
        label: 'Quelle Breite',
        purpose: 'qa',
        values: [
          {
            value: 'ALKIS',
            label: 'Aus ALKIS Daten ausgemessen',
          },
          {
            value: 'ARCore',
            label: 'Mit dem Handy-Metermaß von StreetComplete gemessen',
          },
        ],
      },
      {
        key: 'surface',
        type: 'string',
        label: 'Oberfläche',
        values: [
          {
            value: 'asphalt',
            label: 'Asphalt',
          },
          {
            value: 'paved',
            label: 'Befestigt (unspezifisch)',
          },
          {
            value: 'unpaved',
            label: 'Unbefestigt',
          },
          {
            value: 'concrete',
            label: 'Beton',
          },
          {
            value: 'concrete:plates',
            label: 'Betonplatten',
          },
          {
            value: 'concrete:lanes',
            label: 'Betonstreifen / -bahnen',
          },
          {
            value: 'paving_stones',
            label: 'Verbund&shy;pflastersteine',
          },
          {
            value: 'paving_stones:lanes',
            label: 'Pflasterstein&shy;bahnen',
          },
          {
            value: 'sett',
            label: 'Behauenes Pflaster / Natursteinpflaster',
          },
          {
            value: 'mosaic_sett',
            label: 'Mosaikpflaster',
          },
          {
            value: 'small_sett',
            label: 'Kleinpflaster',
          },
          {
            value: 'large_sett',
            label: 'Großpflaster',
          },
          {
            value: 'bricks',
            label: 'Ziegel',
          },
          {
            value: 'stone',
            label: 'Stein',
          },
          {
            value: 'ground',
            label: 'Erde/Boden',
          },
          {
            value: 'grass',
            label: 'Gras',
          },
          {
            value: 'sand',
            label: 'Sand',
          },
          {
            value: 'compacted',
            label: 'Verdichteter Untergrund',
          },
          {
            value: 'fine_gravel',
            label: 'Splitt',
          },
          {
            value: 'gravel',
            label: 'Schotter',
          },
          {
            value: 'pebblestone',
            label: 'Kieselsteine',
          },
          {
            value: 'wood',
            label: 'Holz',
          },
          {
            value: 'woodchips',
            label: 'Hackschnitzel',
          },
          {
            value: 'metal',
            label: 'Metall',
          },
          {
            value: 'metal_grid',
            label: 'Metallgitter',
          },
          {
            value: 'plastic',
            label: 'Kunststoff',
          },
          {
            value: 'rubber',
            label: 'Gummi',
          },
          {
            value: 'grass_paver',
            label: 'Rasengitter / Grasgitter',
          },
        ],
      },
      {
        key: 'surface_source',
        type: 'string',
        label: 'Herkunft der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'tag',
            label: 'Explizite Angabe aus OSM',
          },
          {
            value: 'tag_transformed',
            label: 'Aus OSM-Tag normalisiert',
          },
          {
            value: 'parent_highway_tag',
            label: 'Von zugeordneter Straße (OSM)',
          },
          {
            value: 'parent_highway_tag_transformed',
            label: 'Von zugeordneter Straße, normalisiert',
          },
        ],
      },
      {
        key: 'surface_confidence',
        type: 'string',
        label: 'Konfidenz der Oberfläche',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
          {
            value: 'low',
            label: 'Niedrig',
          },
        ],
      },
      {
        key: 'smoothness',
        type: 'string',
        label: 'Ober&shy;flächen&shy;qualität',
        values: [
          {
            value: 'excellent',
            label: 'Sehr gut',
          },
          {
            value: 'good',
            label: 'Gut',
          },
          {
            value: 'intermediate',
            label: 'Mittel gut',
          },
          {
            value: 'bad',
            label: 'Schlecht',
          },
          {
            value: 'very_bad',
            label: 'Sehr schlecht',
          },
        ],
      },
      {
        key: 'smoothness_source',
        type: 'string',
        label: 'Herkunft der Ober&shy;flächen&shy;qualität',
        purpose: 'qa',
        values: [
          {
            value: 'tag',
            label: 'OSM-Tag `smoothness`',
          },
          {
            value: 'tag_normalized',
            label: 'OSM-Tag `smoothness` (normalisiert)',
          },
          {
            value: 'surface_to_smoothness',
            label: 'Abgeleitet von `surface`',
          },
          {
            value: 'tracktype_to_smoothness',
            label: 'Abgeleitet von `tracktype`',
          },
          {
            value: 'mtb:scale_to_smoothness',
            label: 'Abgeleitet von `mtb:scale`',
          },
        ],
      },
      {
        key: 'smoothness_confidence',
        type: 'string',
        label: 'Konfidenz Ober&shy;flächen&shy;qualität',
        purpose: 'qa',
        values: [
          {
            value: 'high',
            label: 'Hoch',
          },
          {
            value: 'medium',
            label: 'Mittel',
          },
        ],
      },
      {
        key: 'surface_color',
        type: 'string',
        label: 'Ober&shy;flächen&shy;farbe',
        values: [
          {
            value: 'red',
            label: 'Rot',
          },
          {
            value: 'green',
            label: 'Grün',
          },
          {
            value: 'red;green',
            label: 'Rot und Grün',
          },
          {
            value: 'no',
            label: 'Keine besondere Farbe',
          },
        ],
      },
      {
        key: 'bikelane_left',
        type: 'string',
        label: 'Radinfrastruktur links',
        values: [
          {
            value: 'bicycleRoad',
            label: 'Fahrradstraße',
          },
          {
            value: 'bicycleRoad_vehicleDestination',
            label: 'Fahrradstraße mit Anlieger/Kfz frei',
          },
          {
            value: 'crossing',
            label: 'Straßenquerung',
          },
          {
            value: 'cycleway_adjoining',
            label: 'Radweg (straßenbegleitend)',
          },
          {
            value: 'cycleway_adjoiningOrIsolated',
            label: 'Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway_isolated',
            label: 'Radweg, selbstständig geführt',
          },
          {
            value: 'cyclewayLink',
            label: 'Radweg-Verbindungsstück',
          },
          {
            value: 'cyclewayOnHighway_advisory',
            label: 'Schutzstreifen',
          },
          {
            value: 'cyclewayOnHighway_advisoryOrExclusive',
            label: 'Radfahrstreifen oder Schutzstreifen (Kategorisierung unklar)',
          },
          {
            value: 'cyclewayOnHighway_exclusive',
            label: 'Radfahrstreifen',
          },
          {
            value: 'cyclewayOnHighwayBetweenLanes',
            label: 'Radfahrstreifen in Mittellage (Fahrradweiche)',
          },
          {
            value: 'cyclewayOnHighwayProtected',
            label: 'Geschützter Radfahrstreifen (PBL)',
          },
          {
            value: 'footAndCyclewaySegregated_adjoining',
            label: 'Getrennter Rad- und Gehweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewaySegregated_adjoiningOrIsolated',
            label:
              'Getrennter Rad- und Gehweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewaySegregated_isolated',
            label: 'Getrennter Rad- und Gehweg, selbstständig geführt',
          },
          {
            value: 'footAndCyclewayShared_adjoining',
            label: 'Gemeinsamer Geh- und Radweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewayShared_adjoiningOrIsolated',
            label:
              'Gemeinsamer Geh- und Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewayShared_isolated',
            label: 'Gemeinsamer Geh- und Radweg, selbstständig geführt',
          },
          {
            value: 'footwayBicycleYes_adjoining',
            label: 'Gehweg mit Radfahrer frei, straßenbegleitend',
          },
          {
            value: 'footwayBicycleYes_adjoiningOrIsolated',
            label:
              'Gehweg mit Radfahrer frei (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footwayBicycleYes_isolated',
            label: 'Gehweg mit Radfahrer frei, selbstständig geführt',
          },
          {
            value: 'livingStreet',
            label: 'Verkehrsberuhigter Bereich (Spielstraße)',
          },
          {
            value: 'pedestrianAreaBicycleYes',
            label: 'Fußgängerzone, Fahrrad frei',
          },
          {
            value: 'separate_geometry',
            label: 'RVA als separate Geometrie erfasst',
          },
          {
            value: 'sharedBusLaneBikeWithBus',
            label: 'Radfahrstreifen mit Freigabe Busverkehr',
          },
          {
            value: 'sharedBusLaneBusWithBike',
            label: 'Bussonderfahrstreifen mit Fahrrad frei',
          },
          {
            value: 'sharedMotorVehicleLane',
            label: 'Gemeinsamer Fahrstreifen',
          },
          {
            value: 'needsClarification',
            label: 'Führungsform unklar',
          },
          {
            value: 'data_no',
            label: 'Vollständig (explizit keine)',
          },
          {
            value: 'not_expected',
            label: 'Keine Infrastruktur erwartet',
          },
          {
            value: 'assumed_no',
            label: 'Vermutlich vollständig',
          },
          {
            value: 'missing',
            label: 'Unvollständig',
          },
        ],
      },
      {
        key: 'bikelane_self',
        type: 'string',
        label: 'Radinfrastruktur links',
        values: [
          {
            value: 'bicycleRoad',
            label: 'Fahrradstraße',
          },
          {
            value: 'bicycleRoad_vehicleDestination',
            label: 'Fahrradstraße mit Anlieger/Kfz frei',
          },
          {
            value: 'crossing',
            label: 'Straßenquerung',
          },
          {
            value: 'cycleway_adjoining',
            label: 'Radweg (straßenbegleitend)',
          },
          {
            value: 'cycleway_adjoiningOrIsolated',
            label: 'Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway_isolated',
            label: 'Radweg, selbstständig geführt',
          },
          {
            value: 'cyclewayLink',
            label: 'Radweg-Verbindungsstück',
          },
          {
            value: 'cyclewayOnHighway_advisory',
            label: 'Schutzstreifen',
          },
          {
            value: 'cyclewayOnHighway_advisoryOrExclusive',
            label: 'Radfahrstreifen oder Schutzstreifen (Kategorisierung unklar)',
          },
          {
            value: 'cyclewayOnHighway_exclusive',
            label: 'Radfahrstreifen',
          },
          {
            value: 'cyclewayOnHighwayBetweenLanes',
            label: 'Radfahrstreifen in Mittellage (Fahrradweiche)',
          },
          {
            value: 'cyclewayOnHighwayProtected',
            label: 'Geschützter Radfahrstreifen (PBL)',
          },
          {
            value: 'footAndCyclewaySegregated_adjoining',
            label: 'Getrennter Rad- und Gehweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewaySegregated_adjoiningOrIsolated',
            label:
              'Getrennter Rad- und Gehweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewaySegregated_isolated',
            label: 'Getrennter Rad- und Gehweg, selbstständig geführt',
          },
          {
            value: 'footAndCyclewayShared_adjoining',
            label: 'Gemeinsamer Geh- und Radweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewayShared_adjoiningOrIsolated',
            label:
              'Gemeinsamer Geh- und Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewayShared_isolated',
            label: 'Gemeinsamer Geh- und Radweg, selbstständig geführt',
          },
          {
            value: 'footwayBicycleYes_adjoining',
            label: 'Gehweg mit Radfahrer frei, straßenbegleitend',
          },
          {
            value: 'footwayBicycleYes_adjoiningOrIsolated',
            label:
              'Gehweg mit Radfahrer frei (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footwayBicycleYes_isolated',
            label: 'Gehweg mit Radfahrer frei, selbstständig geführt',
          },
          {
            value: 'livingStreet',
            label: 'Verkehrsberuhigter Bereich (Spielstraße)',
          },
          {
            value: 'pedestrianAreaBicycleYes',
            label: 'Fußgängerzone, Fahrrad frei',
          },
          {
            value: 'separate_geometry',
            label: 'RVA als separate Geometrie erfasst',
          },
          {
            value: 'sharedBusLaneBikeWithBus',
            label: 'Radfahrstreifen mit Freigabe Busverkehr',
          },
          {
            value: 'sharedBusLaneBusWithBike',
            label: 'Bussonderfahrstreifen mit Fahrrad frei',
          },
          {
            value: 'sharedMotorVehicleLane',
            label: 'Gemeinsamer Fahrstreifen',
          },
          {
            value: 'needsClarification',
            label: 'Führungsform unklar',
          },
          {
            value: 'data_no',
            label: 'Vollständig (explizit keine)',
          },
          {
            value: 'not_expected',
            label: 'Keine Infrastruktur erwartet',
          },
          {
            value: 'assumed_no',
            label: 'Vermutlich vollständig',
          },
          {
            value: 'missing',
            label: 'Unvollständig',
          },
        ],
      },
      {
        key: 'bikelane_right',
        type: 'string',
        label: 'Radinfrastruktur links',
        values: [
          {
            value: 'bicycleRoad',
            label: 'Fahrradstraße',
          },
          {
            value: 'bicycleRoad_vehicleDestination',
            label: 'Fahrradstraße mit Anlieger/Kfz frei',
          },
          {
            value: 'crossing',
            label: 'Straßenquerung',
          },
          {
            value: 'cycleway_adjoining',
            label: 'Radweg (straßenbegleitend)',
          },
          {
            value: 'cycleway_adjoiningOrIsolated',
            label: 'Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'cycleway_crossing',
            label: 'Straßenquerung (Radverkehr)',
          },
          {
            value: 'cycleway_isolated',
            label: 'Radweg, selbstständig geführt',
          },
          {
            value: 'cyclewayLink',
            label: 'Radweg-Verbindungsstück',
          },
          {
            value: 'cyclewayOnHighway_advisory',
            label: 'Schutzstreifen',
          },
          {
            value: 'cyclewayOnHighway_advisoryOrExclusive',
            label: 'Radfahrstreifen oder Schutzstreifen (Kategorisierung unklar)',
          },
          {
            value: 'cyclewayOnHighway_exclusive',
            label: 'Radfahrstreifen',
          },
          {
            value: 'cyclewayOnHighwayBetweenLanes',
            label: 'Radfahrstreifen in Mittellage (Fahrradweiche)',
          },
          {
            value: 'cyclewayOnHighwayProtected',
            label: 'Geschützter Radfahrstreifen (PBL)',
          },
          {
            value: 'footAndCyclewaySegregated_adjoining',
            label: 'Getrennter Rad- und Gehweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewaySegregated_adjoiningOrIsolated',
            label:
              'Getrennter Rad- und Gehweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewaySegregated_isolated',
            label: 'Getrennter Rad- und Gehweg, selbstständig geführt',
          },
          {
            value: 'footAndCyclewayShared_adjoining',
            label: 'Gemeinsamer Geh- und Radweg, straßenbegleitend',
          },
          {
            value: 'footAndCyclewayShared_adjoiningOrIsolated',
            label:
              'Gemeinsamer Geh- und Radweg (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footAndCyclewayShared_isolated',
            label: 'Gemeinsamer Geh- und Radweg, selbstständig geführt',
          },
          {
            value: 'footwayBicycleYes_adjoining',
            label: 'Gehweg mit Radfahrer frei, straßenbegleitend',
          },
          {
            value: 'footwayBicycleYes_adjoiningOrIsolated',
            label:
              'Gehweg mit Radfahrer frei (Straßenbegleitend oder selbstständig geführt; Kategorisierung unklar)',
          },
          {
            value: 'footwayBicycleYes_isolated',
            label: 'Gehweg mit Radfahrer frei, selbstständig geführt',
          },
          {
            value: 'livingStreet',
            label: 'Verkehrsberuhigter Bereich (Spielstraße)',
          },
          {
            value: 'pedestrianAreaBicycleYes',
            label: 'Fußgängerzone, Fahrrad frei',
          },
          {
            value: 'separate_geometry',
            label: 'RVA als separate Geometrie erfasst',
          },
          {
            value: 'sharedBusLaneBikeWithBus',
            label: 'Radfahrstreifen mit Freigabe Busverkehr',
          },
          {
            value: 'sharedBusLaneBusWithBike',
            label: 'Bussonderfahrstreifen mit Fahrrad frei',
          },
          {
            value: 'sharedMotorVehicleLane',
            label: 'Gemeinsamer Fahrstreifen',
          },
          {
            value: 'needsClarification',
            label: 'Führungsform unklar',
          },
          {
            value: 'data_no',
            label: 'Vollständig (explizit keine)',
          },
          {
            value: 'not_expected',
            label: 'Keine Infrastruktur erwartet',
          },
          {
            value: 'assumed_no',
            label: 'Vermutlich vollständig',
          },
          {
            value: 'missing',
            label: 'Unvollständig',
          },
        ],
      },
      {
        key: 'todos',
        type: 'sanitized_strings',
        label: 'Todo-Liste',
        purpose: 'qa',
        values: [],
      },
      {
        key: '_is_sidepath',
        type: 'ignore',
        label: '_is_sidepath',
        purpose: 'processing',
        values: [],
      },
      {
        key: '_in_settlement_area',
        type: 'ignore',
        label: '_in_settlement_area',
        purpose: 'processing',
        values: [],
      },
    ],
    chapters: [
      {
        id: 'versetzte-geometrien',
        title: 'Versetzte Geometrien',
        markdown:
          'Die Geometrien für Radinfrastruktur, die von der Straßen-Mittellinie abgeleitet werden (siehe Hinweise „Transformierte Geometrie“ im Inspektor in der Kartenansicht), werden als Teil der Prozessierung nach links und rechts versetzt. Dafür verwenden wir die Breite der Straße als Referenz.\n\n**HINWEIS:** Wir planen dieses Feature in der Zukunft umzubauen. Dann werden die Daten eine Eigenschaft haben, aus der der empfohlene Versatz hervorgeht, so dass man sie im Kartenstil visuell versetzen kann, aber sie in den Daten auf der Mittellinie bleiben.\n',
      },
    ],
  },
  todos_lines: {
    topic: 'roads_bikelanes',
    tableName: 'todos_lines',
    sourceIds: ['atlas_todos_lines'],
    title: 'Kampagnen',
    summary:
      'Datenbasis für Kampagnen zur Qualitätssicherung. Angaben aus diesen Tabellen werden auf TILDA und auf radinfra.de mit Erklärungen zur Datenverbesserung angezeigt. Beschreibt potenziell fehlende oder falsche Attribute in OpenStreetMap.',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'table',
        type: 'string',
        label: 'Quelle',
        values: [
          {
            value: 'roads',
            label: 'Straßen',
          },
          {
            value: 'bikelanes',
            label: 'Radinfrastruktur',
          },
        ],
      },
      {
        key: 'length',
        type: 'meter',
        label: 'Länge',
        values: [],
      },
      {
        key: 'todos',
        type: 'sanitized_strings',
        label: 'Todo-Liste',
        purpose: 'qa',
        values: [],
      },
    ],
    chapters: [
      {
        id: 'versetzte-geometrien',
        title: 'Versetzte Geometrien',
        markdown:
          'Die Geometrien für Radinfrastruktur, die von der Straßen-Mittellinie abgeleitet werden (siehe Hinweise „Transformierte Geometrie“ im Inspektor in der Kartenansicht), werden als Teil der Prozessierung nach links und rechts versetzt. Dafür verwenden wir die Breite der Straße als Referenz.\n\n**HINWEIS:** Wir planen dieses Feature in der Zukunft umzubauen. Dann werden die Daten eine Eigenschaft haben, aus der der empfohlene Versatz hervorgeht, so dass man sie im Kartenstil visuell versetzen kann, aber sie in den Daten auf der Mittellinie bleiben.\n',
      },
    ],
  },
  trafficSigns: {
    topic: 'trafficSigns',
    tableName: 'trafficSigns',
    sourceIds: ['atlas_trafficSigns'],
    title: 'Beschilderung',
    groups: [
      {
        id: 'atlas',
        label: 'Atlas Daten',
      },
    ],
    attributes: [
      {
        key: 'traffic_sign',
        type: 'sanitized_strings',
        label: 'Verkehrszeichen',
        description:
          'Im Format der OSM-Verkehrszeichen-Nomenklatur mit offiziellen Verkehrszeichen-IDs, z. B. `DE:240`.',
        values: [],
      },
      {
        key: 'offset',
        type: 'meter',
        label: 'Offset entlang der Linie',
        values: [],
      },
      {
        key: 'direction',
        type: 'number',
        label: 'Ausrichtung',
        values: [],
      },
      {
        key: 'direction_source',
        type: 'string',
        label: 'Herkunft der Ausrichtung',
        purpose: 'qa',
        values: [
          {
            value: 'tag_degrees',
            label: 'Aus OSM-Tag als Winkel',
          },
          {
            value: 'tag_cardinal',
            label: 'Aus OSM-Tag als Himmelsrichtung',
          },
        ],
      },
      {
        key: 'description',
        type: 'sanitized_strings',
        label: 'Beschreibung',
        values: [],
      },
      {
        key: 'mapillary',
        type: 'sanitized_strings',
        label: 'Straßenfotos (Mapillary)',
        description:
          'Mapillary-Bild-IDs (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
        values: [],
      },
      {
        key: 'osm_traffic_sign:direction',
        type: 'sanitized_strings',
        label: 'OSM `traffic_sign:direction`',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_traffic_sign:forward',
        type: 'sanitized_strings',
        label: 'OSM `traffic_sign:forward`',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_traffic_sign:backward',
        type: 'sanitized_strings',
        label: 'OSM `traffic_sign:backward`',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_traffic_sign:both',
        type: 'sanitized_strings',
        label: 'OSM `traffic_sign:both`',
        purpose: 'experimentation',
        values: [],
      },
      {
        key: 'osm_direction',
        type: 'sanitized_strings',
        label: 'OSM `direction`',
        purpose: 'experimentation',
        values: [],
      },
    ],
    chapters: [],
  },
} as const satisfies Partial<Record<string, TopicDocCompiled>>

export default data

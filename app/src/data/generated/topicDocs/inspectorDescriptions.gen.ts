const data = {
  atlas_poiClassification: {
    keys: {},
    values: {
      type: {
        'amenity-fallback':
          'Auffangkategorie fuer seltene oder uneinheitliche amenity-Werte unterhalb des Volumen-Schwellenwertes.',
        'leisure-fallback':
          'Auffangkategorie fuer seltene oder uneinheitliche leisure-Werte unterhalb des Volumen-Schwellenwertes.',
        'shop-fallback':
          'Auffangkategorie fuer seltene oder uneinheitliche shop-Werte unterhalb des Volumen-Schwellenwertes.',
        'tourism-fallback':
          'Auffangkategorie fuer seltene oder uneinheitliche tourism-Werte unterhalb des Volumen-Schwellenwertes.',
      },
    },
  },
  atlas_trafficSigns: {
    keys: {
      traffic_sign:
        'Im Format der OSM-Verkehrszeichen-Nomenklatur mit offiziellen Verkehrszeichen-IDs, z. B. `DE:240`.',
      mapillary:
        'Mapillary-Bild-IDs (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
    },
    values: {},
  },
  atlas_bicycleParking: {
    keys: {
      mapillary: 'Mapillary-Foto-ID für dieses Feature.',
      traffic_sign: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
    },
    values: {},
  },
  tilda_parkings_quantized: {
    keys: {
      parking: 'Lage oder Art des Parkraums im Straßenland.',
      capacity: 'Geschätzte oder explizit erfasste Anzahl von Stellplätzen.',
      orientation: 'Ausrichtung der Fahrzeuge im Straßenland zur Verkehrsrichtung.',
      staggered:
        'Besondere Merkmale zur Parkweise, insbesondere bei alternierendem/versetztem Parken auf Fahrbahnen, die zu schmal sind um auf beiden Seiten gleichzeitig zu parken, keine Markierungen und Beschilderungen aufweisen, die das Parken regeln und auf denen gewöhnlich wechselseitig abschnittsweise auf der einen oder anderen Straßenseite geparkt wird oder geparkt werden kann.',
      length:
        'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
      source: 'Datenquelle der Parkraumgeometrie aus OpenStreetMap.',
      geom_sources:
        'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs die für eine Geometrie verwendeten wurden.',
      tag_sources:
        'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs aus denen die OSM-Tags abgeleitet wurden.',
      road: 'Art der Straße, an dem der Parkraum liegt.',
      road_name: 'Name der Straße, an dem der Parkraum liegt.',
      road_oneway: 'Verkehrsrichtung der Straße, an dem der Parkraum liegt.',
      road_width: 'Breite der Fahrbahn, an dem der Parkraum liegt.',
      side: 'Seite des Parkraums relativ zur Linienrichtung der OSM-Geometrie.',
      area: 'Fläche des durch parkende Fahrzeuge auf diesem Parkraumabschnitt belegten Raumes in Quadratmetern.',
      surface: 'Oberflächenbelag des Parkraumabschnitts.',
      direction: 'Vorgesehene oder ausgeschilderte Fahrzeugrichtung beim Einparken.',
      location: 'Besondere Lagemerkmale des Parkraums im Straßenland.',
      zone: 'Parkzonennummer oder -bezeichnung entsprechend der lokalen Parkraumbewirtschaftung bei Stellplätzen, die nur mit einem entsprechenden Parkrausweis genutzt werden dürfen. Sind (insbesondere an Zonengrenzen) mehrere Parkzonen berechtigt, sind diese üblicherweise als semikolongetrennte Liste aufgeführt.',
      reason: 'Angabe eines Grundes bei Nicht-Parken.',
      mapillary: 'Mapillary-Foto-ID für dieses Feature.',
      traffic_sign: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
      _staggered_maneuvering_loss:
        'Interner Wert aus der Kapazitätsberechnung bei alternierendem Parken',
      _staggered_original_capacity:
        'Interner Zwischenwert vor Anwendung der alternierenden-Parken-Logik',
    },
    values: {
      staggered: {
        yes: 'Auf diesem Abschnitt ist die Fahrbahn zu schmal, um auf beiden Seiten gleichzeitig zu parken. Es gibt keine Markierungen oder Schilder, die das Parken regeln. Häufig entwickeln sich örtliche Konventionen, in welchen Bereichen auf welcher Seite geparkt wird. In die Kapazitätsberechnung fließt das ein: Die Kapazität wird um 50% reduziert (da nur eine Seite genutzt werden kann) und zusätzlich wird für jeden 60m-Abschnitt ein Manövrierraumverlust von 10m (≈1,9 Fahrzeugplätze) abgezogen, da beim Seitenwechsel Manövrierraum benötigt wird. Diese Angaben basieren auf Erfahrungswerten und können lediglich eine Schätzung des tatsächlichen Parkgeschehens abbilden.',
      },
    },
  },
  tilda_parkings_no: {
    keys: {
      parking: 'Lage oder Art des Parkraums im Straßenland.',
      reason: 'Angabe eines Grundes bei Nicht-Parken.',
      capacity: 'Geschätzte oder explizit erfasste Anzahl von Stellplätzen.',
      capacity_source: 'Herkunft der Stellplatzanzahl inklusive Schätz- oder Umverteilungslogik.',
      orientation: 'Ausrichtung der Fahrzeuge im Straßenland zur Verkehrsrichtung.',
      staggered:
        'Besondere Merkmale zur Parkweise, insbesondere bei alternierendem/versetztem Parken auf Fahrbahnen, die zu schmal sind um auf beiden Seiten gleichzeitig zu parken, keine Markierungen und Beschilderungen aufweisen, die das Parken regeln und auf denen gewöhnlich wechselseitig abschnittsweise auf der einen oder anderen Straßenseite geparkt wird oder geparkt werden kann.',
      source: 'Datenquelle der Parkraumgeometrie aus OpenStreetMap.',
      geom_sources:
        'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs die für eine Geometrie verwendeten wurden.',
      tag_sources:
        'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs aus denen die OSM-Tags abgeleitet wurden.',
      road: 'Art der Straße, an dem der Parkraum liegt.',
      road_name: 'Name der Straße, an dem der Parkraum liegt.',
      road_oneway: 'Verkehrsrichtung der Straße, an dem der Parkraum liegt.',
      road_width: 'Breite der Fahrbahn, an dem der Parkraum liegt.',
      side: 'Seite des Parkraums relativ zur Linienrichtung der OSM-Geometrie.',
      area: 'Fläche des durch parkende Fahrzeuge auf diesem Parkraumabschnitt belegten Raumes in Quadratmetern.',
      surface: 'Oberflächenbelag des Parkraumabschnitts.',
      direction: 'Vorgesehene oder ausgeschilderte Fahrzeugrichtung beim Einparken.',
      location: 'Besondere Lagemerkmale des Parkraums im Straßenland.',
      zone: 'Parkzonennummer oder -bezeichnung entsprechend der lokalen Parkraumbewirtschaftung bei Stellplätzen, die nur mit einem entsprechenden Parkrausweis genutzt werden dürfen. Sind (insbesondere an Zonengrenzen) mehrere Parkzonen berechtigt, sind diese üblicherweise als semikolongetrennte Liste aufgeführt.',
      mapillary: 'Mapillary-Foto-ID für dieses Feature.',
      traffic_sign: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
      _staggered_maneuvering_loss:
        'Interner Wert aus der Kapazitätsberechnung bei alternierendem Parken',
      _staggered_original_capacity:
        'Interner Zwischenwert vor Anwendung der alternierenden-Parken-Logik',
    },
    values: {
      staggered: {
        yes: 'Auf diesem Abschnitt ist die Fahrbahn zu schmal, um auf beiden Seiten gleichzeitig zu parken. Es gibt keine Markierungen oder Schilder, die das Parken regeln. Häufig entwickeln sich örtliche Konventionen, in welchen Bereichen auf welcher Seite geparkt wird. In die Kapazitätsberechnung fließt das ein: Die Kapazität wird um 50% reduziert (da nur eine Seite genutzt werden kann) und zusätzlich wird für jeden 60m-Abschnitt ein Manövrierraumverlust von 10m (≈1,9 Fahrzeugplätze) abgezogen, da beim Seitenwechsel Manövrierraum benötigt wird. Diese Angaben basieren auf Erfahrungswerten und können lediglich eine Schätzung des tatsächlichen Parkgeschehens abbilden.',
      },
    },
  },
  tilda_parkings_off_street: {
    keys: {
      category: 'Kategorie der Parkmöglichkeit.',
      parking: 'Typ der Parkmöglichkeit.',
      capacity: 'Geschätzte oder explizit erfasste Anzahl von Stellplätzen.',
      capacity_source: 'Herkunft der Stellplatzanzahl inklusive Schätz- oder Umverteilungslogik.',
      area: 'Fläche in Quadratmetern.',
      surface: 'Oberflächenbelag des Parkraumabschnitts.',
      orientation: 'Ausrichtung der Fahrzeuge im Straßenland zur Verkehrsrichtung.',
      location: 'Besondere Lagemerkmale des Parkraums im Straßenland.',
      zone: 'Parkzonennummer oder -bezeichnung entsprechend der lokalen Parkraumbewirtschaftung bei Stellplätzen, die nur mit einem entsprechenden Parkrausweis genutzt werden dürfen. Sind (insbesondere an Zonengrenzen) mehrere Parkzonen berechtigt, sind diese üblicherweise als semikolongetrennte Liste aufgeführt.',
      mapillary: 'Mapillary-Foto-ID für dieses Feature.',
      traffic_sign: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
    },
    values: {},
  },
  tilda_parkings_cutouts: {
    keys: {
      source:
        'In der Export-Tabelle `parkings_cutouts` erscheinen nur Stanzungen, deren `source` nicht parking_roads, separate_parking_areas oder separate_parking_points ist.',
      buffer_radius: 'Radius der Stanzung in Metern.',
      radius:
        'Radius eines Puffers in Metern, u. a. an Kreuzungs-Ecken (Bordsteinschnittpunkte) und eUVM-Punkten.',
      geom_sources: 'Interne Aufschlüsselung der für die Geometrie verwendeten Quellen (JSON).',
      tag_sources: 'Interne Aufschlüsselung der OSM-Tag-Herkunft (JSON).',
    },
    values: {},
  },
  tilda_parkings_off_street_quantized: {
    keys: {
      category: 'Kategorie der Parkmöglichkeit.',
      parking: 'Typ der Parkmöglichkeit.',
      capacity: 'Geschätzte oder explizit erfasste Anzahl von Stellplätzen.',
      area: 'Fläche in Quadratmetern.',
      surface: 'Oberflächenbelag des Parkraumabschnitts.',
      orientation: 'Ausrichtung der Fahrzeuge im Straßenland zur Verkehrsrichtung.',
      location: 'Besondere Lagemerkmale des Parkraums im Straßenland.',
      zone: 'Parkzonennummer oder -bezeichnung entsprechend der lokalen Parkraumbewirtschaftung bei Stellplätzen, die nur mit einem entsprechenden Parkrausweis genutzt werden dürfen. Sind (insbesondere an Zonengrenzen) mehrere Parkzonen berechtigt, sind diese üblicherweise als semikolongetrennte Liste aufgeführt.',
      mapillary: 'Mapillary-Foto-ID für dieses Feature.',
      traffic_sign: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
    },
    values: {},
  },
  tilda_parkings: {
    keys: {
      parking: 'Lage oder Art des Parkraums im Straßenland.',
      capacity: 'Geschätzte oder explizit erfasste Anzahl von Stellplätzen.',
      capacity_source: 'Herkunft der Stellplatzanzahl inklusive Schätz- oder Umverteilungslogik.',
      orientation: 'Ausrichtung der Fahrzeuge im Straßenland zur Verkehrsrichtung.',
      staggered:
        'Besondere Merkmale zur Parkweise, insbesondere bei alternierendem/versetztem Parken auf Fahrbahnen, die zu schmal sind um auf beiden Seiten gleichzeitig zu parken, keine Markierungen und Beschilderungen aufweisen, die das Parken regeln und auf denen gewöhnlich wechselseitig abschnittsweise auf der einen oder anderen Straßenseite geparkt wird oder geparkt werden kann.',
      length:
        'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
      source: 'Datenquelle der Parkraumgeometrie aus OpenStreetMap.',
      geom_sources:
        'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs die für eine Geometrie verwendeten wurden.',
      tag_sources:
        'Interne Hilftswerte. Semikolonseparierte Liste der OSM-IDs aus denen die OSM-Tags abgeleitet wurden.',
      road: 'Art der Straße, an dem der Parkraum liegt.',
      road_name: 'Name der Straße, an dem der Parkraum liegt.',
      road_oneway: 'Verkehrsrichtung der Straße, an dem der Parkraum liegt.',
      road_width: 'Breite der Fahrbahn, an dem der Parkraum liegt.',
      side: 'Seite des Parkraums relativ zur Linienrichtung der OSM-Geometrie.',
      area: 'Fläche des durch parkende Fahrzeuge auf diesem Parkraumabschnitt belegten Raumes in Quadratmetern.',
      surface: 'Oberflächenbelag des Parkraumabschnitts.',
      direction: 'Vorgesehene oder ausgeschilderte Fahrzeugrichtung beim Einparken.',
      location: 'Besondere Lagemerkmale des Parkraums im Straßenland.',
      zone: 'Parkzonennummer oder -bezeichnung entsprechend der lokalen Parkraumbewirtschaftung bei Stellplätzen, die nur mit einem entsprechenden Parkrausweis genutzt werden dürfen. Sind (insbesondere an Zonengrenzen) mehrere Parkzonen berechtigt, sind diese üblicherweise als semikolongetrennte Liste aufgeführt.',
      reason: 'Angabe eines Grundes bei Nicht-Parken.',
      mapillary: 'Mapillary-Foto-ID für dieses Feature.',
      traffic_sign: 'Verkehrszeichennummer, mit der dieses Feature ausgeschildert ist.',
      _staggered_maneuvering_loss:
        'Interner Wert aus der Kapazitätsberechnung bei alternierendem Parken',
      _staggered_original_capacity:
        'Interner Zwischenwert vor Anwendung der alternierenden-Parken-Logik',
    },
    values: {
      staggered: {
        yes: 'Auf diesem Abschnitt ist die Fahrbahn zu schmal, um auf beiden Seiten gleichzeitig zu parken. Es gibt keine Markierungen oder Schilder, die das Parken regeln. Häufig entwickeln sich örtliche Konventionen, in welchen Bereichen auf welcher Seite geparkt wird. In die Kapazitätsberechnung fließt das ein: Die Kapazität wird um 50% reduziert (da nur eine Seite genutzt werden kann) und zusätzlich wird für jeden 60m-Abschnitt ein Manövrierraumverlust von 10m (≈1,9 Fahrzeugplätze) abgezogen, da beim Seitenwechsel Manövrierraum benötigt wird. Diese Angaben basieren auf Erfahrungswerten und können lediglich eine Schätzung des tatsächlichen Parkgeschehens abbilden.',
      },
    },
  },
  atlas_bikelanes: {
    keys: {
      length:
        'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
      prefix:
        'Kennzeichnet, aus welcher OSM-Tagfamilie die Radverkehrsinformationen für dieses Objekt extrahiert wurden. Der Wert wird im Processing gesetzt und beschreibt die verwendete Tag-Präfixlogik, nicht die Quelle im Sinne eines externen Datensatzes.',
      mapillary_coverage:
        'Basiert auf einer Analyse der Mapillary-Foto-Sequenzen der letzten ca. 2 Jahre, die mit den OSM-Wegen verschnitten wurden. Mehr unter https://tilda-geo.de/docs/mapillary-coverage',
      mapillary:
        'Mapillary-Bild-IDs (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_forward:
        'Mapillary-Bild-IDs in Linienrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_backward:
        'Mapillary-Bild-IDs in Gegenrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_traffic_sign:
        'Mapillary-Bild-IDs für Verkehrszeichen (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      offset:
        'Seitlicher Versatz der Liniengeometrie in Metern. Der Wert wird im Processing aus der halben Straßenbreite berechnet; positive Werte liegen links der Referenzlinie, negative rechts.',
    },
    values: {
      oneway: {
        assumed_no:
          'Keine explizite OSM-Angabe zur Verkehrsrichtung vorhanden. Aus Führungsform und Umfeld wird hier beide Richtungen als wahrscheinlich angenommen.',
        implicit_yes:
          'Keine explizite OSM-Angabe zur Verkehrsrichtung vorhanden. Aus Führungsform und Umfeld wird hier eine Richtung als wahrscheinlich angenommen.',
      },
      traffic_sign: {
        never:
          'Wird aktuell intern für `category=cyclewayOnHighwayBetweenLanes` verwendet um klarzustellen, dass hier nie ein Verkehrszeichen zu erwarten ist.',
      },
      'traffic_sign:forward': {
        never:
          'Wird aktuell intern für `category=cyclewayOnHighwayBetweenLanes` verwendet um klarzustellen, dass hier nie ein Verkehrszeichen zu erwarten ist.',
      },
      'traffic_sign:backward': {
        never:
          'Wird aktuell intern für `category=cyclewayOnHighwayBetweenLanes` verwendet um klarzustellen, dass hier nie ein Verkehrszeichen zu erwarten ist.',
      },
    },
  },
  atlas_roadsPathClasses: {
    keys: {
      length:
        'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
      mapillary_coverage:
        'Basiert auf einer Analyse der Mapillary-Foto-Sequenzen der letzten ca. 2 Jahre, die mit den OSM-Wegen verschnitten wurden. Mehr unter https://tilda-geo.de/docs/mapillary-coverage',
      mapillary:
        'Mapillary-Bild-IDs (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_forward:
        'Mapillary-Bild-IDs in Linienrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_backward:
        'Mapillary-Bild-IDs in Gegenrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_traffic_sign:
        'Mapillary-Bild-IDs für Verkehrszeichen (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
    },
    values: {},
  },
  atlas_bikeSuitability: {
    keys: {
      length:
        'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
      mapillary_coverage:
        'Basiert auf einer Analyse der Mapillary-Foto-Sequenzen der letzten ca. 2 Jahre, die mit den OSM-Wegen verschnitten wurden. Mehr unter https://tilda-geo.de/docs/mapillary-coverage',
      mapillary:
        'Mapillary-Bild-IDs (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_forward:
        'Mapillary-Bild-IDs in Linienrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_backward:
        'Mapillary-Bild-IDs in Gegenrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_traffic_sign:
        'Mapillary-Bild-IDs für Verkehrszeichen (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
    },
    values: {},
  },
  atlas_roads: {
    keys: {
      name_ref: 'Enthält Kurznamen wie `A 100` oder `B 96`, übernommen aus dem OSM-Tag `ref`.',
      length:
        'Ein berechneter Wert für as OpenStreetMap-Straßensegment. Die Berechnung nutzt die Projektion EPSG:5243 und hat somit eine gute Genaugikeit für Deutschland.',
      mapillary_coverage:
        'Basiert auf einer Analyse der Mapillary-Foto-Sequenzen der letzten ca. 2 Jahre, die mit den OSM-Wegen verschnitten wurden. Mehr unter https://tilda-geo.de/docs/mapillary-coverage',
      mapillary:
        'Mapillary-Bild-IDs (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_forward:
        'Mapillary-Bild-IDs in Linienrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_backward:
        'Mapillary-Bild-IDs in Gegenrichtung (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
      mapillary_traffic_sign:
        'Mapillary-Bild-IDs für Verkehrszeichen (technisch bereinigt). Mehrere IDs sind als semikolongetrennte Liste möglich. Im Inspector wird pro ID ein Link erzeugt, z. B. `https://www.mapillary.com/app/?pKey=<ID>&focus=photo&z=15`.',
    },
    values: {},
  },
} as const satisfies Record<
  string,
  { keys: Record<string, string>; values: Record<string, Record<string, string>> }
>

export default data

/**
 * Die vier Zielort-Kategorien des Faktors „Zielorte" (`w_target`).
 *
 * Quelle ist `public."poiClassification"` (processing/topics/poiClassification): jeder relevante
 * OSM-Punkt landet dort in genau einer dieser vier Kategorien. Bis hierher gingen alle vier
 * gleichwertig in den Zuschlag ein; über `zielort_category_shares` lässt sich ihr Verhältnis
 * zueinander verschieben (siehe `zielortShares.ts` und `scorer.py`).
 *
 * `color` ist bewusst dieselbe Farbe, mit der die Kategorie im Zielorte-Layer der Karte gezeichnet
 * wird (`mapboxStyles/groups/atlas_pois_default.ts`, Layer `pois-classification`) — die Regler
 * sollen ohne Legende zum Kartenbild passen. Ändert sich dort die Farbe, hier nachziehen.
 *
 * Die `help`-Texte listen die häufigsten OSM-Werte der Kategorie aus
 * `processing/topics/poiClassification/helper/category_values_with_categories.lua`.
 */
export type ZielortCategory = 'Grundversorgung' | 'Bildung' | 'Einkauf' | 'Freizeit'

export const ZIELORT_CATEGORIES: {
  key: ZielortCategory
  label: string
  color: string
  help: string
}[] = [
  {
    key: 'Grundversorgung',
    label: 'Grundversorgung',
    color: '#f18241',
    help: 'Ärztinnen und Ärzte, Zahnarztpraxen, Kliniken und Krankenhäuser, Apotheken, Tierarztpraxen, Banken, Post und Postfilialen, Bibliotheken, Ämter und Rathaus, Gerichte, Jobcenter, soziale Einrichtungen, Rettungswachen sowie Autovermietung.',
  },
  {
    key: 'Bildung',
    label: 'Bildung',
    color: '#3568de',
    help: 'Schulen, Kindergärten und Kitas, Kindertagespflege, Hochschulen und Universitäten, Forschungseinrichtungen, Sprach- und Nachhilfeschulen, Volkshochschulen und Gemeinschaftshäuser sowie Verkehrsgärten.',
  },
  {
    key: 'Einkauf',
    label: 'Einkauf',
    color: '#80e5d1',
    help: 'Supermärkte, Bäckereien, Metzgereien, Obst- und Gemüseläden, Getränkemärkte, Kioske und Spätis, Drogerien, Kaufhäuser, Kleidung, Schuhe, Bücher, Elektronik und Handy, Fahrrad- und Sportgeschäfte, Blumen, Optik, Friseur, Waschsalon, Tankstellen und Wochenmärkte.',
  },
  {
    key: 'Freizeit',
    label: 'Freizeit',
    color: '#b1e755',
    help: 'Spielplätze, Sportplätze, Sporthallen, Fitness- und Sportzentren, Schwimmbäder und Badestellen, Parks mit Spiel- und Grillplätzen, Cafés, Restaurants, Imbisse, Bars, Kneipen und Biergärten, Kinos, Theater, Museen, Galerien und Veranstaltungsorte, Zoo und Aquarium, Kirchen und andere Orte der Andacht, Hotels und Pensionen, Fahrradverleih sowie Sehenswürdigkeiten und Aussichtspunkte.',
  },
]

export const ZIELORT_CATEGORY_KEYS = ZIELORT_CATEGORIES.map((category) => category.key)

/** Gleichverteilung — der Stand, mit dem der Faktor sich genau wie vor der Kategorie-Gewichtung
 * verhält (siehe `zielortShares.ts`). */
export const DEFAULT_ZIELORT_SHARES: Record<ZielortCategory, number> = {
  Grundversorgung: 25,
  Bildung: 25,
  Einkauf: 25,
  Freizeit: 25,
}

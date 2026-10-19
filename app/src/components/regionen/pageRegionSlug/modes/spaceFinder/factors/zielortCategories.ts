/**
 * The four target location categories of the factor „Zielorte" (`w_target`).
 *
 * Source is `public."poiClassification"` (processing/topics/poiClassification): every relevant
 * OSM point ends up in exactly one of these four categories. Previously all four counted
 * equally towards the bonus; `zielort_category_shares` shifts their ratio
 * (see `zielortShares.ts` and `scorer.py`).
 *
 * `color` is deliberately the color the category is drawn with in the Zielorte map layer
 * (`mapboxStyles/groups/atlas_pois_default.ts`, layer `pois-classification`) — the sliders
 * should match the map without a legend. If the color changes there, update it here.
 *
 * The `help` texts list the most common OSM values of the category from
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

/** Equal split — with this the factor behaves exactly as before category weighting existed
 * (see `zielortShares.ts`). */
export const DEFAULT_ZIELORT_SHARES: Record<ZielortCategory, number> = {
  Grundversorgung: 25,
  Bildung: 25,
  Einkauf: 25,
  Freizeit: 25,
}

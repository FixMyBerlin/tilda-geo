export type StaticDatasetCategoryKey = keyof typeof staticDatasetCategories

export const staticDatasetCategories = {
  'bb/Netzkonzeption': {
    order: 1,
    title: 'Netzentwicklung Land',
    subtitle: 'Statische Daten zur Entwicklung des Radnetzes für Brandenburg',
  },
  'bb/Beteiligung': {
    order: 1.5,
    title: 'Beteiligung',
    subtitle: 'Aktuelle Beteiligungsbeiträge',
  },
  'bb/Bestandsdaten': {
    order: 2,
    title: 'Bestandsdaten',
    subtitle: 'Statische Daten zur vorhandenen Radinfrastruktur',
  },
  'bb/Radnetze': {
    order: 3,
    title: 'Radnetze und Routen',
    subtitle:
      'Statische Daten zu vorhandenen Radnetzen, touristischen Routen, Bedarfen und Planungen',
  },
  'bb/Landesdaten': {
    order: 4,
    title: 'Weitere Daten',
    subtitle: 'Weitere statische Daten',
  },
  'bibi/Radverkehr': {
    order: 1,
    title: 'Radverkehr',
    subtitle: 'Statische Daten zum Radverkehr',
  },
  'bibi/Parkraum': {
    order: 2,
    title: 'Parkraum',
    subtitle: 'Statische Daten zum Parkraum',
  },
  'nudafa/general': {
    order: 1,
    title: 'Statisch Daten',
    subtitle: 'Statische Daten',
  },
  'nudafa/website': {
    order: 2,
    title: 'Daten für nudafa.de',
    subtitle: 'Statische Daten die auf nudafa.de verwendet werden.',
  },
  'radplus/fahrten': {
    order: 1,
    title: 'Rad+ Fahrten',
    subtitle: 'Statische Daten der Fahrten von Rad+ Nutzer:innen.',
  },
  'radplus/radparken': {
    order: 2,
    title: 'radparken.info',
    subtitle: 'Statische Daten der radparken.info Umfragen.',
  },
  'parkraum/euvm': {
    order: 1,
    title: 'Parkflächen eUVM-Projekt',
    subtitle: 'Statische Daten aus dem Parkflächen eUVM-Projekt.',
  },
  'parkraum/osm_euvm': {
    order: 1,
    title: 'Parkflächen OSM aus eUVM',
    subtitle:
      'Statische Daten aus OpenStreetMap für Testgebiete in denen eUVM Daten übernommen wurden.',
  },
  'parkraum/misc': {
    order: 2,
    title: 'Weitere Daten',
    subtitle: 'Weitere statische Daten.',
  },
  'berlin/netz': {
    order: 1,
    title: 'Netze',
    subtitle: 'Statische Geodaten zum Straßennetz und Radinfrastruktur.',
  },
  'berlin/misc': {
    order: 3,
    title: 'Weitere Daten',
    subtitle: 'Weitere statische Geodaten.',
  },
  'berlin/cc': {
    order: 2,
    title: 'Changing Cities Monitoring',
    subtitle: 'Statische Geodaten zum Monitoring des Radnetzes von Changing Cities.',
  },
  'berlin/infravelo_results': {
    order: 2,
    title: 'infraVelo Prozessierung',
    subtitle: 'Statische Ergebnisse der Prozessierung.',
  },
  'woldegk/primary': {
    order: 1,
    title: 'Aktuelle Planungen',
    subtitle: 'Statische Geodaten zu aktuellen Planungen.',
  },
  'woldegk/archive': {
    order: 1,
    title: 'Archivierte Planungen',
    subtitle: 'Statische Geodaten zu vergangenen Planungsständen.',
  },
  'pankow/analyse': {
    order: 1,
    title: 'Analysen',
    subtitle: 'Häufig genutzte Wege und Querungen mit hoher Unfallbelastung oder ohne Tempolimit.',
  },
  'pankow/haeufigkeiten': {
    order: 1,
    title: 'Nutzungshäufigkeiten',
    subtitle: 'Fußverkehrsfrequenzen für verschiedene Zielgruppen und Zielorte.',
  },
  'pankow/grundschulen': {
    order: 1,
    title: 'Grundschulen',
    subtitle: 'Standorte öffentlicher Grundschulen und deren Schuleinzugsgebiete.',
  },
  'pankow/unfall': {
    order: 2,
    title: 'Unfälle',
    subtitle: 'Standorte von Unfällen mit Fußverkehrsbeteiligung der Jahre 2020-2024.',
  },
  'pankow/sonstiges': {
    order: 3,
    title: 'Sonstige Geodaten',
    subtitle: 'Sonstige statische Geodaten.',
  },
  'radinfra/data': {
    order: 1,
    title: 'Externe Referenzdaten',
    subtitle: 'Statische Referenzdaten zur Datenverbesserung.',
  },
} as const

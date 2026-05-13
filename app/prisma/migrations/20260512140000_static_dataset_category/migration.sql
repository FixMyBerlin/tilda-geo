-- CreateTable
CREATE TABLE "StaticDatasetCategory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" VARCHAR(191) NOT NULL,
    "groupKey" VARCHAR(191) NOT NULL,
    "categoryKey" VARCHAR(191) NOT NULL,
    "sortOrder" DOUBLE PRECISION NOT NULL,
    "title" VARCHAR(40) NOT NULL,
    "subtitle" VARCHAR(100),

    CONSTRAINT "StaticDatasetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaticDatasetCategory_key_key" ON "StaticDatasetCategory"("key");

CREATE UNIQUE INDEX "StaticDatasetCategory_groupKey_categoryKey_key" ON "StaticDatasetCategory"("groupKey", "categoryKey");

CREATE INDEX "StaticDatasetCategory_groupKey_sortOrder_categoryKey_idx" ON "StaticDatasetCategory"("groupKey", "sortOrder", "categoryKey");

-- Seed from legacy staticDatasetCategories.const (single source of truth is now the DB)
INSERT INTO "StaticDatasetCategory" ("createdAt", "updatedAt", "key", "groupKey", "categoryKey", "sortOrder", "title", "subtitle")
SELECT
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    v.key,
    split_part(v.key, '/', 1),
    CASE
        WHEN strpos(v.key, '/') > 0 THEN substring(v.key FROM strpos(v.key, '/') + 1)
        ELSE ''
    END,
    v.sort_order,
    v.title,
    v.subtitle
FROM (
    VALUES
        ('bb/Netzkonzeption', 1::double precision, 'Netzentwicklung Land', 'Statische Daten zur Entwicklung des Radnetzes für Brandenburg'),
        ('bb/Beteiligung', 1.5, 'Beteiligung', 'Aktuelle Beteiligungsbeiträge'),
        ('bb/Bestandsdaten', 2, 'Bestandsdaten', 'Statische Daten zur vorhandenen Radinfrastruktur'),
        ('bb/Radnetze', 3, 'Radnetze und Routen', 'Statische Daten zu vorhandenen Radnetzen, touristischen Routen, Bedarfen und Planungen'),
        ('bb/Landesdaten', 4, 'Weitere Daten', 'Weitere statische Daten'),
        ('bibi/Radverkehr', 1, 'Radverkehr', 'Statische Daten zum Radverkehr'),
        ('bibi/Parkraum', 2, 'Parkraum', 'Statische Daten zum Parkraum'),
        ('nudafa/general', 1, 'Statisch Daten', 'Statische Daten'),
        ('nudafa/website', 2, 'Daten für nudafa.de', 'Statische Daten die auf nudafa.de verwendet werden.'),
        ('radplus/fahrten', 1, 'Rad+ Fahrten', 'Statische Daten der Fahrten von Rad+ Nutzer:innen.'),
        ('radplus/radparken', 2, 'radparken.info', 'Statische Daten der radparken.info Umfragen.'),
        ('parkraum/euvm', 1, 'Parkflächen eUVM-Projekt', 'Statische Daten aus dem Parkflächen eUVM-Projekt.'),
        ('parkraum/osm_euvm', 1, 'Parkflächen OSM aus eUVM', 'Statische Daten aus OpenStreetMap für Testgebiete in denen eUVM Daten übernommen wurden.'),
        ('parkraum/misc', 2, 'Weitere Daten', 'Weitere statische Daten.'),
        ('berlin/netz', 1, 'Netze', 'Statische Geodaten zum Straßennetz und Radinfrastruktur.'),
        ('berlin/misc', 3, 'Weitere Daten', 'Weitere statische Geodaten.'),
        ('berlin/cc', 2, 'Changing Cities Monitoring', 'Statische Geodaten zum Monitoring des Radnetzes von Changing Cities.'),
        ('berlin/infravelo_results', 2, 'infraVelo Prozessierung', 'Statische Ergebnisse der Prozessierung.'),
        ('woldegk/primary', 1, 'Aktuelle Planungen', 'Statische Geodaten zu aktuellen Planungen.'),
        ('woldegk/archive', 2, 'Archivierte Planungen', 'Statische Geodaten zu vergangenen Planungsständen.'),
        ('pankow/analyse', 1, 'Analysen', 'Häufig genutzte Wege und Querungen mit hoher Unfallbelastung oder ohne Tempolimit.'),
        ('pankow/haeufigkeiten', 1, 'Nutzungshäufigkeiten', 'Fußverkehrsfrequenzen für verschiedene Zielgruppen und Zielorte.'),
        ('pankow/grundschulen', 1, 'Grundschulen', 'Standorte öffentlicher Grundschulen und deren Schuleinzugsgebiete.'),
        ('pankow/unfall', 2, 'Unfälle', 'Standorte von Unfällen mit Fußverkehrsbeteiligung der Jahre 2020-2024.'),
        ('pankow/sonstiges', 3, 'Sonstige Geodaten', 'Sonstige statische Geodaten.'),
        ('radinfra/data', 1, 'Externe Referenzdaten', 'Statische Referenzdaten zur Datenverbesserung.'),
        ('ueberlingen/netz', 1, 'Befahrungsnetz', 'Zu befahrende Straßennetz'),
        ('ueberlingen/ergebnisse', 2, 'Befahrungsergebnisse', 'Ergebnisse aus den Befahrungen'),
        ('berlin-baumanalyse/results', 1, 'Analyseergebnisse', 'Ergebnisse der Straßenbaumanalyse'),
        ('berlin-baumanalyse/boundaries', 2, 'Bezugsräume', 'Bezirke, LOR, u.ä.'),
        ('berlin-baumanalyse/misc', 3, 'Weitere Referenzdaten', 'Weitere statische Referenzdatenz')
) AS v(key, sort_order, title, subtitle);

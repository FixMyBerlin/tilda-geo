# How-To: Neue Region erstellen

Anleitung zum Hinzufügen einer neuen Region zur Tilda-Plattform.

## 1. Region in `regions.const.ts` definieren

Datei: [`app/src/data/regions.const.ts`](../app/src/data/regions.const.ts)

Neue Region zum `staticRegion`-Array hinzufügen. Der TypeScript-Typ `StaticRegion` erzwingt alle erforderlichen Attribute.

**Wichtige Attribute:**

- `slug` (vom Typ `RegionSlug`) – Eindeutiger Identifier, wird in URLs verwendet
- `name` – Kurzer Name für UI
- `fullName` – Vollständiger Name
- `product` – Art der Region: `'radverkehr'`, `'parkraum'`, `'fussverkehr'` oder `'analysis'`
- `osmRelationIds` – Array mit OSM-Relation-IDs für Masken und Export-Bounding-Box ([Tool zum Ermitteln](https://hanshack.com/geotools/gimmegeodata/))
- `map` – Initiale Kartenposition mit `lat`, `lng`, `zoom`
- `logoPath` / `externalLogoPath` – Logo der Region (entweder lokaler Import oder externe URL)
- `logoWhiteBackgroundRequired` – `true` wenn Logo weißen Hintergrund benötigt
- `categories` – Array von `MapDataCategoryId` – bestimmt welche Datenkategorien angezeigt werden
- `backgroundSources` – Array von `SourcesRasterIds` – verfügbare Hintergrundkarten
- `notes` – `'osmNotes'`, `'atlasNotes'` oder `'disabled'` – Art der Notizen-Funktion
- `showSearch` – Optional: Suchfunktion aktivieren
- `exports` & `bbox` – Entweder beide `null` (keine Downloads) oder beide gesetzt (Download-Funktion)
- `cacheWarming` – Optional: Cache-Vorwärmung für bessere Performance

**Beispiel:**
```typescript
{
  slug: 'beispiel',
  name: 'Beispiel',
  fullName: 'Beispiel-Region',
  product: 'radverkehr',
  osmRelationIds: [123456],
  map: { lat: 52.5, lng: 13.4, zoom: 12 },
  logoPath: null,
  logoWhiteBackgroundRequired: false,
  categories: ['bikelanes', 'roads', 'mapillary'],
  backgroundSources: defaultBackgroundSources,
  notes: 'osmNotes',
  exports: null,
  bbox: null,
}
```

## 2. `RegionSlug` erweitern

In derselben Datei [`app/src/data/regions.const.ts`](../app/src/data/regions.const.ts):

Den neuen Slug zum TypeScript-Union-Type `RegionSlug` hinzufügen:

```typescript
export type RegionSlug =
  | 'bb-beteiligung'
  | 'berlin'
  // ... weitere Slugs
  | 'beispiel' // <- Neue Region hier hinzufügen
```

## 3. Kategorien für statische Daten erstellen

Datei: [`app/src/app/regionen/[regionSlug]/_mapData/mapDataStaticDatasetCategories/staticDatasetCategories.const.ts`](../app/src/app/regionen/[regionSlug]/_mapData/mapDataStaticDatasetCategories/staticDatasetCategories.const.ts)

Kategorien definieren, in die später statische Daten hochgeladen werden können. Format: `'<region-slug>/<kategorie-name>'`

```typescript
'beispiel/Wegweisung': {
  order: 1,
  title: 'Wegweisung',
  subtitle: 'Infos zu Standorten von Wegweiser',
},
'beispiel/Netze': {
  order: 2,
  title: 'Radnetze',
  subtitle: 'Verlauf der Kreisweiten Radnetzen',
},
```

**Attribute:**
- `order` – Sortierreihenfolge in der UI
- `title` – Angezeigter Titel
- `subtitle` – Beschreibung der Kategorie

## 4. Number-Felder für statische Daten konfigurieren

Datei: [`app/src/app/regionen/[regionSlug]/_components/SidebarInspector/TagsTable/translations/_utils/numberConfig.ts`](../app/src/app/regionen/[regionSlug]/_components/SidebarInspector/TagsTable/translations/_utils/numberConfig.ts)

Wenn statische Daten numerische Felder enthalten, diese hier registrieren für korrekte Formatierung:

```typescript
{ key: 'laenge', suffix: 'm' },
{ key: 'breite', suffix: 'm' },
{ key: 'kapazitaet', suffix: undefined },
```

**Attribute:**
- `key` – Name des Datenfeldes
- `suffix` – Optional: Einheit (z.B. `'m'`, `'km'`, `'km/h'`, `'%'`)

## 5. Region zum Seed-Script hinzufügen (optional)

Datei: [`app/db/seeds/regions.ts`](../app/db/seeds/regions.ts)

Wenn die Region automatisch beim Seeding erstellt werden soll:

```typescript
{
  slug: 'beispiel',
  promoted: true,  // true = erscheint auf /regionen Seite
  status: 'PUBLIC', // 'PUBLIC', 'PRIVATE' oder 'DRAFT'
},
```

## 6. Anwendung starten und Region in Datenbank anlegen

1. **Tilda starten:**
   ```bash
   cd app
   npm run dev
   ```
   Oder deployen.

2. **Admin-Interface öffnen:**
   - URL: `/admin`
   - Dort neue Region in der Datenbank anlegen
   - Bei Bedarf Status auf `PUBLIC` setzen

3. **Region testen:**
   - URL: `/regionen/<region-slug>`
   - Alle Funktionen (Karte, Kategorien, Downloads, etc.) prüfen

## Zusammenfassung

✅ Region in `regions.const.ts` definieren
✅ Slug zu `RegionSlug`-Type hinzufügen
✅ Kategorien in `staticDatasetCategories.const.ts` erstellen
✅ Number-Config in `numberConfig.ts` erweitern (falls nötig)
✅ Optional: Region zu `regions.ts` Seed hinzufügen
✅ App starten und Region im Admin-Interface anlegen

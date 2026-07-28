# TILDA Parkbeschränkungen in Masterportal

Anleitung für Masterportal-Partner: welche Dateien Sie erhalten, wie Masterportal Styles und Layer verknüpft, und wo Darstellungsunterschiede zur Live-Karte auf tilda-geo.de entstehen.

**Kontext:** Region `parkraum-berlin-euvm`, Subkategorien „Öffentliches Straßenparken“ und „Öffentliches Parken abseits des Straßenraums“, jeweils Style „Parkbeschränkungen“ (`default`).

**Styles erzeugen:** `bun scripts/MapLibreToMasterportal/convert.ts` (aus `app/`)  
**Visueller Abgleich (Tiles):** `bun scripts/MapLibreToMasterportal/preview/serve.ts`

---

## 1. Masterportal-Grundlagen

Laut [Masterportal-Dokumentation zu `style.json`](https://www.masterportal.org/mkdocs/doc/v3.2.0/User/Global-Config/style.json/):

| Konfiguration     | Rolle                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| **`config.js`**   | Verweist auf **eine** globale Style-Datei (`styleConf`, z. B. `resources/style.json`) |
| **`style.json`**  | **Ein** JSON-Array aller Style-Objekte — jedes Objekt hat `styleId` und `rules`       |
| **`config.json`** | Jeder Kartenlayer bekommt **einen** `styleId`, der auf einen Eintrag im Array zeigt   |

**Wichtig:** Es gibt **keinen** separaten Style-Import pro Layer. Sie laden **eine** `style.json` ins Portal und verknüpfen mehrere Layer damit — jeder Layer nutzt seinen eigenen `styleId`.

```text
config.js
  styleConf → resources/style.json   (eine Datei für alle Styles)

style.json
  [
    { "styleId": "parking_public_on_street",   "rules": [ … ] },
    { "styleId": "parking_public_off_street",  "rules": [ … ] },
    { "styleId": "parking_public_no_parking", "rules": [ … ] }
  ]

config.json — drei Layer, drei styleIds, alle aus derselben style.json
  Layer A: styleId = parking_public_on_street
  Layer B: styleId = parking_public_off_street
  Layer C: styleId = parking_public_no_parking
```

Die vom Konverter erzeugten Einzeldateien pro `styleId` (nur mit `--split-styles`) sind **kein** Masterportal-Standard — sie dienen höchstens der manuellen Zusammenführung. Standardausgabe ist immer **gebündelt**.

---

## 2. Welches Profil wofür?

Der Konverter schreibt **zwei** Style-Bundles. Welches Sie nutzen, hängt von der **Datenquelle** ab:

| Profil               | Style-Datei                       | Datenquelle                           | Wann verwenden?                                                     |
| -------------------- | --------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| **GPKG (empfohlen)** | `parking_public.gpkg.styles.json` | `parking_public.gpkg` aus EUVM-Export | Masterportal mit GeoPackage / WFS / GeoJSON aus dem Parkraum-Export |
| **Tiles**            | `parkbeschraenkungen.json`        | tilda-geo-Vektorkacheln               | Nur für Abgleich mit der Live-Karte / interne Preview               |

**Für Masterportal mit EUVM-Daten → `parking_public.gpkg.styles.json`.**

Die zugehörigen Legenden-Artefakte:

| Profil | Legende                           |
| ------ | --------------------------------- |
| GPKG   | `parking_public.gpkg.legend.json` |
| Tiles  | `parkbeschraenkungen-legend.json` |

---

## 3. Datenquelle: `parking_public.gpkg`

Die Geodaten stammen aus dem Geschwister-Repo `scripts/tilda-parkraum-euvm-export` (neben `tilda-geo`). Das Skript `process.py` erzeugt **eine** Datei `output/parking_public.gpkg` mit **drei Layern**:

| GPKG-Layer                  | Geometrie       | Inhalt                                                                    |
| --------------------------- | --------------- | ------------------------------------------------------------------------- |
| `parking_public_on_street`  | LineString      | Öffentliches Straßenparken (gefiltert: nicht `operator_type = private`)   |
| `parking_public_off_street` | Polygon         | Öffentliche Parkflächen abseits des Straßenraums                          |
| `parking_public_no_parking` | MultiLineString | Halt- und Parkverbote (`parkings_no`, Werte `no_parking` / `no_stopping`) |

**Nicht in der GPKG** (und daher nicht im GPKG-Style-Bundle):

- Kapazitäts-Labels (Punkt/Text)
- Garagen-/Parkhaus-Punkte
- Schattenflächen separat erfasster Parkplätze (`parkings_separate`)
- Diagonale/senkrechte Parkplatzmuster (MapLibre-Sprites)

Diese Elemente existieren nur im Tile-Profil `parkbeschraenkungen.json` (7 Styles für die tilda-geo-Vektorkacheln).

**Filter `operator_type`:** Im GPKG-Export ist public/private bereits gefiltert. Die Style-Regeln im GPKG-Profil enthalten deshalb **keinen** `operator_type`-Filter. Im Tile-Profil setzen Regeln weiterhin `operator_type: "public"` voraus.

---

## 4. Einrichtung in Masterportal (GPKG-Profil)

### Schritt 1 — Styles erzeugen oder bereitstellen lassen

```bash
# aus tilda-geo/app/
bun scripts/MapLibreToMasterportal/convert.ts
```

Ausgabe (gitignored, nach Konvertierung lokal vorhanden):

```text
output/masterportal/
  parking_public.gpkg.styles.json    ← in Masterportal als style.json einbinden
  parking_public.gpkg.legend.json    ← optional, nur Legenden-Styles
output/tilda/
  gpkg-manifest.json                 ← Layer-Metadaten
  masterportal-layer-snippet.json    ← Beispiel styleId-Zuordnung
```

### Schritt 2 — `style.json` ins Portal legen

Inhalt von `parking_public.gpkg.styles.json` nach `resources/style.json` (oder einen anderen Pfad Ihrer Wahl) kopieren. Die Datei ist bereits ein gültiges Masterportal-Array mit drei Einträgen.

Die `styleId`-Namen **entsprechen exakt** den GPKG-Layer-Namen:

| GPKG-Layer                  | styleId                     |
| --------------------------- | --------------------------- |
| `parking_public_on_street`  | `parking_public_on_street`  |
| `parking_public_off_street` | `parking_public_off_street` |
| `parking_public_no_parking` | `parking_public_no_parking` |

### Schritt 3 — `config.js` anpassen

```javascript
const Config = {
  // …
  styleConf: 'resources/style.json',
  // …
}
```

### Schritt 4 — Geodaten-Layer in `config.json` anlegen

Pro GPKG-Layer **ein** Eintrag in `config.json` (WFS, GeoJSON, Upload o. Ä. — abhängig von Ihrem Setup). Jeder Layer verweist auf **seinen** `styleId`:

```json
{
  "id": "parking_public_on_street",
  "styleId": "parking_public_on_street",
  "name": "Öffentliches Straßenparken",
  "typ": "WFS",
  "url": "…",
  "featureType": "parking_public_on_street"
}
```

Vollständiges Beispiel der `styleId`-Zuordnung: `output/tilda/masterportal-layer-snippet.json`.

Layer-Metadaten (Geometrietyp, Mapbox-Quelldateien, Hinweise): `output/tilda/gpkg-manifest.json`.

### Schritt 5 — Legende (optional)

Symbologie-Regeln mit `legendValue` sind in den Style-Regeln für Straßenraum-Linien und Abseits-Flächen eingebettet. `parking_public.gpkg.legend.json` enthält nur diese beiden Kernstyles — falls Sie die Legende separat pflegen möchten.

---

## 5. Style-Inhalt pro GPKG-Layer

| styleId                     | Mapbox-Quelle (tilda-geo)                                | Beschreibung                                                                                 |
| --------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `parking_public_on_street`  | `park_street_default` + `park_street_pattern` (parallel) | Linienfarben nach `condition_category`; paralleles Strichelmuster für `orientation=parallel` |
| `parking_public_off_street` | `park_off_default_area`                                  | Polygonfüllung und -umriss nach `condition_category`                                         |
| `parking_public_no_parking` | `park_street_no`                                         | Orange gestrichelt (`no_parking`), rot gestrichelt (`no_stopping`)                           |

Die Farbzuordnung für `condition_category` folgt der MapLibre-Prioritätsreihenfolge (`index-of` auf semikolongetrennte Werte → Masterportal-Regel mit `condition: "contains"`).

---

## 6. Tile-Profil (nur Referenz / Preview)

Für den Abgleich mit der Live-Karte auf tilda-geo.de erzeugt der Konverter zusätzlich `parkbeschraenkungen.json` mit **7** Styles:

| styleId                                               | Quelle (Mapbox-Gruppe)           | Geometrie  | Beschreibung                                 |
| ----------------------------------------------------- | -------------------------------- | ---------- | -------------------------------------------- |
| `tilda_parkings_parkbeschraenkungen_line`             | `park_street_default`            | Linie      | Farben nach `condition_category`             |
| `tilda_parkings_parkbeschraenkungen_pattern_parallel` | `park_street_pattern` (parallel) | Linie      | Hellgraue Strichelung                        |
| `tilda_parkings_separate_shadow`                      | `park_street_areas_shadow`       | Polygon    | Schattenflächen separat erfasster Parkplätze |
| `tilda_parkings_labels`                               | `park_street_label`              | Punkt/Text | Kapazitätszahl                               |
| `tilda_off_street_parkbeschraenkungen_area`           | `park_off_default_area`          | Polygon    | Füllung + Umriss                             |
| `tilda_off_street_points`                             | `park_off_default_points`        | Punkt      | Garagen-/Parkhaus-Eingänge                   |
| `tilda_off_street_labels`                             | `park_off_labels`                | Punkt/Text | Kapazitätszahl                               |

Die OpenLayers-Preview (`preview/serve.ts`) nutzt dieses Tile-Bundle — **nicht** die GPKG-Styles.

---

## 7. Bekannte Einschränkungen

### Allgemein

1. **Nur Style-Artefakte** — Der Konverter liefert `style.json`-Inhalte. `config.js`, `config.json`, Dienste-Anbindung (WFS-URL, Credentials) und Layer-Reihenfolge müssen im Portal separat konfiguriert werden.

2. **Preview ≠ Masterportal** — Die Testseite unter `preview/` implementiert nur einen Teil des Masterportal-Style-Schemas. Abweichungen zur echten Masterportal-Darstellung sind möglich.

3. **Zoom 17 eingefroren** — Linienbreiten, Umrissbreiten und Textgrößen werden für Zoom 17 berechnet (Referenzposition Berlin). Andere Zoomstufen können von tilda-geo abweichen.

### Straßenraum

4. **Nur Features mit `capacity`** — Die Hauptlinien (`park_street_default`) filtern in MapLibre auf `['has', 'capacity']`. Features ohne Kapazität werden nicht gezeichnet.

5. **Diagonale/senkrechte Muster fehlen** — MapLibre nutzt `line-pattern`-Sprites. Masterportal unterstützt das nicht; nur das parallele Strichelmuster ist als `lineStrokeDash` übernommen.

6. **`staggered` / `informal` Opazität** — Zusätzliche Regeln mit 50 % Opazität; Kombination mehrerer Bedingungen kann von MapLibre abweichen.

7. **Textrotation** — Kapazitätslabels (nur Tile-Profil) werden in MapLibre entlang der Parkplatzachse gedreht; Masterportal zeigt Text ohne Rotation.

### Abseits / Schatten

8. **Punktradius fest** — Garagen-Punkte (Tile-Profil): Konverter setzt `circleRadius: 6` als Standard.

9. **Schattenflächen statisch** — Keine attributbasierte Logik; feste Farben und gestrichelter Umriss.

### Daten / Tiles (nur Tile-Profil)

10. **Composite-Tile-URLs** — Mehrere Source-Layer in einer URL; nicht jeder Client verarbeitet das identisch.

11. **Maxzoom 17** — Volle geometrische Genauigkeit endet bei Zoom 17.

### Legende

12. **`legendValue` nur auf Kernstyles** — Legendentexte für Straßenraum-Linien und Abseits-Flächen (Parkbeschränkungen), nicht für Muster, Schatten, Punkte oder Kapazitätslabels.

13. **1:1 mit Topic-Docs** — Jeder `condition_category`-Token aus der Mapbox-Farbkaskade erhält einen eigenen `legendValue`. Die tilda-geo-App gruppiert manche Kategorien in der Sidebar anders.

14. **`no_standing` Warnung** — Token in Topic-Docs, aber keine Farbe in `park_street_default.ts`. Warnung in `conversion-meta.json`.

15. **Preview-Legende dedupliziert** — Opazitäts-Varianten erzeugen mehrere Regeln mit gleichem `legendValue`; die Preview zeigt jeden Text nur einmal.

---

## 8. Bewusst nicht konvertierte Mapbox-Layer

| Layer                                 | Grund                                                  |
| ------------------------------------- | ------------------------------------------------------ |
| `park_street_pattern` → diagonal      | `line-pattern` Sprite, nicht in Masterportal abbildbar |
| `park_street_pattern` → perpendicular | `line-pattern` Sprite, nicht in Masterportal abbildbar |

---

## 9. Referenz-URL (tilda-geo Live-Karte)

https://tilda-geo.de/regionen/parkraum-berlin-euvm?map=17/52.5445/13.4438&config=1qldklk.4ptan9.20&v=2

---

## 10. Dateien in diesem Ordner

| Pfad                              | Zweck                                                 |
| --------------------------------- | ----------------------------------------------------- |
| `convert.ts`                      | Konverter-Skript                                      |
| `profiles/parking_public_gpkg.ts` | GPKG-Profil (3 Layer)                                 |
| `profiles/parkbeschraenkungen.ts` | Tile-Profil (7 Styles)                                |
| `lib/`                            | Parsing und Konvertierungslogik                       |
| `output/masterportal/`            | Style- und Legenden-JSON zum Weitergeben              |
| `output/tilda/`                   | Manifeste, Layer-Snippets, Konvertierungs-Metadaten   |
| `preview/`                        | OpenLayers-Testseite (Tile-Profil)                    |
| `README.md`                       | Kurzreferenz für Entwickler (Skript-Aufruf, Optionen) |
| `MASTERPORTAL.md`                 | Anleitung für Masterportal-Partner (Deutsch)          |

# Anfrage: Statischer Datensatz

Diese Datei ist **für Kolleg:innen** gedacht — nicht für KI-Agenten. Die technische Umsetzung beschreibt [SKILL.md](./SKILL.md).

> [!NOTE]
> „Statische Datensätze“ sind GeoJSON-Daten, die in TILDA als wählbare Kartenebenen erscheinen (Sidebar → Datensätze). Pro Datensatz gibt es Metadaten (Name, Lizenz, Kategorie, …) und einen oder mehrere **Stile** mit **Layern** für die Darstellung auf der Karte.

## So nutzt du die Vorlage

1. Erstelle ein GitHub-Issue (oder einen Ticket-Text) für **neue** oder **geänderte** statische Datensätze.
2. Kopiere den Block unten (**ein Block = ein Datensatz**) in die Issue-Beschreibung.
3. Fülle alle Abschnitte aus. Lieber zu viel Kontext als zu wenig.

```md
# Datensatz 1

## Regionen

- [ ] TODO LISTE AN URLs

## Kategorie

- [ ] Lege die Kategorie an oder aktualisiere sie:

Immer auf Staging _und_ Production:

- Production: https://tilda-geo.de/admin/static-dataset-categories
- Staging: https://staging.tilda-geo.de/admin/static-dataset-categories

Hinweis: Änderungen sind sofort live; Änderungen an Gruppe und Teilschlüssel können bestehende Daten falsch kategorisieren.

Unten muss die `category` angegeben werden, die im Interface angezeigt wird:

> Vollständiger Schlüssel für Uploads: `berlin/netz`

## Datendatei

- [ ] (Bei bestehenden Daten) Ordner der Daten auf Github:
  - TODO z.B. https://github.com/FixMyBerlin/tilda-static-data/tree/main/geojson/region-berlin/berlin-bezirke

- [ ] Regionen, mit dene die Daten verknüpft sein sollen (URLs):
  - TODO z.B. https://tilda-geo.de/regionen/radinfra

- [ ] Neue GeoJSON-Datei (Deeplink Google Drive):
  - TODO

  - REMINDER: Koordinatensystem: **EPSG:4326 (WGS84)**
  - REMINDER: Koordinaten-Genauigkeit: Maximal 8 Nachkommastellen

- [ ] Angaben pro Datensatz:

| Feld                                         | Pflicht   | Angabe                                  |
| -------------------------------------------- | --------- | --------------------------------------- |
| **Anzeigename** (`name`)                     | ja        | <!-- wie in der Sidebar -->             |
| **Kategorie-Schlüssel** (`category`)         | empfohlen | <!-- siehe Abschnitt Kategorie -->      |
| **Attribution** (`attributionHtml`)          | ja        | <!-- Quelle / Urheber -->               |
| **Lizenz** (`licence`)                       | empfohlen | <!-- siehe Lizenz-Tabelle -->           |
| **OSM-kompatibel?** (`licenceOsmCompatible`) | optional  | [ ] `licence` [ ] `waiver` [ ] `no`     |
| **Beschreibung** (`description`)             | optional  | <!-- Kurztext für Nutzer:innen -->      |
| **Datenherkunft** (`dataSourceMarkdown`)     | optional  | <!-- Link oder Erklärung (Markdown) --> |
| **Stand / Aktualität** (`updatedAt`)         | optional  | <!-- z. B. `2026-06-01` -->             |
| **Sichtbarkeit** (`public`)                  | ja        | [ ] öffentlich [ ] eingeschränkt        |
| **Download-Link verbergen**                  | optional  | [ ] ja (nur Admins)                     |

<details>
<summary>Lizenz — gültige Werte…</summary>

| Wert                                    | Bedeutung                      |
| --------------------------------------- | ------------------------------ |
| `DL-DE/ZERO-2.0`                        | Datenlizenz Deutschland — Zero |
| `DL-DE/BY-2.0`                          | Datenlizenz Deutschland — BY   |
| `CC Zero`                               | Creative Commons Zero          |
| `CC BY 2.0` / `CC BY 3.0` / `CC BY 4.0` | CC Namensnennung               |
| `CC BY-SA 4.0`                          | CC BY-SA                       |
| `CC BY-NC-SA 4.0`                       | CC BY-NC-SA                    |
| `ODbL`                                  | Open Database License          |
| `Alle Rechte vorbehalten`               | Proprietär                     |

</details>

## Stile & Layer

Ein Datensatz kann **mehrere Stile** haben; ein Stil besteht aus **einem oder mehreren Layern** (z. B. Füllung + Umriss).

- [ ] Beschreibung oder JSON des Stils einfügen:

_BESCHREIBUNG:_

> TODO

_JSON:_ (Von Mapbox Studio Kopiert pro Layer)
```

TODO

```

- [ ] Angaben zur Legende - Name und Farbe (Farbe kann in Textform sein)
  - TODO z.B. "Blau – Radinfrastktur"

```

# topic-docs-coverage-check

Manueller Abgleich zwischen:

- **Übersetzungs-Const vs. topic-docs (YAML, generiert)** — statisch, ohne DB
- in der DB vorkommenden `(key, value)` Paaren in `tags`
- dokumentierten Attributen/Werten aus `topic-docs`
- Inspector-Übersetzungen (generiert)

## Translation const vs. topic-docs YAML

Nach `bun run topic-docs-build` vergleicht das Skript die topic-docs-relevanten manuellen Module in derselben Reihenfolge wie in `translations.const.ts` vor dem generierten JSON: `translationsOneway`, `translationsSeparationTrafficModeMarking`, `translationsWdith`. TILDA-Parkraum steckt nur noch in `translations.gen.json`. Nicht einbezogen: `translationsParkingLars` (externes Dataset), generiertes JSON, und `translationsAtlasAndAll` (Atlas + breite `ALL--`-Fallbacks — nicht an Parkraum-YAML gebunden). `ALL--`-Einträge ohne passende Keys in den topic-docs-`sourceId`s werden ignoriert.

- `app/src/data/generated/topicDocs/inspector/translations.gen.json`
- plus synthetische `${sourceId}--title` aus dem kompilierten `title` je Tabelle

Es werden nur Keys berücksichtigt, deren Präfix ein `sourceId` aus den topic-docs-Tabellen ist, oder die mit `ALL--` beginnen (`ALL--` wird gegen alle topic-docs-`sourceId`s aufgelöst).

| Kategorie               | Bedeutung                                                          | Standard: Check schlägt fehl?                         |
| ----------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| **mismatch**            | gleicher Key in Const und YAML-Ausgabe, aber anderer String        | ja                                                    |
| **orphansInManual**     | Key in Const (im Scope), kommt in der YAML-Ausgabe nicht vor       | ja                                                    |
| **inconsistentAllKeys** | `ALL--…` trifft auf mehrere YAML-Keys mit unterschiedlichen Labels | ja                                                    |
| **yamlOnlyKeys**        | Key nur in generierter YAML-Ausgabe, nicht in den Const-Modulen    | nein (Info; Ziel ist Duplikate in Const zu entfernen) |

Schlägt diese Phase fehl, endet das Skript mit Exitcode 1 **bevor** eine Datenbankverbindung aufgebaut wird.

## Topic-docs ↔ DB (`tags`): symmetrischer Abgleich

Für jede Tabelle mit topic-docs-Eintrag in `byTableName/index.gen.json` werden eindeutige `(key, value)`-Paare aus `public.<table>.tags` (`jsonb_each_text`) mit den kompilierten Attributen und (falls vorhanden) aufgezählten Werten aus dem YAML verglichen. Dieselben Ausnahmen wie im Code gelten für beide Richtungen (z. B. `condition_category`, Typen ohne explizite Wertliste).

**In der DB, nicht in den Docs**

- `extraDbKeysNotInDocs`: Tag-Keys, die in der DB vorkommen, aber nicht als Attribut im YAML stehen.
- `missingDocValues`: `key=value`-Paare aus der DB, deren Wert für dieses dokumentierte Attribut nicht in der aufgezählten Wertemenge liegt.

**In den Docs, nicht in der DB**

- `missingDocKeys`: dokumentierte Attribute, die in keiner Zeile als Tag-Key vorkommen.
- `documentedValuesNotInDb`: `key=value` für aufgezählte YAML-Werte, die in der DB nie vorkommen, **wenn** der Key mindestens einmal in Tags vorkommt (sonst reicht `missingDocKeys`; keine Auflistung aller Enum-Werte bei fehlendem Key).

`documentedValuesNotInDb` ist **informativ** und löst **keinen** fehlgeschlagenen Exitcode aus (seltene OSM-Werte, vorgehaltene Enums).

## Nutzung

Aus `app/`:

```sh
bun run topic-docs-build
bun run topic-docs-coverage-check -- --table parkings
```

Mehrere Tabellen:

```sh
bun run topic-docs-coverage-check -- --table parkings,parkings_cutouts
```

JSON-Report schreiben (liegt absichtlich **nicht** in Git — aus deiner DB, wechselt ständig):

```sh
bun run topic-docs-coverage-check -- --table parkings --out-json ./scripts/topic-docs-coverage-check/output/latest.json
```

Pro-Tabelle-Markdown (zwei Abschnitte: DB↔Docs wie oben; Dateiname `<tableName>.md`):

```sh
bun run topic-docs-coverage-check -- --report-dir ./scripts/topic-docs-coverage-check/output/reports
```

Struktur: `translationConstVsYaml` (Objekt mit `mismatches`, `orphansInManual`, `inconsistentAllKeys`, `yamlOnlyKeys`) und `dbCoverage` (Array pro `tableName` mit u. a. `extraDbKeysNotInDocs`, `missingDocKeys`, `documentedValuesNotInDb`, `missingDocValues`, `typeMismatches`, `missingInspectorKeys`, `missingInspectorValues`). Wenn die Translation-Phase fehlschlägt, ist `dbCoverage` `null` und es wird nur `translationConstVsYaml` geschrieben; `--report-dir` wird in diesem Fall nicht ausgeführt.

Der Ordner `scripts/topic-docs-coverage-check/output/` ist per `.gitignore` ausgeschlossen.

Datenbank: wie die App — `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` in der Repo-Root-`.env` (siehe `.env.example`). Alternativ mit SSH-Tunnel `--source staging` oder `--source production` (`DATABASE_URL_STAGING` / `DATABASE_URL_PRODUCTION`) oder `--database-url`.

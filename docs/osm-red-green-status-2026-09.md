# Red/Green-Pipeline: Wo stehen wir? (Stand 8. September 2026)

Dieses Dokument fasst für Menschen zusammen, was wir mit der Red/Green-Pipeline
vorhaben, was bisher passiert ist, wie der Stand heute ist und was noch fehlt,
bevor wir das auf Produktion einschalten können. Die technische Referenz ist
[`osm-red-green-pipeline.md`](osm-red-green-pipeline.md); der Code liegt in
[`processing/redGreen/`](../processing/redGreen/).

## Kurzfassung

**Der Code ist auf dem aktuellen `develop`, kompiliert, und die heute gefundenen
Bugs sind behoben. Deploy-bereit ist die Pipeline trotzdem nicht.** Sie ist noch
nie vollständig durchgelaufen — der einzige Testlauf (Juni, Brandenburg, nur
Parken) endete mitten im Staging-Build. Die eigentliche Neuerung, das Umschalten
der Live-Tabellen, wurde nie ausgeführt.

Empfehlung in einem Satz: **Merge nach `develop` ist vertretbar, sobald der
Staging-Server eine zweite Datenbank hat — Produktion bleibt bis zu einem
erfolgreichen mehrtägigen Staging-Betrieb auf dem bewährten Nachtlauf.** Der
Branch ist heute so verdrahtet, dass genau das passiert: Staging läuft Red/Green
alle drei Stunden, Produktion weiter wie bisher.

## Was wir vorhaben

Heute wird der Deutschland-Datensatz einmal pro Nacht direkt in der Live-Datenbank
neu gebaut. Während der Verarbeitung sind die Kacheln und Downloads stundenlang
in einem Zwischenzustand, und häufigere Updates sind so nicht möglich.

Die Red/Green-Pipeline soll das ändern:

1. **Alle drei Stunden** wird das OSM-Deutschland-Extrakt aktualisiert (nächtliche
   Basis von Geofabrik, tagsüber stündliche Änderungen von OSM eingespielt und
   wieder auf Deutschland zugeschnitten).
2. Der komplette Datensatz wird **in einer separaten Staging-Datenbank** neu
   gebaut. Die Live-Datenbank wird dabei nicht angefasst.
3. Vor dem Umschalten wird geprüft, ob das Ergebnis **vollständig** ist (jede
   Tabelle hat Zeilen, die Zeilenzahlen liegen nahe an den heutigen).
4. Die Geo-Tabellen werden per Postgres-FDW in die Live-Datenbank kopiert und in
   **einer Transaktion** umgeschaltet. Die alten Tabellen bleiben als `geo_prev`
   für einen Rollback liegen.
5. Nutzerdaten (Schema `prisma`) und Referenzdaten (Schema `data`) bleiben
   unberührt.

Das ist "Blue/Green" für Geodaten: grün nebenbei bauen, erst nach Prüfung
umschalten, blau zum Zurückrollen behalten.

## Was bisher passiert ist

**Juni 2026 (Analyse und Design).** In mehreren Sitzungen wurde der ursprüngliche
Branch analysiert, Optionen für die Replikation verglichen und "Option B"
gewählt: Geofabrik-Basis nachts, planet-hourly-Diffs tagsüber, `osmium`-Recut,
voller Staging-Build, FDW-Promotion. Verworfen wurden osm2pgsql-Append (passt
nicht zum Vollrebuild-Modell), alle-3h-Download von Geofabrik (Bandbreite, trotzdem
nur tagesaktuell) und Minute-Diffs ohne regelmäßiges Reseed (Datei bläht auf).
Ein Smoke-Test mit Brandenburg lief bis in den Staging-Build; Lock, Health-Check,
`pyosmium` und Recut funktionierten. Die Promotion wurde nicht erreicht.

**30. Juni (Implementierung).** Die Pipeline wurde in drei Commits fertiggestellt:
Orchestrator, Reseed, Catch-up, Validierung, FDW-Promotion, Rollback, Verifier,
Lock; CI-Verdrahtung; ausführliche Doku. Danach lag der Branch zweieinhalb Monate,
während `develop` sich um knapp 400 Commits weiterbewegte.

**8. September (heute).**

- Rebase auf `develop`. Backup: `backup/blue-green-clean-pre-rebase-20260908-0945`.
  Konflikte in Dockerfile, `index.ts` und zwei Workflows manuell aufgelöst.
  `develop` hatte inzwischen den Martin-Neustart entfernt und die Signaturen der
  Processing-Schritte geändert; beides wurde für den Red/Green-Pfad nachgezogen.
- Drei parallele Prüfungen: alle Chat-Transkripte seit Juni, die Branch-Historie
  und ein statischer Code-Review gegen den heutigen `develop`.
- Die gefundenen Bugs wurden behoben (siehe nächster Abschnitt) und die
  Rollout-Verdrahtung auf "Staging zuerst" gestellt.

## Was heute repariert wurde

Alle Punkte sind lokal, ohne Designentscheidung, und im Commit vom 8. September
enthalten.

| Problem                                                                                                                                                                                                                                                                             | Folge ohne Fix                                                         | Fix                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rollback konnte Live-Tabellen löschen.** Die Liste der "promoteten" Tabellen wurde vor dem Umschalten gesetzt. Scheiterte die FDW-Kopie, lief der Rollback trotzdem und hätte `public.*` gelöscht — beim ersten Lauf ohne `geo_prev` unwiederbringlich.                           | Datenverlust auf Produktion                                            | Rollback nur noch nach erfolgreich committeter Swap-Transaktion.                                                                                                                    |
| **`$.env()` ersetzte die Shell-Umgebung global.** Bun's `$.env()` verändert das globale `$`-Objekt und ersetzt die komplette Umgebung (kein `PATH` mehr).                                                                                                                           | Alle Shell-Kommandos nach der Validierung liefen mit kaputter Umgebung | Umgebung pro Kommando, gemerged mit `process.env`.                                                                                                                                  |
| **`spatial_ref_sys`, `meta`, `todos_lines_campaign_stats` wären mit-geswappt worden.** `spatial_ref_sys` ist der PostGIS-Katalog; `meta` ist die Lauf-Historie (Staging hat eine Zeile, Produktion hunderte → Toleranzprüfung schlägt fehl, Promotion hätte die Historie gelöscht). | PostGIS kaputt bzw. Validierung scheitert immer                        | Skip-Liste; diese Tabellen werden nie promotet.                                                                                                                                     |
| **Afterthoughts liefen im Staging-Build nicht.** `aggregated_lengths` und Kampagnen-Statistiken wurden nicht berechnet; die leere Tabelle hätte die Validierung scheitern lassen.                                                                                                   | Validierung scheitert immer; Statistiken veralten                      | Staging-Build ruft `runAfterthoughts` auf.                                                                                                                                          |
| **Falscher Pfad für den OSM-Zeitstempel.** Der Staging-Build übergab den Recut-Dateinamen, der unter `/data/downloads` gesucht wird, dort aber nie liegt.                                                                                                                           | Lauf stirbt nach dem kompletten Build                                  | Arbeits-PBF als Quelle; Guard auf das Download-Verzeichnis.                                                                                                                         |
| **Verifier-Probes überlappten** (`setInterval` ohne `await`).                                                                                                                                                                                                                       | Fälschlich ausgelöster Rollback möglich                                | Sequenzielle Schleife.                                                                                                                                                              |
| `SKIP_TILES_RESTART` wurde nie gelesen.                                                                                                                                                                                                                                             | —                                                                      | Wird beachtet.                                                                                                                                                                      |
| `warm-cache-delta`-Route: Typfehler, fehlender Eintrag im Route-Tree, kein Idle-Timeout.                                                                                                                                                                                            | CI rot                                                                 | Behoben, Route-Tree regeneriert.                                                                                                                                                    |
| Formatierung (Tabs, doppelte Anführungszeichen).                                                                                                                                                                                                                                    | CI-Format-Check rot                                                    | Mit Repo-Formatter formatiert.                                                                                                                                                      |
| **Produktion war auf `PIPELINE: red-green` alle 3h.** Ein Merge hätte Produktion sofort umgestellt — ohne Staging-DB wäre jeder Lauf gescheitert und die Datenaktualisierung gestoppt.                                                                                              | Produktion aktualisiert nicht mehr                                     | Produktion bleibt auf dem Nachtlauf; nur Staging läuft Red/Green. Deploy startet den Processing-Container weiterhin, außer auf Red/Green-Umgebungen (`START_PROCESSING_ON_DEPLOY`). |

## Was noch nicht gelöst ist

Diese Punkte brauchen Entscheidungen, Infrastruktur oder echte Testläufe. Sie
sind der Grund, warum Produktion noch nicht umgestellt werden darf.

### 1. Es gibt keine Staging-Datenbank

`PROCESSING_STAGING_DATABASE_URL` wird durchgereicht und im Deploy-Manifest
deklariert, aber nichts im Repo legt die Datenbank an. Vor dem ersten Lauf muss
auf dem Staging-Server (später Produktion) einmalig eine Datenbank `staging` auf
dem bestehenden `db`-Container angelegt werden; die Extensions legt
`initialize()` an. Außerdem braucht die Promotion `postgres_fdw` auf der
Live-Datenbank (Superuser-Recht) und die Live-DB muss den Staging-Host erreichen.
Aufwand: klein, aber manuell.

### 2. Die Staging-DB hat die Referenzdaten aus `data.*` nicht

Seit Juli hängt das Processing an Tabellen im Schema `data` (`euvm_cutouts_*`,
`euvm_qa_voronoi_2026`, `mapillary_coverage_metadata`), die per `data-schema`
in die Live-Datenbank importiert werden. In einer frischen Staging-DB fehlen sie.
Die SQL-Skripte legen dann **leere Platzhalter** an — der Build "gelingt", aber
Parkplatz-Cutouts und QA-Ergebnisse sind leer. Die Validierung würde das
vermutlich als Null-Zeilen-Tabelle abfangen, aber dann kann die Pipeline nie
durchlaufen.

Nötig: `data.*` muss in die Staging-DB (einmalig plus bei jeder Änderung), oder
die Promotion muss anders herum denken (Referenzdaten aus Primary in Staging
spiegeln). Das ist eine Designentscheidung.

### 3. Spaltenänderungen brechen die Promotion dauerhaft

Die Kopie in `geo_shadow` wird mit `CREATE TABLE … (LIKE public.x INCLUDING ALL)`
aus der **alten** Live-Tabelle angelegt und dann mit `INSERT … SELECT *` aus
Staging gefüllt. Sobald ein Topic eine Spalte hinzufügt oder entfernt, schlägt der
Insert fehl — und zwar bei jedem Lauf, weil Produktion die neue Struktur nie
bekommt. Da Lua-Topics regelmäßig Spalten ändern, ist das im Alltag ein
Dauerproblem. Die Doku nennt bereits die Alternative (`pg_dump | pg_restore` des
Staging-Schemas ins Shadow-Schema, Indizes mitnehmen). Das muss vor dem
Produktionsbetrieb umgebaut werden.

### 4. `meta` kommt nicht auf Produktion an

Da `meta` jetzt nicht mehr geswappt wird (siehe Fixes), sieht die App nach einer
Promotion weiterhin den Zeitstempel des letzten Nachtlaufs. "Daten vom …" im
Admin-Bereich und in den Exporten stimmt dann nicht. Nötig: nach dem Swap die
`meta`-Zeile (und die Kampagnen-Statistik) des Staging-Laufs in Primary
**anhängen** statt zu ersetzen. Kleiner, klar umrissener Schritt.

### 5. Kein Tag-Filter im Staging-Build

Der Nachtlauf filtert das PBF vorher mit `osmium tags-filter` auf die Tags, die
die Topics brauchen. Der Staging-Build überspringt das und gibt das komplette
Recut an `osm2pgsql`. Das ist korrekt, aber langsamer — wie viel, weiß erst ein
Deutschland-Lauf. Die `*_diff`-Tabellen werden nie promotet und veralten. Beides
ist akzeptabel für einen ersten Betrieb, sollte aber gemessen werden.

### 6. Die FDW-Vollkopie könnte das 3-Stunden-Budget sprengen

Jede Promotion kopiert **alle** Geo-Tabellen vollständig durch `postgres_fdw`
und baut die Indizes neu. Bei Deutschland-Größe kann das die Laufzeit
dominieren. Ohne Messung ist die 3h-Kadenz eine Annahme.

### 7. Nichts davon ist je end-to-end gelaufen

Getestet ist bis heute: Lock, Health-Gate, `pyosmium`, `osmium extract`, Beginn
des Staging-Builds (Brandenburg, ein Topic). **Nicht** getestet: vollständiger
Build, Validierung, Promotion, Rollback, Tile-Neustart, Cache-Warming, ein
Deutschland-Lauf, Laufzeit, Plattenbedarf, Verhalten bei Abbruch. Der Plan vom
Juni (Level 1–6: Komponententest → kleines Gebiet mit Rollback-Übung →
Deutschland auf Staging → 72h-Soak → Fehlerinjektion → Produktions-Canary) ist
weiterhin komplett offen.

### 8. Kleinere offene Fragen

- **Martin-Neustart:** `develop` hat den automatischen Neustart entfernt. Wir
  starten nach der Promotion trotzdem neu, weil sich die Tabellen-OIDs ändern.
  Ob Martin 1.15 das auch ohne Neustart merkt, ist offen; der Neustart ist die
  konservative Wahl und schlägt nur mit Warnung fehl.
- **`docker compose run` bei gesetztem `container_name`:** Auf dem Server existiert
  noch der alte `processing`-Container. Ob `compose run` damit kollidiert, zeigt
  der erste Staging-Lauf; ggf. einmal `docker rm processing`.
- **Plattenplatz:** 100+ GB frei pro Host für Arbeits-PBF, Recut, Staging-DB und
  Temp-Dateien. Im Juni war der Staging-Server fast voll.
- **Secrets/Vars** in den GitHub-Environments: `PROCESSING_STAGING_DATABASE_URL`,
  `PROMOTION_PRIMARY_DATABASE_URL`, `RED_GREEN_VERIFY_ENDPOINTS` (interne
  Docker-URLs wie `http://app:4000/`, nicht `127.0.0.1`), `REPLICATION_SERVER_URL`,
  `RECUT_POLYGON_PATH` + `RECUT_POLYGON_DOWNLOAD_URL`.

## Risiken beim Merge nach `develop` — jetzt

Mit den heutigen Änderungen ist der Merge selbst risikoarm, weil Produktion
unverändert weiterläuft. Was sich ändert:

| Änderung                                                   | Risiko                                                                 | Einschätzung                                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Staging läuft Red/Green alle 3h statt Nachtlauf            | Ohne Staging-DB scheitert jeder Lauf früh; Staging-Kacheln veralten    | Staging-DB **vor** dem Merge anlegen, sonst Staging-Workflow vorerst auf `legacy` lassen |
| Staging-Deploy startet den Processing-Container nicht mehr | Nach einem Deploy gibt es auf Staging keinen sofortigen Neuaufbau mehr | Gewollt; Aktualisierung kommt vom 3h-Cron                                                |
| Processing-Image enthält pyosmium, psql, docker-cli        | Größeres Image                                                         | Unkritisch                                                                               |
| Neue Env-Variablen im Manifest, alle `required: false`     | Keins                                                                  | —                                                                                        |
| Neue Route `warm-cache-delta`                              | Nur mit API-Key erreichbar, bisher ungenutzt                           | Unkritisch                                                                               |
| `restartTileServer` und docker.sock-Mount sind zurück      | Processing-Container hat Docker-Zugriff (wie bis Juni)                 | Bewusste Entscheidung; nur Red/Green nutzt es                                            |

Was der Merge **nicht** tut: Produktion umstellen. Das ist ein späterer,
bewusster Schritt (`PIPELINE: red-green` + 3h-Cron in
`generate-tiles.production.yml`).

## Was jetzt zu tun ist

In dieser Reihenfolge; die ersten drei sind Voraussetzung für jeden Test.

1. **Staging-DB anlegen** auf dem Staging-Server (`CREATE DATABASE staging`),
   `postgres_fdw`-Recht prüfen, Environment-Secrets setzen, Plattenplatz prüfen.
2. **`data.*` in die Staging-DB bringen** (mindestens einmal manuell per
   `data-schema`-Import gegen die Staging-DB) und entscheiden, wie das dauerhaft
   passiert.
3. **`meta` anhängen statt swappen** — kleiner Code-Schritt (Punkt 4 oben).
4. **Erster Staging-Lauf** klein: `PROCESS_ONLY_TOPICS=parking`, kleines Bbox,
   manuell per `workflow_dispatch`. Ziel: Promotion und Rollback einmal gesehen
   haben. Dabei `SELECT current_database()` im Build loggen, um sicher zu sein,
   dass Staging und nicht Primary beschrieben wird.
5. **Spalten-Drift lösen** (Punkt 3 oben), bevor der erste echte Topic-Wechsel
   die Pipeline stilllegt.
6. **Deutschland-Lauf auf Staging**: Laufzeit, Plattenbedarf, FDW-Kopierdauer
   messen. Entscheidet, ob 3h realistisch ist.
7. **72h-Soak** auf Staging mit dem 3h-Cron; danach Fehlerinjektion (Abbruch im
   Build, Validierungsfehler, Verifier-Streak).
8. **Produktions-Canary**: einmal manuell, dann `generate-tiles.production.yml`
   umstellen.

Realistischer Aufwand bis zum Produktions-Canary: ein bis zwei Wochen, davon der
größte Teil Warten auf Läufe und Messen — nicht Programmieren.

## Empfehlung

- **Jetzt:** Die heutigen Fixes sind committet. Der Branch kann nach `develop`,
  sobald Schritt 1 (Staging-DB) erledigt ist — vorher würde der Staging-Nachtlauf
  durch einen scheiternden Red/Green-Lauf ersetzt.
- **Nicht jetzt:** Produktion umstellen. Die drei grundsätzlichen Lücken
  (Staging-DB und `data.*`, Spalten-Drift, `meta`) plus die fehlenden Testläufe
  sind jeweils allein Grund genug.
- **Ehrliche Einordnung:** Der Code ist in einem guten, reviewbaren Zustand und
  die Architektur trägt. Aber "fertig implementiert" und "einmal durchgelaufen"
  sind zwei verschiedene Zustände, und wir sind im ersten.

# Flächenfinder-Instanz: Deploy & Reprocessing triggern

Die Flächenfinder-Instanz (`flaechenfinder.tilda-geo.de`, SSH-Alias `flaechenfinder`,
Setup in `infra-code/tilda-flaechenfinder.vars.yml`) deployed sich **selbst automatisch**:
ein systemd-Timer pollt alle 2 Minuten den Branch `flaechenfinder-module` auf GitHub und
baut/restartet bei neuem Commit (`/usr/local/bin/tilda-autodeploy.sh`,
`infra-code/playbooks/tilda-autodeploy.yml`). Ein Push auf `flaechenfinder-module` reicht
also für den Code-Deploy.

**Reprocessing der Daten läuft NICHT automatisch mit** – der Autodeploy baut/restartet
nur die Container, er stößt keinen neuen Processing-Lauf an. Dafür manuell auf der Instanz:

```bash
ssh flaechenfinder
cd /srv/tilda-geo
docker compose -f docker-compose.yml -f docker-compose.network.yml -f docker-compose.instance.yml \
  run --rm -e PROCESS_ONLY_BBOX="" -e SKIP_DOWNLOAD=1 -e PROCESS_ONLY_TOPICS=<topic> processing
```

- `PROCESS_ONLY_TOPICS=<topic>` auf das betroffene Topic beschränken (z.B. `parking`),
  sonst läuft der volle nightly-Satz.
- `SKIP_DOWNLOAD=1`, wenn der PBF-Extract schon aktuell auf der Instanz liegt (spart den Download).
- `PROCESS_ONLY_BBOX` leer lassen, wenn `process_only_bbox` in den Instanz-Vars ebenfalls leer ist
  (Germany-wide Extract); sonst auf denselben Wert setzen wie in den Vars.

Vollständiger Ablauf inkl. Ersteinrichtung: `infra-code/playbooks/process-tilda-instance.yml`.

## Falle: `parking` ist im Code auf Bboxen begrenzt

`parking` ist das einzige Topic mit gesetzten `bboxes`
(`processing/constants/topics.const.ts`: Berlin, BiBi, Lörrach, Friedberg, München).
`resolveTopicInputFile` (`processing/steps/filter.ts`) schneidet daraus vor osm2pgsql ein
`parking_extracted.osm.pbf` – **auch bei leerem `PROCESS_ONLY_BBOX` und Germany-Extract**.
Für Deutschland-weites Parken muss dort `bboxes: null` gesetzt werden; sonst nur weitere Bbox
ergänzen. Env-Vars allein reichen nicht.

Lokal (Default-Stack, Repo-Root) Deutschland-weit testen:

```bash
docker compose up -d db
PROCESS_GEOFABRIK_DOWNLOAD_URL=https://osm-internal.download.geofabrik.de/europe/germany-latest-internal.osm.pbf \
PROCESS_ONLY_TOPICS=parking PROCESS_ONLY_BBOX= \
SKIP_DOWNLOAD=0 WAIT_FOR_FRESH_DATA=0 SKIP_UNCHANGED=0 SKIP_WARM_CACHE=1 PROCESSING_DIFFING_MODE=off \
docker compose up processing
```

`SKIP_DOWNLOAD=0`, weil im `osmfiles`-Volume sonst der alte Regional-Extract liegt.
`bun run processing` taugt hier nicht (die CLI verlangt zwingend Preset/`--only-bbox`).
Rechne mit mehreren Stunden und hebe ggf. `mem_limit`/`cpus` des `processing`-Containers in
`docker-compose.override.yml` (Default 4 GB) an.

## Gebäude (`_buildings`) neu bauen

Dasselbe gilt für `public._building_entrances` (Gebäudeeingänge, `entrance=*`): ebenfalls aus
`landcover`, existiert also erst nach einem expliziten Lauf. Vorher liefert
`PostgisLoader.load_building_entrances()` ein leeres GeoDataFrame.

`public._buildings` ist kein eigenes Topic, sondern Teil von **`landcover`**
(`schedule: 'weekend'`). Auf dieser Instanz gibt es **keinen Cronjob fürs Processing** –
der einzige Timer ist `tilda-autodeploy.timer` (nur Deploy). Die Weekend-Schedule greift hier
also nie von selbst; `landcover` läuft nur, wenn man es explizit anstößt.

```bash
ssh flaechenfinder
cd /srv/tilda-geo
# Stale Weekend-PBF entfernen (siehe Falle unten), dann:
docker compose -f docker-compose.yml -f docker-compose.network.yml -f docker-compose.instance.yml \
  run --rm -T \
  -e PROCESS_ONLY_BBOX= -e SKIP_DOWNLOAD=1 -e SKIP_UNCHANGED=0 \
  -e SKIP_WARM_CACHE=1 -e PROCESSING_DIFFING_MODE=off \
  -e PROCESS_ONLY_TOPICS=landcover processing
```

**Falle: die Weekend-PBF wird stillschweigend wiederverwendet.** `landcover` liest nicht die
nightly-PBF, sondern `filtered/weekend_filtered.osm.pbf` (eigener Tag-Filter, gebaut aus dem
Download). Regeneriert wird die nur, wenn Download oder Filter-Expressions sich geändert haben
oder die Datei fehlt – mit `SKIP_DOWNLOAD=1` ist `sourceFileChanged=false`, also wird eine alte
Datei aus einem früheren Regional-Extract weiterverwendet und die Gebäude bleiben auf dem alten
Ausschnitt. Prüfen und ggf. löschen:

```bash
docker run --rm -v tilda-geo_osmfiles:/d alpine ls -la /d/filtered /d/downloads
docker run --rm -v tilda-geo_osmfiles:/d alpine rm -f /d/filtered/weekend_filtered.osm.pbf
```

Kontrolle danach (Extent muss Deutschland abdecken, nicht nur eine Bbox):

```sql
SELECT count(*), round(min(ST_XMin(ST_Transform(geom,4326)))::numeric,2) AS minx,
       round(max(ST_XMax(ST_Transform(geom,4326)))::numeric,2) AS maxx
FROM public._buildings;
```

Weitere Hinweise: `processing/topics/landcover/README.md`, `planning-worker/ALKIS.md`.

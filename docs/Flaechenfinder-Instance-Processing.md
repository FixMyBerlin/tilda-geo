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

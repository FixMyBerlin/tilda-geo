# Review: Layer-Ordering-Umbau (feature/layerreihenfolge) — Findings & Follow-ups

> **STATUS 2026-07-04: Alle Findings 1–10 GEFIXT** (Anker-Const `ATLAS_APP_ANCHOR_IDS` in
> mapData/types.ts, Zod-Enum + baselineCount-Guard, Loader-Preload, Notes/QA auf
> visibility-Toggling, GeoJSON lazy via leerer FeatureCollection, Präzedenz in
> buildAtlasLayerProps, Admin-UI Drag-Handle/Hinweise/Confirm/dataUpdatedAt-Key,
> Cleanup-Bundle). Verifiziert: bun run check grün (204 Tests), Smoke-e2e grün,
> DB-Order + Anker-Pin im Live-Stack bestätigt. Dev-DB-Testzeilen gelöscht.
> Doku unten = Originalzustand der Review.

High-effort multi-agent review (8 Finder-Perspektiven × Opus, adversarial verify) über alle
uncommitteten Änderungen dieses Worktrees (Stand 2026-07-04). 42 Kandidaten → dedupe → 8 verifiziert
(3 CONFIRMED, 2 PLAUSIBLE, 3 REFUTED) + direkt bestätigte Cleanup/UX-Punkte.

Referenz: [LAYER_SORTING_REQUIREMENTS.md](LAYER_SORTING_REQUIREMENTS.md)

---

## 🔴 1. Notes/QA-Layer verletzen weiterhin das Mount-Invariant (CONFIRMED)

**Dateien:** `SourcesLayersOsmNotes.tsx:35`, `SourcesLayersInternalNotes.tsx:58`, `SourcesLayersQa.tsx` (activeQaConfig-Guard)

`LayersOsmNotes`, `LayersInternalNotes` und `LayersQa` machen bei Toggle weiterhin `return null`
(mount/unmount) statt visibility-Toggling — genau das Anti-Pattern, das der Umbau für
Atlas/Datasets beseitigt. Alle drei Gruppen haben `beforeId: undefined` (ganz oben), ebenso die
Mask-Layer. **Folge:** Die relative Reihenfolge von Notes / QA / Mask hängt von der
Toggle-Reihenfolge ab. Konkret sichtbar: wird ein Layer nach der Mask remounted, landet er
über/unter der halbtransparenten Mask je nach Klickfolge — die Mask kann Notes dimmen.

**Fix:** Auch diese drei auf always-mounted + `layerVisibility()` umstellen (bei InternalNotes/QA:
Layer immer rendern sobald Daten da sind, visibility aus showParam/activeConfig ableiten).
QA-Feature-States sind davon unabhängig (feature-state, nicht layout).

## 🔴 2. GeoJSON-Datasets werden jetzt eager geladen (CONFIRMED)

**Datei:** `SourcesLayersStaticDatasets.tsx:40` (`SourcesStaticDatasets`)

Alle Dataset-Sources der Region sind jetzt immer gemountet. Für `mapRenderFormat === 'geojson'`
fetcht MapLibre die `data`-URL **sofort beim Hinzufügen** (verifiziert in maplibre
`geojson_source.ts`: `onAdd → load → _updateWorkerData` — unabhängig von Layer-Visibility).
**Folge:** Jeder Besucher einer Region lädt alle GeoJSON-Uploads komplett herunter, auch nie
selektierte. pmtiles/vector bleiben lazy.

**Fix-Optionen:** (a) GeoJSON-Sources mit leerer FeatureCollection mounten und `data` erst bei
Selektion auf die URL setzen (Mount-Order bleibt stabil, kein Eager-Fetch); (b) nur
GeoJSON-Datasets selektionsgebunden mounten (Ordnungsrisiko dokumentieren); (c) Uploads
flächendeckend auf pmtiles migrieren und GeoJSON-Support einschränken.

## 🔴 3. Admin-Save kann die komplette Ordnung löschen; kein Concurrency-Schutz (CONFIRMED)

**Dateien:** `AdminLayerOrder.tsx:125` (Stale-Filter), `updateMapLayerOrder.server.ts` (deleteMany+createMany)

Der Save filtert stale Keys raus und ersetzt die ganze Tabelle. Wenn alle DB-Keys stale sind
(realistisch nach einem Key-Format-/Subcategory-Refactor), wird `entries: []` gespeichert →
Tabelle leer, alle Regionen fallen kommentarlos auf die (leere) Code-Fallback-Liste zurück.
Prisma akzeptiert `createMany({data: []})` als No-op. Außerdem: kein optimistic-concurrency —
zwei Admins überschreiben sich gegenseitig (last write wins), und ein Background-Refetch
verwirft laufende Edits (siehe #8).

**Fix:** (a) Server: leere Liste ablehnen oder nur mit explizitem `force`-Flag zulassen;
(b) Client: Bestätigungsdialog, wenn die Liste deutlich schrumpft (>N% stale);
(c) Version/updatedAt-Token in der Mutation für Konflikt-Erkennung.

## 🟠 4. Atlas-Layer warten auf einen nicht-preloadeten Query (Waterfall bestätigt; Invertierungs-Mechanik real) (PLAUSIBLE)

**Dateien:** `SourcesLayersAtlasGeo.tsx:93` (`if (layerOrderPending) return null`), `routes/regionen/$regionSlug.tsx` (Loader)

Bestätigt: Der Region-Loader preloadet QA/Uploads/Processing, aber **nicht**
`mapLayerOrderQueryOptions` → jede Region wartet einen zusätzlichen seriellen Client-Roundtrip,
bevor irgendein Atlas-Layer mountet. Zudem mounten `LayersStaticDatasets` etc. sofort — falls ein
Dataset-Layer und ein Atlas-Layer je dieselbe Anker-Gruppe teilen (nur bei custom
`beforeId`-Konfigs), invertiert der späte Atlas-Mount die Gruppen-Reihenfolge.
Entwarnung (verifiziert): bei dauerhaft fehlschlagendem GET hängt die Karte NICHT
(TanStack v5: error ⇒ `isPending: false` ⇒ Fallback rendert).

**Fix:** `queryClient.ensureQueryData(mapLayerOrderQueryOptions())` ins Loader-`Promise.all`;
dann kann der `isPending`-Guard fast immer sofort passieren. Optional: alle `Layers*` auf den
Query warten lassen (ein gemeinsames Gate in `AllLayers`), damit Gruppen nie zeitversetzt mounten.

## 🟠 5. beforeId aus der DB ist unvalidiert → Layer verschwinden still (PLAUSIBLE, Severity korrigiert)

**Dateien:** `map-layer-order/schemas.ts:10` (`z.string().min(1).nullable()`), `SourcesLayersAtlasGeo.tsx:141` (`as TBeforeIds`)

Ein beforeId-Wert, der keinem Style-Layer entspricht (Tippfehler, umbenannter Anker, direkter
DB-Write), erreicht maplibre ungefiltert. Verifiziert: maplibre **wirft nicht**, sondern feuert
ein ErrorEvent und fügt den Layer **nicht hinzu** (`addLayer` bailt); beim Runtime-Wechsel
(`moveLayer`-Pfad) wird der Layer sogar erst entfernt und dann fallen gelassen. Folge: einzelne
Layer fehlen still + Console-Error — kein Crash, aber schwer diagnostizierbar.

**Fix:** Anker-Liste als shared Const exportieren (siehe #6) und im Zod-Schema
`beforeId: z.enum(ANCHOR_BEFORE_IDS).nullable()` erzwingen; den `as TBeforeIds`-Cast entfernen.

## 🟠 6. Anker-Liste existiert 4× ohne Single Source of Truth

**Dateien:** `mapData/types.ts:154` (TBeforeIds), `AdminLayerOrder.tsx:11` (ANCHOR_GROUPS + GROUP_LABELS), `tests/smoke/map-layer-order.spec.ts:11` (ANCHORS), `map-layer-order/schemas.ts` (untypisiert)

Wird ein Anker im Maptiler-Style + `TBeforeIds` ergänzt/umbenannt (der Kommentar in types.ts lädt
dazu ein), driften Admin-UI, Smoke-Test und Schema still auseinander: neue Gruppe fehlt im
Dropdown, alter Wert bleibt speicherbar (→ #5), Test prüft Veraltetes.

**Fix:** `export const ATLAS_APP_ANCHOR_IDS = [...] as const` neben `TBeforeIds` (Typ daraus
ableiten: `satisfies readonly TBeforeIds[]`); Admin-UI, Smoke-Spec, Zod-Schema und der Cast in
LayersAtlasGeo konsumieren nur noch diese Const.

## 🟠 7. beforeId-Präzedenz ist über zwei Dateien verteilt; Override-Semantik inkonsistent

**Dateien:** `SourcesLayersAtlasGeo.tsx:138` (post-hoc Mutation), `utils/buildAtlasLayerProps.ts` / `utils/beforeId.ts` (restliche Präzedenz)

Der DB-Override wird nach `buildAtlasLayerProps` per Mutation draufgepatcht und dupliziert den
`backgroundParam === 'default'`-Guard von Hand. Konsequenzen: (a) der Override übersteuert still
ein per Config gesetztes `layer.beforeId`; (b) auf custom Raster-Backgrounds wird der
Admin-Override ignoriert (by design: alles oben), die Sortierung greift aber weiter — das Admin-UI
kommuniziert nirgends, dass Gruppen background-abhängig sind; (c) ändert jemand den Guard in
`beforeId.ts`, wird die Kopie vergessen.

**Fix:** Override als höchste Präzedenzstufe in `buildAtlasLayerProps`/`beforeId.ts` integrieren
(ein Parameter `adminBeforeId`), Admin-UI-Hinweis „gilt nur für Standard-Hintergrund" ergänzen.

## 🟡 8. Admin-Editor: UX-Lücken & Performance

**Datei:** `AdminLayerOrder.tsx`

- **Gruppenwechsel positionslos** (`moveToGroup` hängt ans Ende = oben in der Karte): Admin muss
  nachträglich draggen; erwartbar wäre Einfügen an wählbarer Position.
- **Drag-Surface-Konflikt:** die ganze Row ist drag-bar UND enthält das `<select>` — auf
  Touch/Trackpad kollidieren Drag und Select. Fix: dedizierter Drag-Handle
  (`dragListener={false}` + `useDragControls`).
- **Edits gehen verloren:** `key={JSON.stringify(dbEntries)}` remountet den Editor bei jedem
  Refetch mit anderem Payload (z. B. Edit eines zweiten Admins) und verwirft laufende
  Umsortierungen kommentarlos. Fix: state-Reset nur nach eigenem Save (onSuccess), plus
  Konflikt-Hinweis statt Silent-Reset; Key auf `dataUpdatedAt` statt Stringify.
- **Perf:** `getAllAtlasLayerKeys()` (voller Kategorien-Walk) läuft bei jedem Render inkl. jedes
  Drag-Updates → Modul-Scope-Const/useMemo; ~280 Motion-Rows sind schwer — ggf. Virtualisierung
  oder Motion nur pro aufgeklappter Gruppe.
- **Kein Button-Style-Reuse:** Save-Button hand-gerollt blau statt shared `buttonStyles`
  (App-Konvention gelb) → fällt aus dem Admin-Design und verpasst globale Restyles.

## 🟡 9. „Eine flache sortierbare Liste" gilt nur für Atlas-Geo — im Admin nicht erkennbar

**Dateien:** `AllLayers.tsx:17`, `AdminLayerOrder.tsx`

Per Design-Entscheidung (Ticket: Interleaving nur auf Anker-Ebene) sind die Gruppenblöcke
(Backgrounds → System → Atlas → Datasets → Notes → QA) fixe JSX-Reihenfolge; nur Atlas-Layer sind
DB-sortierbar. Das Admin-UI zeigt aber kommentarlos nur Atlas-Keys — ein Admin kann nicht
erkennen, dass „Upload über Bikelanes" prinzipiell nicht per UI geht. **Fix:** Hinweistext im
Admin-UI + Kommentar in `AllLayers.tsx`, der die Design-Entscheidung mit dem Ticket verlinkt;
Uploads-Ordering kommt separat (per-Region, nach regions-Merge).

## 🟡 10. Kleinere Cleanups (gesammelt)

- `createSourceProps` (geojson/vector-Branch) dupliziert zwischen `SourcesLayersStaticDatasets.tsx:16`
  und `SourcesLayersSystemDatasets.tsx:31`; ebenso die `beforeId`-Fallback-Resolution
  (`'atlas-app-beforeid-fallback'` 4× hardcodet) → shared Helper `resolveUploadBeforeId(layer)`.
- `SourcesLayersOsmNotes.tsx`: `selectedFeatureIds`-Berechnung läuft vor dem
  `!showOsmNotesParam`-Early-Return (dead work auf dem Map-Renderpfad); dazu ein toter
  auskommentierter `circle-sort-key`-Block.
- `SourcesLayersAtlasGeo.tsx:100`: `beforeIdOverrides`-Map wird auch gebaut, wenn
  `backgroundParam !== 'default'` (Ergebnis ungenutzt).
- `sortByLayerOrder.ts:13`: Empty-List-Special-Case gibt die Original-Array-Referenz zurück, der
  generische Pfad eine Kopie — Inkonsistenz ohne Nutzen, Branch streichen.

---

## Verifiziert & verworfen (kein Handlungsbedarf)

- **InternalNotes Source-ohne-Layer:** identisch zum alten Verhalten (Source hing nie am
  showParam) — keine Regression durch den Split.
- **LayerHighlight Visibility-Branches:** alle Branches erhalten visibility (line/circle via
  Spread, fill/symbol via explizitem Patch); Highlights sind zudem nie interaktiv.
- **QA-Split-Race („Source layer X does not exist"):** Source-`id` ist stabil, AllSources rendert
  vor AllLayers im selben Commit, `createLayer` guarded auf `getSource`; `useQaMapState` prüft
  `getLayer` und re-synct über das `data`-Event. Kein neues Race.

## Sonstiges / Betrieb

- Die 3 Test-Zeilen, die ich zur Verifikation in `prisma."MapLayerOrder"` (Dev-DB
  `wt_tilda_geo_layerreihenfolge_db`, Port 5433) geseedet hatte, konnten nicht mehr gelöscht
  werden (Container war gestoppt). Beim nächsten DB-Start: `DELETE FROM prisma."MapLayerOrder";`
- Die e2e-Verifikation von Phase 3 (agent-browser gegen Port 5599) wurde unterbrochen — nach den
  Fixes zusammen mit dem bestehenden Smoke-Spec (`tests/smoke/map-layer-order.spec.ts`) nachholen.

## Empfohlene Reihenfolge fürs Follow-up

1. #6 shared Anchor-Const (entsperrt #5-Schema-Fix und räumt #7 teilweise auf)
2. #5 Zod-Enum + Cast entfernen
3. #4 Loader-Preload (eine Zeile) + optional gemeinsames Gate
4. #1 Notes/QA auf visibility-Toggling
5. #3 Save-Guards (empty/confirm/version)
6. #2 GeoJSON-Lazy-Strategie entscheiden + umsetzen
7. #7/#8/#9/#10 Cleanups & Admin-UX in einem Aufwasch

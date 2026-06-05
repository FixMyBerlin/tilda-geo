# Map props: attribution, locale, RTLTextPlugin

## attributionControl={false}

Disable the **default** attribution control on `<Map>`, then add a child `<AttributionControl>` where you want it (position, compact, custom attribution).

Tilda main map:

```tsx
// tilda-geo: RegionMap.tsx
<MapGl attributionControl={false} …>
  <AttributionControl compact={true} position="bottom-left" />
</MapGl>
```

Per [react-map-gl AttributionControl docs](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/attribution-control): `attributionControl={false}` on `<Map>` prevents duplicate controls when you mount your own. Use `position` on `<AttributionControl>` to place it (`bottom-left`, `bottom-right`, etc.).

Static dataset sources can still pass `attribution={attributionHtml}` on `<Source>` for layer-attributed credits.

## locale (UI strings, not label language)

MapLibre / react-map-gl expose a **`locale`** prop on `<Map>`: `Record<string, string>` patching the default UI string table (control tooltips, etc.). Replaces removed `*Label` props on controls ([upgrade guide](https://visgl.github.io/react-map-gl/docs/upgrade-guide)).

```tsx
<Map
  locale={{
    'NavigationControl.ZoomIn': 'Hineinzoomen',
    'NavigationControl.ZoomOut': 'Herauszoomen',
  }}
  …
/>
```

Keys match MapLibre’s namespaced ids — see [MapLibre locale example](https://maplibre.org/maplibre-gl-js/docs/examples/locale-switching/) and `default_locale.js` in maplibre-gl.

**Not in tilda today** — app UI is German via React/intl; map controls use defaults. Add `locale` when product requires German (or other) control tooltips without custom control wrappers.

**Tile label language** (street names, POIs) is separate: depends on vector tile schema and style (`text-field` expressions, Mapbox Language–style plugins). react-map-gl does not auto-translate labels ([issue #1187](https://github.com/visgl/react-map-gl/issues/1187)). FMC styles are largely German field names in the style JSON — no runtime language plugin in tilda.

## RTLTextPlugin (right-to-left text plugin)

MapLibre can load an RTL text shaping plugin for Arabic/Hebrew symbol labels. react-map-gl passes this via **`RTLTextPlugin`** ([Map API](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/map)).

**FMC default — set `false` explicitly:**

```tsx
<Map RTLTextPlugin={false} … />
```

**Do not omit the prop.** If omitted, react-map-gl’s default is an external **`pluginUrl`** (Mapbox CDN). That loads third-party JavaScript at runtime — privacy/CSP risk (user IP and page context exposed to another host; remote code execution outside your bundle). FMC apps use Latin/German labels only — disable the plugin.

**Only if you need RTL labels:** self-host the plugin file in your app (static asset or bundled URL — never a CDN you do not control) and pass:

```tsx
<Map RTLTextPlugin={{ pluginUrl: '/mapbox-gl-rtl-text.min.js', lazy: true }} … />
```

Audit CSP and consent if you enable this.

## Recommended FMC defaults

```tsx
<Map
  attributionControl={false}
  dragRotate={false}
  RTLTextPlugin={false}
  // locale={{ … }}   // optional: German control strings
>
  <AttributionControl compact position="bottom-left" />
</Map>
```

## Checklist

- [ ] `attributionControl={false}` on every `<Map>`
- [ ] `<AttributionControl>` (or legal requirement equivalent) as child
- [ ] `locale` for control UI translations if not English
- [ ] Do not confuse `locale` with vector label i18n — style/tiles problem
- [ ] `RTLTextPlugin={false}` on every `<Map>` unless RTL symbol text is required (never rely on omit — default loads external CDN)

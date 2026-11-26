# Inspector charts for static datasets

A static dataset can show values as charts in the inspector. The `meta.ts` holds data only (it is stored as JSON in `MapDatasetUpload.configs`), so it names a chart type and its settings; the components here draw it. Schema: [inspectorChart.schema.ts](inspectorChart.schema.ts).

```ts
inspector: {
  enabled: true,
  documentedKeys: ['fuehr_anteile', 'composit_nps', …],
  translations,
  charts: {
    // A property with shares as text: `47 % Radweg; 41 % Schutzstreifen; <1 % Kreuzungsbereich`
    fuehr_anteile: { type: 'shareBar', colors: { Radweg: '#9FDFB1' }, translationKey: 'fuehr' },
    // An own key with several numeric properties
    composit_nps: {
      type: 'pie',
      unit: '%',
      slices: [
        { key: 'nps_positiv', label: 'Positiv', color: '#15803d' },
        { key: 'nps_negativ', label: 'Negativ', color: '#b91c1c' },
      ],
    },
  },
}
```

- `shareBar` replaces the row of its property. Text it cannot read is shown as text. The first entry is shown below the bar until another part is hovered; a click opens the list of all entries.
- `pie` needs its own key in `documentedKeys`, so it does not work with `documentedKeys: false`.
- Use the same color constant for the chart and the layer paint of the dataset, so both match.

# How this works…

We need the `notes_closed`, `notes_open` files for the `InspectorFeatureOsmNotes`.
The SVGs here are rendered directly, but we also need the files as Sprites for our OSM notes style.

Since we generate the sprites automatically with `npm run updateStyles`, we need a workaround:

1. There is a dummy folder ("sprites-ohne-category") with dummy layer https://studio.mapbox.com/styles/hejco/cl706a84j003v14o23n2r81w7/edit/#13.47/52.54694/13.53422/-161.6
2. This adds the sprites which we in turn can pull using our regular process.

**SVG format…**

The files we have here have a format that does not work in Mapbox for some reason.

A workaround is, to add the files to Figma and "flatten" and/or "convert to outline", then re-export. Use those files for Mapbox.

# Next JS

Next.js does not play nice with <Image> + SVG + Tailwind so the icons are now react components using https://transform.tools/.

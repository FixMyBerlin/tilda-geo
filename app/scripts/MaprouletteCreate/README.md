# About

**A script to create or update MapRoulette (MR) challenges.**

- It takes the challenge definition that is managed by the Keystatic CMS from `src/content/campaigns/SLUG/index.json`
- It filters those that have MR deactivated (some are just visuall representations)
- It creats the challenge via API and updates the JSON to add the challenge `id`
- Or it updates the challenge with new data
- The data comes from [defaults](./maproulette/default.const.ts) merged with the challenge specific data from the `content/*.json`
- The same data is used by Astro to build teh challenge pages at https://radinfra.de/kampagnen/

## Params

You can use the `filter` param to only run specific challenges. See [package.json](../../package.json) `bun run maproulette:help` for more.

## NOTES

- All challenges use the MR project `57664` https://maproulette.org/admin/project/57664

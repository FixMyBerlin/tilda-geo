# roads_bikelanes pseudo-tags

External per-way enrichments attached in `osm2pgsql.process_way` before categorization.

## Architecture

> **Settlement disabled** pending [private-issues#3423](https://github.com/FixMyBerlin/private-issues/issues/3423).
> Only mapillary + sidepath are loaded and applied.

1. **Load once** — [`load_merged_pseudo_tags.lua`](load_merged_pseudo_tags.lua) parses mapillary and sidepath CSVs into **one** hash map (`merged[osm_id] = { … }`). One lookup per way in the hot path.
2. **Apply** — [`apply_pseudo_tags.lua`](apply_pseudo_tags.lua) reads a single merged row and sets mapillary + sidepath tags on the way.

## Related

- Sidepath round-trip: [`../pseudo_tags_sidepath/README.md`](../pseudo_tags_sidepath/README.md)
- Settlement (disabled): [`../pseudo_tags_settlement_area/README.md`](../pseudo_tags_settlement_area/README.md)

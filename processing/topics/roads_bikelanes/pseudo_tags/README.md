# roads_bikelanes pseudo-tags

External per-way enrichments attached in `osm2pgsql.process_way` before categorization.

## Architecture

1. **Load once** — [`load_merged_pseudo_tags.lua`](load_merged_pseudo_tags.lua) parses mapillary, sidepath, and settlement CSVs into **one** hash map (`merged[osm_id] = { … }`). One lookup per way in the hot path.
2. **Apply** — [`apply_pseudo_tags.lua`](apply_pseudo_tags.lua) reads a single merged row and sets mapillary, sidepath, and `_in_settlement_area` tags on the way.

## Related

- Sidepath round-trip: [`../pseudo_tags_sidepath/README.md`](../pseudo_tags_sidepath/README.md)
- Settlement: [`../pseudo_tags_settlement_area/README.md`](../pseudo_tags_settlement_area/README.md)

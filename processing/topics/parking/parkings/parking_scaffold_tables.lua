-- Scaffold tables that are filled by SQL later.
-- We use our default vector tile projection of 3857 here.

osm2pgsql.define_table({
  name = 'parkings',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'linestring', projection = 3857 },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
})

osm2pgsql.define_table({
  name = 'parkings_no',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'multilinestring', projection = 3857 },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
})

osm2pgsql.define_table({
  name = 'parkings_separate',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'polygon', projection = 3857 },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
})

osm2pgsql.define_table({
  name = 'parkings_cutouts',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    -- 'geometry' means 'polygon' and 'multipolygon'
    { column = 'geom', type = 'geometry', projection = 3857 },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
})

-- Labels (filled by SQL in 10_create_labels.sql)
osm2pgsql.define_table({
  name = 'parkings_labels',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point', projection = 3857 },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
})

-- Quantized tables (filled by SQL in 8_create_quantized_tables.sql)
osm2pgsql.define_table({
  name = 'parkings_quantized',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point', projection = 3857 },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
})

osm2pgsql.define_table({
  name = 'off_street_parking_quantized',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point', projection = 3857 },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
})

-- Labels (filled by SQL in 10_create_labels.sql)
osm2pgsql.define_table({
  name = 'parkings_separate_labels',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point', projection = 3857 },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
})

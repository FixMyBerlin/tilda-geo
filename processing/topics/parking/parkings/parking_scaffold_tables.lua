-- Scaffold tables that are filled by SQL later.
-- We use our default vector tile projection of 3857 here.

osm2pgsql.define_table({
  name = 'parkings',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'linestring', projection = 3857 },
    { column = 'minzoom', type = 'integer' },
  },
})

osm2pgsql.define_table({
  name = 'parkings_no22',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'multilinestring', projection = 3857 },
    { column = 'minzoom', type = 'integer' },
  },
})

osm2pgsql.define_table({
  name = 'parkings_separate',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'polygon', projection = 3857 },
    { column = 'minzoom', type = 'integer' },
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
    { column = 'minzoom', type = 'integer' },
  },
})

-- Labels (filled by SQL in 9_create_labels.sql)
osm2pgsql.define_table({
  name = 'parkings_labels',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point', projection = 3857 },
    { column = 'minzoom', type = 'integer' },
  },
})

-- Labels (filled by SQL in 9_create_labels.sql)
osm2pgsql.define_table({
  name = 'parkings_separate_labels',
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point', projection = 3857 },
    { column = 'minzoom', type = 'integer' },
  },
})

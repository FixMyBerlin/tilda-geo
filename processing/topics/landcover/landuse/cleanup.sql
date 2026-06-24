-- landuse overlap cleanup. Run from landcover.sql, after osm2pgsql has built the `landuse` table.
--
-- Nested polygons — typically an amenity/leisure area (school, park, hospital…) sitting inside a
-- larger landuse block (residential, education…) — otherwise pile up as overlapping fills. We let
-- the larger polygon win and DELETE the redundant smaller one; geometries are never clipped.
--
-- SPEED over accuracy (this is a cleanup pass, not a precise operation):
-- We drop a polygon only when it is FULLY inside a larger one (ST_CoveredBy) — one boolean
-- predicate per candidate pair, backed by the existing GIST index through the && bbox prefilter,
-- and with no intersection geometry to build. A percentage-based rule (drop when e.g. >= 90 % of
-- the small area is inside the big one) would also catch polygons that poke slightly out, but it
-- has to build ST_Intersection per pair and is markedly slower at country scale. Swap the
-- ST_CoveredBy line for the two commented lines below if we ever want the thorough version.
--
-- Notes:
-- - "larger wins" uses a strict `>` on area, so exact-duplicate polygons (equal area) are kept.
-- - Full containment is transitive (A⊆B⊆C ⇒ A⊆C), so deleting nested chains never drops coverage.

DELETE FROM landuse AS small
USING landuse AS big
WHERE ST_Area(big.geom) > ST_Area(small.geom)   -- larger wins
  AND big.geom && small.geom                     -- bbox prefilter (uses the GIST index)
  AND ST_CoveredBy(small.geom, big.geom);        -- small fully inside big
  -- Percentage-based alternative (more thorough, slower):
  --   AND ST_Contains(big.geom, ST_PointOnSurface(small.geom))
  --   AND ST_Area(ST_Intersection(small.geom, big.geom)) >= 0.9 * ST_Area(small.geom)

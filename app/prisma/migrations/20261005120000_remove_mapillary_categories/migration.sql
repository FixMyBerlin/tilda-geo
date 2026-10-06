-- Mapillary is no longer a category: street imagery (Mapillary, Panoramax) is its own feature in
-- every region (`?photos=`). `RegionConfigTemplate` rows stay: old `?config=` links are decoded
-- with them, and an active Mapillary category there turns street imagery on.
DELETE FROM "RegionCategoryAssignment" WHERE "categoryId" IN ('mapillary', 'radinfra_mapillary');

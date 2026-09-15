describe('`result_tags` (off_street_parking)', function()
  local off_street_parking_area_categories = require('topics.parking.off_street_parking.areas.off_street_parking_area_categories')
  local categorize_off_street_parking = require('topics.parking.off_street_parking.helper.categorize_off_street_parking')
  local result_tags = require('topics.parking.off_street_parking.helper.result_tags')

  it('carries meta (updated_by/updated_at/changeset_id) from the OSM object', function()
    local object = {
      id = 1,
      type = 'way',
      tags = { amenity = 'parking', parking = 'underground', capacity = '10' },
      -- Fields osm2pgsql attaches to the OSM object; used by `metadata()` to build `meta`.
      user = 'test_user',
      timestamp = 1700000000,
      changeset = 42,
    }
    local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
    local tags_result = result_tags(category_result, 100)

    -- `metadata()` must read the OSM object (`result.object`), not `result` itself,
    -- otherwise `meta` is silently `{}` (regression covered here).
    assert.are.equal(tags_result.meta.updated_by, 'test_user')
    assert.are.equal(tags_result.meta.updated_at, 1700000000)
    assert.are.equal(tags_result.meta.changeset_id, 42)
  end)
end)

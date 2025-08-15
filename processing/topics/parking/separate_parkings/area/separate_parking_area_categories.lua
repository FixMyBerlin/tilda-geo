require('init')
require('class_separate_parking_category')
require('two_wheel_parking_helper')

local separate_parking_point_categories = {
  class_separate_parking_category.new({
    -- https://www.openstreetmap.org/way/1198952905
    -- https://www.openstreetmap.org/way/1181489790 disabled
    id = 'parking_lane',
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'lane'
    end,
  }),
  class_separate_parking_category.new({
    -- https://www.openstreetmap.org/way/559505481
    id = 'parking_street_side',
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'street_side'
    end,
  }),
  class_separate_parking_category.new({
    id = 'parking_kerb',
    conditions = function(tags)
      return tags.amenity == 'parking' and (tags.parking == 'on_kerb' or tags.parking == 'half_on_kerb')
    end,
  }),
  class_separate_parking_category.new({
    id = 'parking_shoulder',
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'shoulder'
    end,
  }),
  class_separate_parking_category.new({
    -- See https://github.com/FixMyBerlin/private-issues/issues/2604
    id = 'parking_median',
    conditions = function(tags)
      return tags.amenity == 'parking' and tags.parking == 'surface' and tags.location == 'median'
    end,
  }),
}

return separate_parking_point_categories

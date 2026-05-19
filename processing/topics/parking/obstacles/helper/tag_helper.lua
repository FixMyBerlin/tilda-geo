local TAG_HELPER = {}

function TAG_HELPER.is_obstacle_parking(tags)
  return tags['obstacle:parking'] == 'yes'
end

return TAG_HELPER

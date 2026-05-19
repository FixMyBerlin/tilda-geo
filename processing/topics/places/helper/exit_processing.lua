local SET = require('topics.helper.sets')

local allowed_values = SET.set({
  'city',
  'borough',
  'suburb',
  'town',
  'village',
  'hamlet'
})

local function exit_processing(object)
  if not object.tags.place then
    return true
  end

  if not allowed_values[object.tags.place] then
    return true
  end

  return false
end

return exit_processing

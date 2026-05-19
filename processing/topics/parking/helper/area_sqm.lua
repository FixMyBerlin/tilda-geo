local function area_sqm(object)
  if object:as_multipolygon():srid() == 5243 then
    return object:as_multipolygon():area()
  end
  return object:as_multipolygon():transform(5243):area()
end

return area_sqm

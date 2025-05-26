package.path = package.path .. ";/processing/topics/roads_bikelanes/roads/?.lua"
require("RoadTodos")

for _, funcName in ipairs(RoadTodos) do
  print(funcName.id .. ";" .. tostring(funcName.todoTableOnly))
end

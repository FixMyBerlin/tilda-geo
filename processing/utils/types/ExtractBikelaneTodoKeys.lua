package.path = package.path .. ";/processing/topics/roads_bikelanes/bikelanes/?.lua"
require("BikelaneTodos")

for _, funcName in ipairs(BikelaneTodos) do
  print(funcName.id .. ";" .. tostring(funcName.todoTableOnly))
end

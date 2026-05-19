package.path = package.path .. ';/processing/topics/roads_bikelanes/roads/?.lua'
local road_todo_categories = require('topics.roads_bikelanes.roads.road_todo_categories')

for _, todo in ipairs(road_todo_categories) do
  print(todo.id .. ';' .. tostring(todo.todoTableOnly))
end

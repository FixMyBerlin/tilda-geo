package.path = package.path .. ';/processing/topics/roads_bikelanes/bikelanes/?.lua'
local bikelane_todo_categories = require('topics.roads_bikelanes.bikelanes.bikelane_todo_categories')

local adjoining_of_vs_csv_todo = require('topics.roads_bikelanes.pseudo_tags_sidepath.adjoining_of_vs_csv_todo')

for _, todo in ipairs(adjoining_of_vs_csv_todo.append_to(bikelane_todo_categories)) do
  print(todo.id .. ';' .. tostring(todo.todoTableOnly))
end

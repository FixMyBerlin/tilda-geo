require('init')
package.path = package.path .. ';/processing/topics/roads_bikelanes/bikelanes/?.lua'
local bikelane_todo_categories = require('bikelane_todo_categories')

for _, todo in ipairs(bikelane_todo_categories) do
  print(todo.id .. ';' .. tostring(todo.todoTableOnly))
end

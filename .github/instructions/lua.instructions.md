---
applyTo: '**/*.lua'
---

## General
- This is LUA embedded into osm2pgsql.
  - That means we have access to a few helpers from https://osm2pgsql.org/doc/manual.html#lua-library-for-flex-output.
  - There is also the special `osm2pgsql` class that we use all over which is documented at https://osm2pgsql.org/doc/manual.html.
- We have helper libraries installed which can be found in [processing.Dockerfile](../../processing.Dockerfile)
  - Use those rather than create helper functions from scratch.
  - `busted` is our testing framework https://lunarmodules.github.io/busted/
  - `inspect` is to print / inspect tables https://github.com/kikito/inspect.lua — our own helper around that is called `Log(object, 'logging prefix')`
  - `penlight` is to add python like helpers to lua https://lunarmodules.github.io/Penlight/
  - `ftcsv` is to read CSV files https://github.com/FourierTransformer/ftcsv, https://luarocks.org/modules/fouriertransformer/ftcsv
  - We can add more helpers if this makes our code cleaner; make a suggestion if that applies.
- We use camel_case for our file names and functions and variables.
  - However, there are legacy functions that are still using MixedCase. Don't change this during an unrelated edit.
  - Our linter does not accept lower case global functions but we ignore that because we cannot configure the linter properly.
- Each file has to start with a `require('init')` which will make all `package.path` avaiable so we don't have to require those manually.
- To require a function, used to put everything in the global namespace like `require("function_name")` the file and then use `function_name`. But for new helper methods, we return from the helper file and require via  `local function_name = require("function_name")`.
- Preserve code comments that are still relevant.
- Add typescript like code comments for VS Code intellisense for each function that is created or updated.

## Software tests
- To run the test, to go to the root folder and run `./processing/run-tests.sh`. Do this to evaluate the test result yourself. You cannot run single files, you always have to run the whole suite.
- Are always in a `__tests__` folder in the same directory or one directory up.
- They need to have a name like `file_name_of_functions.test.lua`. So the same name as the file that is being tested postfixed with ".test".
- They use busted internally but that is automatically loaded and does not need to be required.
- Use `require("foo")` to load the function that is being tested.
- Always add `require('Log')` and `require('init')`
- To run the test, to got `./` and run `./processing/run-tests.sh`
- Usually use `assert.are.same()` which is a deep compare (Docs: https://lunarmodules.github.io/busted/#assert-same)
- In assertions, follow this pattern: `assert.are.same(actual_result, expected_result)`. Busted will show the first argument as "Passed In" which is what we define as "right". The second argument will be shown as "Expected" in the console output which is the `expected_result` of the tested function.
  **Example:**
  ```lua
  assert.are.equal(result.category.id, 'parking_lane')
  -- If this fails, Busted shows:
  -- Expected: (string) 'parking_street_side'
  -- Passed in: (string) 'parking_lane'
  ```

## Formatting
- Use 2 spaces for indentation.
- Use single quotes in lua files whenever possible.
- Update code to use single quotes whenever a line of code is touched.
- In tables, always have a comma at the last entry.
  **Example:**
  ```lua
  table_foo = {
    'foo',
    'bar',
  }
  ```

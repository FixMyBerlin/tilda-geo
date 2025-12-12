# About

Diffing is used to give visibility to changes from one processing to the next.
This is a debugging tool that should only run during development and maybe on staging.

One gotcha is, that the schema for diffing is called `diffing_reference` but the data in "diffing_reference" is only used for this diffing tooling.

Modes:

- `off` - no diffing
- `previous` - compare to last run (updates reference each time)
- `fixed` - compare to frozen reference (doesn't update reference)
- `reference` - create/update baseline reference, remove all diffs (clean slate)

There is more on the diffing in other READMEs in this project.

#!/bin/bash
# Start docker and run all tests there.

# Make sure we have the latest lua path at hand.
# Szenario: We just added a lua helper in a new folder but did not run the full processing, yet
bun run ./processing/run-tests-update-lua-package-paths.ts

# Now use docker to run the tests.
# We have to use docker because that is where the LUA hepers are all present.
docker build --target testing -f ./processing.Dockerfile -t test_img .
docker run --rm -v "$(pwd)/processing:/processing" test_img

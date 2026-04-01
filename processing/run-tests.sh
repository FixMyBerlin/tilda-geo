#!/bin/bash
# Start docker and run all tests there.

# GUI Git clients (e.g. GitHub Desktop) often run hooks with a minimal PATH, so the
# Docker CLI is missing even when Docker Desktop is installed.
export PATH="/usr/local/bin:/opt/homebrew/bin:${HOME}/.docker/bin:${PATH}"

# Make sure we have the latest lua path at hand.
# Szenario: We just added a lua helper in a new folder but did not run the full processing, yet
bun run ./processing/run-tests-update-lua-package-paths.ts

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not in PATH — skipping processing Docker tests."
  echo "To run them locally: open a normal terminal in the repo and run ./processing/run-tests.sh"
  exit 0
fi

# Now use docker to run the tests.
# We have to use docker because that is where the LUA hepers are all present.
if ping -q -c 1 -W 1 8.8.8.8 > /dev/null; then
  echo "Internet available — building Docker image..."
  docker build --target testing -f ./processing.Dockerfile -t test_img .
else
  echo "No internet connection — skipping Docker build."
fi

docker run --rm -v "$(pwd)/processing:/processing" test_img

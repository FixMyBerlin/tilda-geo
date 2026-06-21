# GitHub Desktop and other GUI clients use a minimal PATH without the shell profile.
# Add common global-bin locations so `nub` (installed via the command below) resolves.
PATH="/opt/homebrew/bin:/usr/local/bin:${HOME}/.local/bin:${PATH}"
export PATH

if ! command -v nub >/dev/null 2>&1; then
  echo "husky: nub not found. Install it with 'npm install -g --ignore-scripts=false @nubjs/nub' (see https://nubjs.com)." >&2
  exit 127
fi

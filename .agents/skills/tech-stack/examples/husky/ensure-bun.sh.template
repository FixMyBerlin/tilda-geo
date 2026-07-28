# GitHub Desktop and other GUI clients use a minimal PATH without shell profile.
if [ -z "${BUN_INSTALL:-}" ] && [ -d "${HOME}/.bun" ]; then
  BUN_INSTALL="${HOME}/.bun"
fi
if [ -n "${BUN_INSTALL:-}" ]; then
  PATH="${BUN_INSTALL}/bin:${PATH}"
fi
PATH="${HOME}/.bun/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"
export PATH

if ! command -v bun >/dev/null 2>&1; then
  echo "husky: bun not found. Install https://bun.sh or add ~/.bun/bin to PATH." >&2
  exit 127
fi

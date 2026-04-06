# worktree-cli

CLI to create a Git worktree one level up, copy env files, and open the new folder in Cursor and GitHub.

**Run from the tilda-geo repo root:** `bun ./worktree-cli/cli.ts`

The script will prompt for folder name (created as `../folderName`), then branch (last 5 branches or “Other” for a custom name), create the worktree, copy `.env` and `.env.*` from repo root and from `app/`, then run `cursor .` and `github .` from the new folder so it opens in both apps.

---

## Documentation (from chat)

### Chat 1: Worktrees setup

**Q:** …

**A:** Yes, **Git worktrees** are the right tool for this: one repo, multiple working directories, each on a different branch, so you can open each in a separate Cursor window and run a dev server in one while working in the other.

#### 1. Add a worktree for `develop`

From your repo root (e.g. where `refactoring` is checked out):

```bash
cd /some_path/tilda-geo
git worktree add ../tilda-geo-develop develop
```

This creates a sibling folder `tilda-geo-develop` with branch `develop` checked out. Your current folder stays on `refactoring`.

#### 2. Open each folder in its own Cursor window

- **Window 1:** `File → Open Folder` → `/some_path/tilda-geo` (refactoring).
- **Window 2:** `File → Open Folder` → `/some_path/tilda-geo-develop` (develop).

Each window has its own chat/agent context and terminal. Run the dev server in the window where you need it (e.g. in `tilda-geo-develop` for develop).

#### 3. Optional: list / remove worktrees later

- List: `git worktree list`
- Remove when done: `git worktree remove ../tilda-geo-develop` (or delete the folder and then `git worktree prune`).

#### Notes

- **Same repo, same remotes:** worktrees share the same `.git` (and refs); only the working tree and current branch differ. No need to clone again.
- **One branch per worktree:** each path has exactly one branch checked out; Git prevents checking out the same branch in two worktrees.
- **Ports:** if both run the same app (e.g. Vite dev on 5173), run the second server on another port (e.g. `PORT=5174 bun run dev`) to avoid conflicts.

### Chat 2: GitHub app and .env

#### GitHub app and pull/push with worktrees

**From the terminal (per worktree)**
In each worktree folder you use normal Git commands:

- `git pull` — updates the branch checked out in that worktree
- `git push` — pushes that same branch
- `git fetch` — updates remotes (shared across worktrees)

So in `tilda-geo-develop` you're on `develop`; in `tilda-geo` you're on `refactoring`. Pull/push in each folder only affects that branch.

**GitHub Desktop**
GitHub Desktop is worktree-aware. If you **File → Add Local Repository** and choose a worktree path (e.g. `tilda-geo-develop`), it will show that path's current branch and let you pull/push for that worktree. You can have both the main repo and the worktree added as separate "repositories" in the list; they share the same Git data but show different branches. Use the one whose path matches the Cursor window you're in.

#### .env and other ignored files

`.env` (and things like `.env.local`) are usually in `.gitignore`, so they exist only in the working tree and are **not** shared between worktrees. Each worktree has its own copy of the working tree, so the new worktree does **not** get your existing `.env` automatically. You do have to copy them (or recreate them) in the new worktree.

**Copying with a one-off script**

You can run a small script once per new worktree. From the **main** repo (or any worktree that already has the env files), run something like:

```bash
# Copy env files from current dir to another worktree (edit TARGET to match your path)
TARGET="../tilda-geo-develop"
for f in .env .env.local .env.*.local; do
  [ -f "$f" ] && cp "$f" "$TARGET/$f" && echo "Copied $f"
done
```

Or a reusable script that takes the target as an argument:

```bash
#!/usr/bin/env bash
# Usage: ./copy-env-to-worktree.sh ../tilda-geo-develop
TARGET="${1:?Usage: $0 <path-to-worktree>}"
for f in .env .env.local .env.*.local; do
  for g in $f; do
    [ -f "$g" ] && cp "$g" "$TARGET/$g" && echo "Copied $g"
  done
done
```

If your env files live under a subdirectory (e.g. `app/.env`), run the script from that directory or adjust paths (e.g. `TARGET="../tilda-geo-develop/app"`).

This CLI automates worktree creation, env copying, and opening Cursor + GitHub in the new folder.

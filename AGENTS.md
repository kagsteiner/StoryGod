# StoryGod working agreement

## Project context

StoryGod is a personal, single-user project maintained by one person with Codex.

Git is used only as version history and recovery in case a change needs to be reverted. GitHub is primarily the transport used to deploy the application to the VPS.

## Git workflow

- Work directly on `main`.
- Do not create feature branches, worktrees, or pull requests unless the user explicitly requests one.
- When asked to commit or publish changes:
  1. Review the diff and ensure only relevant files are included.
  2. Run `npm test` when application code changed.
  3. Stage only the relevant files.
  4. Create a concise commit.
  5. Push directly to `origin/main`.
- If remote `main` has changed, use a fast-forward-only pull. Stop and ask before resolving divergence.
- Never force-push, rewrite history, rebase published commits, or use destructive Git commands unless explicitly requested.
- Preserve `data/story-sessions/` and other runtime data. These files must remain untracked and must never be deleted by Git operations.

## General approach

- Prefer the simplest implementation and workflow appropriate for a one-person project.
- Avoid team-oriented process overhead unless it provides a concrete benefit here.

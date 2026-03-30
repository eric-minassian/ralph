# Project Agent Guide

> This file is automatically loaded by AI coding tools (Claude Code, Codex, Kiro, etc.)
> at the start of each Ralph loop iteration. Keep it brief (~60 lines max).
> Only add entries when you discover something that would save a future iteration from failure.

## Build & Run

```bash
# TODO: replace with your project's commands
pnpm install        # install dependencies
pnpm run dev        # start dev server
```

## Verify (backpressure)

These commands MUST pass before any commit:

```bash
# TODO: replace with your project's commands
pnpm run typecheck  # type checking
pnpm run lint       # linting
pnpm run test       # tests
```

## Conventions

- Commit messages: `feat: [TASK-ID] — short description`
- One logical change per commit
- Do not modify specs/ files during build mode

## Operational Learnings

> Ralph adds entries here when it discovers patterns, gotchas, or workarounds.
> Each entry should explain what AND why. Delete entries that no longer apply.

<!-- Example:
- Use `--legacy-peer-deps` for pnpm install — transitive dep conflict between X and Y (added 2026-03-30)
-->

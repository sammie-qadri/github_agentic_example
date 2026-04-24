---
name: push
description: "Safe git push with pre-push verification. Runs full test suite, validates branch naming, checks migration-status.md freshness, and pushes with upstream tracking. Use when: pushing changes to remote, preparing to create a PR, or after completing a shard."
argument-hint: "Optional: branch name to push (defaults to current branch)"
---

# Standardized Push Workflow

Safe push with full verification, branch validation, and upstream tracking.

## When to Use

- After committing changes and ready to push to remote
- Before creating a Pull Request
- After completing a migration shard

## Pre-Push Checks (Mandatory)

### 1. Full Test Suite

```bash
mvn clean test
```

**Gate:** ALL tests must pass. No exceptions. If tests fail, fix them first.

### 2. Branch Naming Validation

```bash
git branch --show-current
```

**Valid branch patterns:**

| Pattern            | Use For                              |
|--------------------|--------------------------------------|
| `shard/{N}`        | JOB001 migration shard             |
| `shard-580/{N}`    | JOB002 migration shard             |
| `feature/{desc}`   | New feature work                     |
| `fix/{desc}`       | Bug fix branch                       |
| `refactor/{desc}`  | Refactoring work                     |
| `test/{desc}`      | Test-only changes                    |
| `chore/{desc}`     | Build, config, or maintenance        |
| `docs/{desc}`      | Documentation-only changes           |

**Invalid patterns:**
- `main` — never push directly to main; use PRs
- Detached HEAD — must be on a named branch
- Unnamed or default branch names

If the branch name doesn't match a valid pattern, warn the user but don't block (they may have a valid reason).

### 3. Migration Status Freshness

Check if migration components were changed in recent commits:
```bash
git diff origin/main...HEAD --name-only | findstr /R "model process tasklet application.yml"
```

If matches found, verify that `migration-status.md` was also modified:
```bash
git diff origin/main...HEAD --name-only | findstr "migration-status.md"
```

If migration components changed but `migration-status.md` was NOT updated → **warn** the user. This is a §0.1 requirement.

### 4. Uncommitted Changes Check

```bash
git status --porcelain
```

**Gate:** No uncommitted changes should exist. If present:
- Warn the user about uncommitted work
- Ask if they want to commit first (invoke `/commit`) or stash

### 5. Remote Sync Check

```bash
git fetch origin
git log HEAD..origin/main --oneline
```

If the remote has commits not in the local branch, inform the user they may need to rebase or merge before pushing.

### 6. Execute Push

For new branches (no upstream tracking):
```bash
git push -u origin $(git branch --show-current)
```

For existing tracked branches:
```bash
git push
```

### 7. Post-Push Summary

Report:
```
## Push Summary

| Detail          | Value                                |
|-----------------|--------------------------------------|
| Branch          | {branch name}                        |
| Remote          | origin                               |
| Commits pushed  | {count}                              |
| Tests           | ✅ All passing                       |
| Status          | Ready for PR                         |
```

## Worktree-Aware Behavior

Detect worktree state:
```bash
git worktree list
```

If in a git worktree:
- Push only the worktree's branch
- Remind user about post-completion merge sequence:
  ```
  # From the main repo working directory:
  git merge {branch-name}    # resolve conflicts if any
  git worktree remove ../batch-migration-example-shard-{N}
  git branch -d {branch-name}
  ```

## Failure Modes

| Issue | Action |
|-------|--------|
| Tests fail | Fix first, do not push broken code |
| Uncommitted changes | Commit or stash first |
| Invalid branch name | Warn but allow (user may have reason) |
| Remote has new commits | Suggest rebase/merge before push |
| Migration status stale | Warn, suggest updating before push |
| Push rejected | Check for force-push protection, suggest pull + rebase |

---
name: commit
description: "Safe, standardized git commit with pre-flight checks. Validates compilation and tests pass, verifies staged files, enforces conventional commit format, and checks mandatory documentation updates (lessons.md, migration-status.md). Use when: committing changes, preparing a commit, or checking if a commit is safe."
argument-hint: "Commit message (e.g., 'feat: add PB/TA fee processor') or omit to be prompted"
---

# Standardized Commit Workflow

Safe git commit with pre-flight verification, conventional commit enforcement, and mandatory documentation checks.

## When to Use

- After completing implementation and testing
- To safely commit changes with all project guards
- To verify staging is correct before committing

## Pre-Flight Checks (Mandatory)

### 1. Compilation Check

```bash
mvn clean compile -DskipTests
```

**Gate:** Must pass. Do NOT commit with compilation errors.

### 2. Test Check

```bash
mvn clean test
```

**Gate:** Must pass. Do NOT commit with test failures.

### 3. Staged Files Verification

```bash
git status --short
git diff --cached --name-only
```

**Rules:**
- **Shared workspace** (parallel shard worktrees active): **NEVER use `git add -A`**. Stage only specific files from the current task's deliverables.
- **Dedicated workspace** (single branch, no parallel work): `git add -A` is acceptable.
- Review staged files — if ANY unexpected files appear, **STOP and ask the user**.
- Verify no secrets, credentials, or `.env` files are staged.
- Verify no IDE-specific files (`.idea/`, `.vscode/settings.json`) are staged.

**Detection:**
```bash
git worktree list
```
If multiple worktrees are active → treat as shared workspace.

### 4. Conventional Commit Format

Commit messages MUST follow this format:
```
<type>(<scope>): <subject>

<body>
```

**Types:**

| Type       | Use For                                       |
|------------|-----------------------------------------------|
| `feat`     | New feature, new processor/tasklet/model       |
| `fix`      | Bug fix                                        |
| `test`     | Test-only changes                              |
| `refactor` | Code refactoring (no behavior change)          |
| `docs`     | Documentation updates                          |
| `chore`    | Build, config, or maintenance changes          |

**Scope** (optional but recommended): Component or area (e.g., `job001`, `job002`, `shard-3`, `yaml`)

**Examples:**
```
feat(job001): add CommOrderTrd load processor and tests
fix(job002): correct byte offset for exchange fee field
test: add edge case tests for null account ID handling
docs: update migration-status.md after shard 4 completion
chore: add verify and commit skills for copilot CLI
```

**Rules:**
- Subject line ≤ 72 characters
- No period at end of subject
- Use imperative mood ("add" not "added" or "adds")
- Body wraps at 72 characters

### 5. Mandatory Documentation Checks

**Lessons.md (§0 rule):**

Check if ANY of these occurred during the current task:
- Wrong assumption that was corrected
- Bug found in generated code
- Human correction to any output
- Misread schema, component structure, or requirement
- Type error, lint error, or test failure caused by generated code
- Approach changed mid-task

If **YES** → A `lessons.md` entry MUST be appended BEFORE committing. Use `/lessons add` to create the entry.

**Migration-status.md (§0.1 rule):**

If the task implemented, modified, or removed any migration component (model, processor, tasklet, YAML job, REST client, or test), then `migration-status.md` MUST be updated BEFORE committing.

### 6. Execute Commit

If the message was provided as an argument:
```bash
git commit -m "<provided message>"
```

If no message was provided, construct one from the changes:
```bash
git commit -m "<type>(<scope>): <subject>" -m "<body with deliverable list>"
```

For shard commits, use the established format:
```bash
git commit -m "feat: JOB001 Shard {N} of 6 — {shard title}" -m "Deliverables:
- {list of key files}"
```

### 7. Post-Commit Verification

```bash
git log --oneline -1
git status --short
```

Confirm the commit was created and the working directory is clean (or has only expected unstaged changes).

## Failure Modes

| Issue | Action |
|-------|--------|
| Compilation fails | Fix errors first, re-run `/verify` |
| Tests fail | Fix tests first, re-run `/verify` |
| Unexpected files staged | Ask user before proceeding |
| Missing lessons.md entry | Run `/lessons add`, then commit |
| Missing migration-status.md | Update status, then commit |
| Commit message doesn't match format | Reformat and retry |

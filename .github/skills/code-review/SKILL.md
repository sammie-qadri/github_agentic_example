---
name: code-review
description: "Comprehensive code review with TODO/FIXME scanning and resolution. Analyzes changed files for standards compliance, discovers TODOs left by agents, delegates fixes to @coder, and tracks unresolved items in memory. Use when: after implementation, before committing, or auditing code quality."
argument-hint: "Optional: base branch to diff against (defaults to 'main'), or 'full' to scan entire codebase"
---

# Code Review with TODO Resolution

Comprehensive code review that combines standards checking, TODO/FIXME scanning, and automated resolution through agent delegation.

## When to Use

- After any implementation work (before `/commit`)
- When delegated by `@architect` to validate completed work
- As a self-review step by `@coder` before delivery
- To audit the codebase for accumulated TODOs/FIXMEs
- To verify all agent-generated code meets project standards

## Phase 1: Determine Scope

```bash
# Default: diff against main
git diff --name-only main...HEAD

# If argument is a branch name:
git diff --name-only {argument}...HEAD

# If argument is 'full':
# Scan all files in src/main/java/ and src/test/java/
```

Categorize changed files:
- **Java source** (`src/main/java/`) → full standards + TODO scan
- **Test files** (`src/test/java/`) → test standards + TODO scan
- **YAML config** (`application.yml`) → job config review
- **Documentation** (`.md`) → completeness check
- **Memory files** (`.github/memory/`) → verify required updates

## Phase 2: Standards Compliance

Run `/impl-check` on all changed Java source files. This covers:

| Check Category | Severity | Key Items |
|---------------|----------|-----------|
| Anti-patterns | ERROR | `@Autowired`, `System.out`, `@Slf4j`, `@Bean` Job/Step |
| Package boundaries | ERROR | Classes in wrong packages, forbidden packages |
| Processor compliance | ERROR | Missing `super.process()`, `uniqueKey`, `businessDate`, `processTS` |
| Tasklet compliance | ERROR | Missing `RepeatStatus.FINISHED`, swallowed exceptions, unclosed JDBC |
| Model compliance | WARNING | Missing annotations, wrong column naming |
| Constants | WARNING | Magic strings/numbers, wrong constructor guard |
| Test compliance | ERROR | JUnit 4, `@SpringBootTest`, missing `@DisplayName`/`@Nested` |

## Phase 3: TODO/FIXME Scanning

Scan all changed files for TODO markers:

```powershell
# Scan changed files for TODOs
$files = git diff --name-only main...HEAD
foreach ($file in $files) {
    Select-String -Path $file -Pattern "TODO|FIXME|HACK|XXX|TEMP|WORKAROUND" -CaseSensitive |
        ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
}
```

For full codebase scan:
```powershell
Get-ChildItem -Path src -Recurse -Include "*.java" |
    Select-String -Pattern "TODO|FIXME|HACK|XXX" -CaseSensitive |
    ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
```

### Classification

For each discovered TODO/FIXME:

| Classification | Criteria | Action |
|---------------|----------|--------|
| `RESOLVABLE` | Solution is clear from project context, specs, or codebase patterns | Delegate fix to `@coder` |
| `BLOCKED` | Requires SME input, missing schema, external dependency | Document in `todos.md` |
| `DEFERRED` | Low priority, acceptable tech debt, scaffold placeholder | Track in `todos.md` |

### Resolution Protocol

For `RESOLVABLE` items:
1. Gather context: file, surrounding code, related files, specs
2. Delegate to `@coder` with specific instructions:
   ```
   Fix TODO at {file}:{line}: "{todo text}"
   
   Context: {what the code does, what the TODO needs}
   Expected fix: {specific implementation guidance}
   
   After fixing:
   - Remove the TODO comment
   - Run /verify to confirm compilation and tests pass
   - Report what changed
   ```
3. Verify the fix was applied correctly
4. Report the outcome

For `BLOCKED` items:
1. Document in `.github/memory/todos.md`:
   ```markdown
   | TODO-{NNN} | {file} | {line} | {description} | BLOCKED | {date} | {reason} |
   ```
2. If `todos.md` doesn't exist, create it with the header format

For `DEFERRED` items:
1. Add to `.github/memory/todos.md` with status `DEFERRED`
2. Leave the TODO in code but ensure it's tracked

## Phase 4: Documentation Verification

Check mandatory documentation updates:

| Condition | Required Update | Check |
|-----------|----------------|-------|
| Migration components changed | `migration-status.md` | §0.1 rule |
| Corrections/bugs occurred | `lessons.md` | §0 rule |
| Architecture changed | Spec docs | Best practice |
| New components added | Test files exist | Mirror structure |

## Phase 5: Security Scan

Quick security checklist:
- [ ] No secrets/credentials in code or config
- [ ] No SQL injection vectors (parameterized queries only)
- [ ] No hardcoded URLs or connection strings
- [ ] No `--no-verify` flags in scripts
- [ ] Input validation at system boundaries

## Phase 6: Generate Report

```
## Code Review Report

### Scope
- **Base:** {branch}
- **Files reviewed:** {count} ({java_count} Java, {test_count} tests, {other_count} other)
- **Lines changed:** +{added} / -{removed}

---

### ❌ Errors (Block Merge) — {count}
1. [{file}:{line}]: {description}

### ⚠️ Warnings (Should Fix) — {count}
1. [{file}:{line}]: {description}

### 💡 Suggestions — {count}
1. {description}

### ✅ Passing Checks
- {list of passed categories}

---

### TODO/FIXME Resolution

**Summary:** {total} found → {resolved} resolved, {blocked} blocked, {deferred} deferred

| # | File | Line | Description | Status | Action Taken |
|---|------|------|-------------|--------|--------------|
| 1 | {f} | {l} | {desc} | ✅ RESOLVED | Fixed by @coder — {what changed} |
| 2 | {f} | {l} | {desc} | 🔴 BLOCKED | Documented — {reason} |
| 3 | {f} | {l} | {desc} | 🟡 DEFERRED | Tracked — {reason} |

---

### Documentation Status
- {✅/❌} migration-status.md {updated/needs update}
- {✅/❌} lessons.md {updated/needs update}
- {✅/❌} todos.md {updated/needs update}

### Security
- {✅ Clean / ❌ Issues: ...}

---

### Verdict
**{APPROVE / REQUEST CHANGES / NEEDS DISCUSSION}**

{Brief rationale for verdict}
```

## TODO Tracking File Format

`.github/memory/todos.md`:

```markdown
# Project TODO Tracker

Centralized tracking for TODOs, FIXMEs, and open items discovered during code review.

## Status Legend
- **OPEN** — Discovered, not yet addressed
- **BLOCKED** — Cannot resolve without external input
- **DEFERRED** — Acceptable tech debt, tracked for future
- **RESOLVED** — Fixed and verified

## Open Items

| ID | File | Line | Description | Status | Discovered | Reason/Notes |
|----|------|------|-------------|--------|------------|--------------|

## Resolved Items

| ID | File | Description | Resolved Date | Resolution |
|----|------|-------------|---------------|------------|
```

## Integration

- Run `/code-review` after implementation, before `/commit`
- Combines output from `/impl-check` with TODO scanning and documentation checks
- The `@code-reviewer` agent uses this as its primary workflow
- Can be triggered by `@architect` after delegated implementation
- Can be used by `@coder` as self-review before delivery
- Results feed into `/lessons add` when corrections are found
- The `/commit` skill recommends running `/code-review` first

## Example Invocations

```
/code-review                    # Diff against main
/code-review develop            # Diff against develop branch
/code-review full               # Scan entire codebase
```

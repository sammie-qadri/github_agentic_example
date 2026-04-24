---
name: lessons
description: "Manage lessons learned entries. Add new lessons, search existing ones, or check if current task has unrecorded lessons. Enforces the mandatory self-improvement loop (copilot-instructions.md §0). Use when: recording a mistake or correction, searching for past lessons, or before closing a task."
argument-hint: "Action: 'add <description>', 'search <keyword>', or 'check' (e.g., 'add Wrong assumption about field byte offsets')"
---

# Lessons Learned Management

Enforce and streamline the mandatory self-improvement loop (copilot-instructions.md §0).

## When to Use

- **`/lessons add {description}`** — Record a new lesson after a correction or bug
- **`/lessons search {keyword}`** — Find past lessons on a topic before making assumptions
- **`/lessons check`** — Before closing a task, verify no lessons are missing

## Actions

### `add` — Record a New Lesson

Append a new entry to `.github/memory/lessons.md` using this exact format:

```markdown
### {YYYY-MM-DD} — {Short Title}

**Trigger:** {What happened — wrong assumption, bug found, human correction, etc.}
**Context:** {What task/shard/component was being worked on}
**Lesson:** {What was learned — be specific and actionable}
**Prevention:** {How to avoid this in the future — concrete steps or checks}
```

**All four fields are required.** Do not abbreviate or skip any.

**Examples of good lesson entries:**

```markdown
### 2026-03-15 — Copy-paste constructor guard message

**Trigger:** Bug in generated code — constructor guard said "BatchConstants" instead of "BatchConstants"
**Context:** Shard 0, implementing BatchConstants utility class
**Lesson:** Constructor guard messages are a common copy-paste trap. The message must match the actual class name.
**Prevention:** Always verify guard exception messages match the current class name, not the template source.
```

```markdown
### 2026-03-20 — Parallel shards require git worktrees

**Trigger:** Approach changed mid-task — untracked files from shard 1 were deleted by shard 2's cleanup
**Context:** Running shards 1 and 2 in parallel in the same working directory
**Lesson:** Git worktrees are required for parallel shard execution. Untracked files cannot be recovered from git.
**Prevention:** Always use `git worktree add` for parallel shards. Never share a working directory.
```

### `search` — Find Past Lessons

Search `.github/memory/lessons.md` for the given keyword(s). Return matching entries with dates and key takeaways.

Useful before:
- Making an assumption about field layouts or byte offsets
- Choosing an approach for a new component
- Working with a pattern that has caused issues before

### `check` — Verify Current Task Compliance

Review the current task or conversation for any §0 triggers:

| Trigger | Description |
|---------|-------------|
| Wrong assumption | Made an assumption that turned out to be incorrect |
| Bug in generated code | Compile error, test failure, or logic error in code you wrote |
| Human correction | User corrected any aspect of your output |
| Misread schema | Misinterpreted a COBOL copybook, entity structure, or requirement |
| Type/lint/test error | Error caused directly by generated code |
| Approach change | Started one approach, then had to switch mid-task |

**If any trigger fired:**
- List the triggers found
- Prompt to record each one with `/lessons add`
- Do not consider the task complete until lessons are recorded

**If no triggers fired:**
- Report: "No lessons triggered — task closure is clear."

## Integration

- The `/commit` skill checks for lesson compliance before allowing a commit
- The `/convert-job1` and `/convert-job2` shard workflows include lesson checks in Phase 6
- Always run `/lessons check` before closing any task, per §0

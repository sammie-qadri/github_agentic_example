---
name: status
description: "Quick migration status dashboard. Reads migration-status.md and summarizes current state: what's done, what's in progress, component counts, and any inconsistencies between sections. Use when: checking project state, planning next work, or verifying migration progress."
---

# Migration Status Dashboard

Quick summary of the JOB001/JOB002 migration project state.

## When to Use

- Before starting a new task (understand current state)
- After completing a shard (verify status updates are consistent)
- During planning or standup prep
- To check for inconsistencies in migration tracking

## Execution

### 1. Read Migration Status

Read `.github/memory/migration-status.md` and extract:

**JOB001 — Legacy Data Collection**
- Overall status (% complete)
- Each shard status (0–6): DONE / IN PROGRESS / NOT STARTED
- Component counts: models, processors, tasklets, tests
- COBOL program disposition counts

**JOB002 — Legacy Fee Aggregation**
- Overall status (% complete)
- Each shard status (0–6): DONE / IN PROGRESS / NOT STARTED
- Component counts: models, processors, tasklets, tests

### 2. Cross-Section Consistency Check

Cross-reference counts between migration-status.md sections to flag discrepancies:

| Check | Sections Compared |
|-------|-------------------|
| Model count | §6 total vs §15 shard sum vs Migration Progress Summary |
| Processor count | §7 total vs §15 shard sum vs Migration Progress Summary |
| Tasklet count | §8 total vs §15 shard sum vs Migration Progress Summary |
| Test count | §10 total vs actual files in `src/test/java/` |
| COBOL mapping | §11 done count vs §15 shard completion |

### 3. Filesystem Verification (Optional)

Count actual files in the workspace to verify against status:
```bash
# Count model files
find src/main/java/com/example/bst/fit/model -name "*.java" | wc -l

# Count processor files
find src/main/java/com/example/bst/fit/batch/process -name "*.java" | wc -l

# Count tasklet files
find src/main/java/com/example/bst/fit/batch/tasklet -name "*.java" | wc -l

# Count test files
find src/test/java -name "*Test.java" | wc -l
```

On Windows:
```powershell
(Get-ChildItem -Path src/main/java/com/example/bst/fit/model -Filter "*.java" -Recurse).Count
(Get-ChildItem -Path src/main/java/com/example/bst/fit/batch/process -Filter "*.java" -Recurse).Count
(Get-ChildItem -Path src/main/java/com/example/bst/fit/batch/tasklet -Filter "*.java" -Recurse).Count
(Get-ChildItem -Path src/test/java -Filter "*Test.java" -Recurse).Count
```

### 4. Output Format

```
## Migration Status Dashboard
**Last updated:** {date from migration-status.md}

---

### JOB001 — Legacy Data Collection
**Status:** {COMPLETE / IN PROGRESS} ({N}% of COBOL programs migrated)

| Shard | Title                          | Status         |
|-------|--------------------------------|----------------|
| 0     | Foundation Models              | ✅ DONE        |
| 1     | {title}                        | ✅ DONE        |
| ...   | ...                            | ...            |

**Components:** {N} models · {N} processors · {N} tasklets · {N} test classes

---

### JOB002 — Legacy Fee Aggregation
**Status:** {COMPLETE / IN PROGRESS} ({N}% of COBOL programs migrated)

| Shard | Title                          | Status         |
|-------|--------------------------------|----------------|
| 0     | Foundation                     | ✅ DONE        |
| ...   | ...                            | ...            |

**Components:** {N} models · {N} processors · {N} tasklets · {N} test classes

---

### Combined Totals
| Metric       | Count |
|-------------|-------|
| Models       | {N}   |
| Processors   | {N}   |
| Tasklets     | {N}   |
| Test files   | {N}   |
| Total tests  | {N}   |

---

### Consistency Check
{✅ All section counts are consistent / ⚠️ Discrepancies found:}
- {list discrepancies if any}

### Next Steps
- {suggest remaining shards or tasks}
```

## Integration

- Run `/status` before starting any migration shard
- The `/convert-job1` and `/convert-job2` skills read migration status in Phase 1
- Useful before standups or planning sessions

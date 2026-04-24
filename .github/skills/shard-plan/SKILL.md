---
name: shard-plan
description: "Analyze a mainframe job's COBOL/JCL/copybook artifacts and automatically generate migration shard specs. Reads all source files, classifies programs, builds dependency graphs, and produces shard spec files under .github/memory/convert-{job}/. Use when: starting a new mainframe job migration, planning conversion work, or re-sharding an existing job."
argument-hint: "Job folder path or job name (e.g., 'existing-mainframe/Mainframe Code Extract/Legacy Data Collection' or 'JOB001')"
---

# Automated Shard Plan Generator

Analyze a mainframe job's source artifacts and generate migration shard specs — the same format used by `/convert-job1` and `/convert-job2`, but created automatically instead of by hand.

## When to Use

- Starting a new mainframe-to-Java migration
- Re-planning an existing migration after scope changes
- Analyzing a mainframe job to estimate conversion complexity

## Inputs

The skill accepts either:
1. **A folder path** under `existing-mainframe/Mainframe Code Extract/` (e.g., `Legacy Data Collection`)
2. **A job name** (e.g., `JOB001`, `JOB002`) — the skill resolves this to the correct folder

## Execution Phases

### Phase 1: Inventory Discovery

Delegate to `@explorer` to gather ALL artifacts in parallel:

**Batch 1 — Job Artifacts:**
- List and read ALL `.CBL` files (COBOL programs) under `Programs/`
- List and read ALL `.CPY` files (copybooks) under `Copybooks/`
- List and read ALL `.CTL` files (control cards) under `ControlCards/`
- List and read ALL `.JCL` files (job control) under `Jobs/`

**Batch 2 — Documentation:**
- Read the job description file under `existing-mainframe/Mainframe Code Extract/Job Descriptions/` (e.g., `JOB001.txt`)
- Read any existing spec/architecture docs under `existing-mainframe/Documentation/`

**Batch 3 — Existing State:**
- Read `.github/memory/migration-status.md` — check if this job already has shard specs or partial implementation
- Read `.github/memory/lessons.md` — learn from past shard creation mistakes
- Read `batch-how-to.md` — understand engine capabilities and step types
- Read `copilot-instructions.md` — understand project conventions

### Phase 2: JCL Analysis

Parse the JCL file to extract:

```
For each JCL step:
  - Step name (e.g., PS005, PS010)
  - Program name (EXEC PGM=...)
  - DD statements (inputs, outputs, control cards)
  - COND codes (step dependencies/skip conditions)
  - PARM values
  - Sort control cards (if SORT step)
```

Build a **step dependency graph** based on file flows:
- Which step produces file X → which step consumes file X
- Which steps read/write the same DB tables
- Conditional execution paths (COND codes)

### Phase 3: Program Classification

For each COBOL program, determine its Java target type:

| Condition | Classification | Reasoning |
|-----------|---------------|-----------|
| Program is SORT/MERGE | `ENGINE` | Handled by engine `beforeJobTasks` or `afterJobTasks` |
| Program is IEFBR14, IDCAMS, IRXJCL | `SKIP` | Mainframe utility with no Java equivalent |
| Single input file → single output file/DB, no nested cursors | `CHUNK Processor` | Fits the standard CHUNK reader/processor/writer pattern |
| Multiple output files | `TASKLET` | Cannot use single CHUNK writer |
| Nested DB cursors (outer + inner loop) | `TASKLET` | JPA cannot hold multiple open cursors in one transaction |
| Multi-file input orchestration | `TASKLET` | Cannot use single CHUNK reader |
| Stored procedure call | `TASKLET` | Stored proc invocation via JDBC |
| JCL DD concatenation (multiple DDs under one name) | `TASKLET` | Multiple inputs under one logical name |
| One input produces >1 output record (one-to-many) | `TASKLET` | CHUNK is one-to-one |

**Verification:** Cross-check classifications against the COBOL PROCEDURE DIVISION to confirm:
- Count output DDs → if >1, must be TASKLET
- Look for nested PERFORM loops with EXEC SQL → likely TASKLET
- Check for CALL sub-programs → note as dependencies

### Phase 4: Model/Entity Discovery

From copybooks and DCLGEN records, identify:
- All DB tables referenced (EXEC SQL statements)
- All file record layouts (FD/01 level entries)
- Field types from PIC clauses → Java type mapping
- Shared copybooks used by multiple programs

Build entity list:
```
For each unique table/file layout:
  - Entity class name (PascalCase from copybook/table name)
  - Source: DCLGEN (DB table) vs FD/COPY (flat file)
  - Fields with Java types
  - Which programs reference this entity
```

### Phase 5: Shard Generation

Generate shards following these rules:

**Shard 0: Foundation** (always first)
- All model/entity classes
- All constants for `BatchConstants.java`
- `@Transient` field definitions for all file layouts
- Structural contract tests for every model
- No processors or tasklets

**Shards 1-N: Business Logic** (grouped by execution phase)
- Group programs by their JCL execution phase (consecutive steps that form a logical unit)
- Target **3-5 Java deliverables per shard** (processors + tasklets)
- Respect dependencies: if program B reads the output of program A, they can be in the same shard (B after A) or B must be in a later shard
- Place SORT/ENGINE steps as `beforeJobTasks` in the same shard as their consumer
- Each shard gets its own YAML job descriptors

**Shard Sizing Heuristic:**

| Complexity | Max deliverables per shard |
|------------|---------------------------|
| Simple CHUNK processors only | 5-6 |
| Mix of CHUNK + TASKLET | 3-4 |
| Complex TASKLET (nested cursors, multi-file) | 1-2 |

**Dependency Rules:**
- Foundation models (shard 0) must complete before any business logic shard
- If shard B's input is shard A's output, B must execute after A
- Shards at the same dependency level CAN run in parallel (in separate worktrees)

### Phase 6: Shard Spec Generation

For each shard, generate a spec file at `.github/memory/convert-{job-id}/shard{N}.md` using this structure:

```markdown
# Shard {N} — {Title} ({JOB-ID})

> **Status:** SPEC READY
> **Prerequisite:** Shard {N-1} DONE (or Shard 0 DONE for non-sequential shards)
> **Implements:** {list of JCL steps → Java targets}
> **Complexity:** {Low|Medium|High|Very High} — {one-line justification}

---

## Objective
{What this shard delivers and why these components are grouped together}

---

## Errata / Critical Notes
{Table of anything ambiguous, surprising, or corrected from the source COBOL}

---

## JCL Steps in Scope
{Table: Step | Program | Type | Description | Java Target}

### {Step} Inputs/Outputs
{Table: DD Name | Dataset/Source | LRECL | Direction}

---

## Copybooks and Control Cards Referenced
{Table listing every .CPY and .CTL file needed for this shard}

---

## Java Deliverables

### Models (if shard 0)
{List of entity classes with source copybook and table name}

### Processors
{For each: class name, package, extends, input/output model, brief logic}

### Tasklets
{For each: class name, package, extends, what it does, DB/file interactions}

### Constants
{New constants to add to BatchConstants.java}

---

## Processing Logic Detail
{For each deliverable: step-by-step business logic mapped from COBOL PROCEDURE DIVISION}

---

## YAML Job Descriptors
{Complete YAML snippets for application.yml}

---

## Test Outline

### {ClassName}Test
{Table: Test Category | Test Case | Expected Result}

### Verification Criteria
- [ ] {Specific checkable assertion}
- [ ] ...
```

### Phase 7: Migration Status Update

Update `.github/memory/migration-status.md`:
- Add shard mapping section for the new job (§16 pattern)
- Add placeholder rows for all COBOL programs in §11
- Add placeholder rows for all copybooks in §12
- Set all statuses to `NOT STARTED`
- Update the Migration Progress Summary

### Phase 8: Output Summary

Report:
```
## Shard Plan: {JOB-ID}

### Inventory
- COBOL programs: {N} ({M} to implement, {K} SORT/ENGINE, {J} SKIP)
- Copybooks: {N}
- Control cards: {N}
- DB tables: {N}

### Java Deliverables (estimated)
- Models/Entities: {N}
- Processors: {N} (CHUNK)
- Tasklets: {N}
- YAML jobs: {N}
- Test classes: {N} (unit) + 1 (integration)

### Shard Breakdown
| Shard | Title | Deliverables | Complexity | Dependencies |
|-------|-------|-------------|------------|-------------|
| 0 | Foundation | {N} models | Medium | None |
| 1 | {title} | {N} classes | {level} | Shard 0 |
| ... | ... | ... | ... | ... |

### Dependency Graph
{Mermaid diagram of shard dependencies}

### Estimated Conversion Order
{Recommended execution sequence with parallelization opportunities}
```

## Quality Gates

Before finalizing shard specs:
- [ ] Every COBOL program in the JCL is accounted for in exactly one shard (or marked SKIP)
- [ ] Every copybook referenced by an in-scope program is listed in its shard spec
- [ ] Every DB table referenced has a corresponding model in shard 0
- [ ] No shard exceeds the sizing heuristic for its complexity level
- [ ] Dependencies form a DAG (no circular dependencies)
- [ ] YAML job FQCNs use correct `com.example.bst.fit` packages (not spec doc packages)
- [ ] All `@Transient` fields named with `In` suffix per project convention

## Known Pitfalls (from lessons.md)

These are real mistakes made during manual shard creation. The automated process must avoid them:

| Pitfall | Prevention |
|---------|-----------|
| Misclassifying TASKLET as Processor | Count output DDs before classifying — >1 output = TASKLET |
| Wrong step ranges in shard specs | Parse JCL directly, don't copy from migration-status placeholders |
| Missing copybooks | Cross-reference every COPY statement in every program's PROCEDURE DIVISION |
| Placeholder deliverable names that don't match COBOL | Derive Java class names from the COBOL program name with project naming conventions |
| EZTNMR programs (no IDENTIFICATION DIVISION) | These are logic descriptions, not compilable COBOL — translate intent, not syntax |
| One-to-many output programs classified as CHUNK | Check if a single input record produces multiple output records |
| FLIMB010.OUT misattributed to wrong step | Verify DD assignments from JCL, not from spec doc assumptions |

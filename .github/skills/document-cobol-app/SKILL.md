---
name: document-cobol-app
description: "Generate comprehensive documentation for a COBOL batch application. Reads all source artifacts (COBOL, JCL, copybooks, control cards, job descriptions) and produces a complete documentation package. Use when: starting a new mainframe job analysis, documenting COBOL applications for migration, or updating existing documentation."
argument-hint: "Application name — directory under existing-mainframe/Mainframe Code Extract/ (e.g., 'Legacy Data Collection')"
---

# COBOL Application Documentation Generator

Generate a complete, migration-ready documentation package for a mainframe COBOL batch application.

## When to Use

- Starting analysis of a new mainframe application before migration
- Documenting COBOL programs, JCL flows, and business rules
- Updating documentation after discovering new artifacts or corrections
- Preparing reference material for `/shard-plan` or `/convert-job`

## Pre-Hook: Validate Source Artifacts

Before generating documentation, verify all required source directories exist:

```powershell
$appName = "{Application Name}"
$base = "existing-mainframe/Mainframe Code Extract/$appName"

# Required directories
$required = @("Programs", "Jobs", "Copybooks")
$optional = @("ControlCards", "Documentation")

foreach ($dir in $required) {
    $path = Join-Path $base $dir
    if (-not (Test-Path $path)) {
        Write-Error "MISSING REQUIRED: $path"
    } else {
        $count = (Get-ChildItem $path -File).Count
        Write-Host "OK: $path ($count files)"
    }
}

foreach ($dir in $optional) {
    $path = Join-Path $base $dir
    if (Test-Path $path) {
        $count = (Get-ChildItem $path -File).Count
        Write-Host "OK: $path ($count files)"
    } else {
        Write-Host "OPTIONAL MISSING: $path (will skip)"
    }
}

# Check job descriptions
$jobDescPath = "existing-mainframe/Mainframe Code Extract/Job Descriptions"
if (Test-Path $jobDescPath) {
    Write-Host "OK: Job Descriptions directory exists"
} else {
    Write-Host "WARNING: No Job Descriptions directory"
}
```

**Gate:** All required directories must exist. If any are missing, STOP and report the issue.

## Main Workflow

### Step 1 — Inventory Source Artifacts

Delegate to `@explorer` to read and inventory all files:

| Artifact Type | Location | Extensions |
|--------------|----------|------------|
| Programs | `<App>/Programs/` | `.CBL`, `.cbl`, `.deps` |
| Jobs/JCL | `<App>/Jobs/` | `.JCL`, `.JOBPROC.JCL`, `.TXT`, `.deps` |
| Control Cards | `<App>/ControlCards/` | `.CTL` |
| Copybooks | `<App>/Copybooks/` | `.CPY` |
| Job Descriptions | `Job Descriptions/` | `.TXT` (named `<JOBNAME>.txt`) |
| Existing Docs | `<App>/Documentation/`, `<App>/` | `.md` |

Build an inventory table:
```
| Type | Count | Files |
|------|-------|-------|
| Programs | N | file1.CBL, file2.CBL, ... |
| Jobs | N | ... |
```

### Step 2 — Generate Program Documentation

Create `PROGRAM_DOCUMENTATION.md` in `<App>/Documentation/`.

For every program, produce sections covering:
- Identification (ID, language, lines, author, date, maintenance history)
- Purpose (2-4 sentence description)
- Key Copybooks (every `COPY` statement)
- DB2 Table References (table, DCLGEN, operations)
- Cursors (name, tables, purpose, predicates)
- SQL Statements (full text, host variables, SQLCODE checks)
- File Definitions (DD, I/O, RECFM, LRECL)
- Record Layouts (field-level: name, PIC, position, length, description)
- Processing Algorithm (paragraph-by-paragraph logic flow)
- Key Business Rules (plain English, code citations, hardcoded values)
- Return Code Logic (RC values and meanings)
- Called/Calling Programs (parameters, return codes)

### Step 3 — Generate JCL Step Documentation

Create `JCL_STEP_DOCUMENTATION.md` covering:
- Job-level configuration and scheduling
- Step decomposition table
- Pipeline identification
- Step dependency graph
- Conditional execution logic
- Restart/rerun instructions

### Step 4 — Generate Control Card Documentation

Create `CONTROL_CARD_ANALYSIS.md` covering:
- Control card inventory
- Per-card analysis (sort keys, filters, reformatting)
- Hardcoded values flagged

### Step 5 — Generate Data Structure Documentation

Create `DATA_STRUCTURES.md` covering:
- DB2 table inventory and CRUD matrix
- Host variable mapping
- Flat file inventory
- Record layout cross-reference
- Copybook inventory
- External input file catalog

### Step 6 — Generate Business Rules Documentation

Create `BUSINESS_RULES.md` covering:
- Rule inventory table
- Categorized rules (Eligibility, Fee Calculation, Aggregation, Hierarchy, Date/Calendar, Validation, Code Transformations, Priority/Override, Error Handling, Output Formatting, Suppression, Idempotency)
- Per-rule detail (implementation, inputs, outputs, hardcoded values, ambiguities)

### Step 7 — Generate Data Flow Documentation

Create `DATA_FLOW.md` covering:
- End-to-end textual flow diagrams
- Per-output data lineage

### Step 8 — Generate Error Handling Documentation

Create `ERROR_HANDLING.md` covering:
- Return code matrix
- ABEND code inventory
- Error file inventory
- Checkpoint/restart mechanisms
- Email/notification inventory

### Step 9 — Verify Completeness

Confirm documentation covers:
- [ ] Every program in Programs/
- [ ] Every JCL step
- [ ] Every control card mapped to its step
- [ ] Every copybook listed with using programs
- [ ] Every DB2 table in CRUD matrix
- [ ] Every file DD in flat file inventory
- [ ] Every CALL statement documented
- [ ] Every business rule extracted and categorized
- [ ] No unexplained magic numbers
- [ ] Record layouts map to sort card positions
- [ ] Maintenance history captured
- [ ] Error handling documented for every program

### Step 10 — Create Documentation Index

Create `README.md` as the entry point with:
- Application summary
- Inventory at-a-glance table
- Documentation guide with links to each deliverable
- Key cross-references
- Open items / SME review summary
- Source artifact listing

## Post-Hook: Validate Deliverables

After generation, verify all required files exist and are non-empty:

```powershell
$docDir = "existing-mainframe/Documentation/{Application Name}"
$required = @(
    "README.md",
    "PROGRAM_DOCUMENTATION.md",
    "JCL_STEP_DOCUMENTATION.md",
    "CONTROL_CARD_ANALYSIS.md",
    "DATA_STRUCTURES.md",
    "BUSINESS_RULES.md",
    "DATA_FLOW.md",
    "ERROR_HANDLING.md"
)

$missing = @()
$empty = @()

foreach ($file in $required) {
    $path = Join-Path $docDir $file
    if (-not (Test-Path $path)) {
        $missing += $file
    } elseif ((Get-Item $path).Length -eq 0) {
        $empty += $file
    }
}

if ($missing.Count -gt 0) { Write-Error "MISSING: $($missing -join ', ')" }
if ($empty.Count -gt 0) { Write-Error "EMPTY: $($empty -join ', ')" }
if ($missing.Count -eq 0 -and $empty.Count -eq 0) { Write-Host "ALL DELIVERABLES VERIFIED" }
```

**Gate:** All 8 deliverables must exist and be non-empty. If any are missing, report and attempt to generate.

## Post-Hook: Summarize SME Review Items

Scan all generated documentation files for `⚠️ SME REVIEW` or `SME REVIEW NEEDED` markers:

```powershell
Select-String -Path "$docDir\*.md" -Pattern "SME REVIEW" | ForEach-Object {
    "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())"
}
```

Report the count and list of items requiring SME review.

## Integration

- Run `/document-cobol-app` before `/shard-plan` to ensure documentation exists
- The `@documenter` agent uses this skill as its primary workflow
- Documentation produced here feeds into migration planning and spec generation
- The `/lessons search` skill can reference documentation for past COBOL patterns
- After documentation, run `/lessons check` to capture any learned patterns

## Example Invocation

```
/document-cobol-app "Legacy Data Collection"
/document-cobol-app "Legacy Fee Aggregation"
```

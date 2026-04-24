# Prompt: COBOL Application Documentation — Comprehensive Code, Business Rules & Data Structure Analysis

**Objective:** Perform a deep analysis of a COBOL batch application and produce a comprehensive documentation package covering every program, business rule, data structure, DB2 interaction, file layout, and operational pattern. The output should be detailed enough for a developer unfamiliar with the codebase to understand, maintain, or migrate the application.

### Key Assumptions

> **External Data File Availability:** Any data files that are **not** produced by programs
> within the application being documented should be assumed to be **pre-staged in a
> designated input folder** before execution. Document their expected record layouts,
> source systems, and refresh frequency, but do not model their production. Focus the
> analysis on what the application _does_ with these files, not where they come from.
>
> **Scope Boundary:** Only analyze programs, JCL, control cards, and copybooks within the
> specified directories. If shared utility programs exist in other applications, document
> the calling interface (parameters in, parameters out, return codes) but do not analyze
> the utility's internal implementation unless its source is provided.

---

## Step 1 — Read All Source Artifacts

Read every file in the application's directory structure. Do not skip any file.

### Programs
Read all `.CBL` (COBOL), `.cbl`, and `.deps` files in:
`Mainframe Code Extract/<Application Name>/Programs/`

For each program, note the language (COBOL, Easytrieve, Assembler) based on source syntax.

### Jobs / JCL
Read all files in:
`Mainframe Code Extract/<Application Name>/Jobs/`

This includes:
- Main JCL (`.JCL`) and JCL procedures (`.JOBPROC.JCL`)
- Text documentation (`.TXT`) describing step purposes
- Dependency files (`.deps`)

### Control Cards
Read all `.CTL` files in:
`Mainframe Code Extract/<Application Name>/ControlCards/`

### Copybooks
Read all `.CPY` files in:
`Mainframe Code Extract/<Application Name>/Copybooks/`

### Job Descriptions
Read the corresponding `.TXT` file in:
`Mainframe Code Extract/Job Descriptions/`

These are operations-authored job documentation files (one per job, named `<JOBNAME>.txt`). They contain critical context not present in the JCL or source code:
- Step inventory with program names and one-line purpose descriptions
- Predecessor / successor job dependencies and scheduling rules
- Per-step restart and recovery instructions (including GDG overrides)
- DB2 tables affected
- Change history (date, author, description)
- Application name, Remedy group, and on-call information

Use this information to cross-validate the JCL step decomposition in Step 3, populate scheduling and dependency details, and enrich the error handling / restart documentation in Step 8.

### Existing Documentation
Read any `.md` files already present in:
`Mainframe Code Extract/<Application Name>/`

Use these as context — they may contain prior analysis, partial documentation, or migration notes.

---

## Step 2 — Produce Program Documentation

Create a file named `PROGRAM_DOCUMENTATION.md` in:
`existing-mainframe/Documentation/<Application Name>/`

> **Output Directory:** All documentation files produced by this prompt must be placed in
> `existing-mainframe/Documentation/<Application Name>/`. Create this directory if it
> does not already exist. Do **not** place output files in `Programs/`, `Jobs/`, or the
> application root.

### 2.1 — System Overview

Provide a system-level summary table:

| Attribute | Value |
|-----------|-------|
| **System** | _(e.g., Brokerage — Flexible Commission / IM Billing)_ |
| **Subsystem** | _(application name)_ |
| **Platform** | _(e.g., IBM Mainframe COBOL II / DB2, MVS Batch)_ |
| **Central DB2 Tables** | _(list primary tables with DCLGEN copybook names)_ |
| **Repository** | _(repo name)_ |

### 2.2 — Program Index

Provide a master index table of all programs:

| # | Program | Language | Lines | Purpose | DB2 Access |
|---|---------|----------|-------|---------|------------|
| 1 | _name_ | COBOL/Easytrieve/ASM | _count_ | _one-line summary_ | Direct SQL / Via API / None |

### 2.3 — Per-Program Documentation

For **every** program (not just COBOL — include Easytrieve and Assembler), produce a section with the following subsections. Adapt the level of detail to the program's complexity.

#### Identification

| Field | Value |
|-------|-------|
| **Program ID** | _(program name)_ |
| **Language** | _(COBOL / Easytrieve / Assembler)_ |
| **Lines** | _(line count)_ |
| **Author** | _(from program header, if available)_ |
| **Date Written** | _(from program header, if available)_ |
| **Maintenance History** | _(list change IDs, dates, and descriptions from comments)_ |
| **Restart** | _(checkpoint/restart mechanism or "None")_ |

#### Purpose

A 2–4 sentence description of what the program does, what it reads, what it writes, and why it exists in the processing pipeline.

#### Key Copybooks

| Copybook | Description |
|----------|-------------|
| _name_ | _what it defines (DCLGEN, record layout, API interface, etc.)_ |

List every `COPY` statement found in the program.

#### DB2 Table References

| Table | DCLGEN Copybook | Operations (SELECT/INSERT/UPDATE/DELETE) |
|-------|----------------|------------------------------------------|

For each table, indicate whether access is **direct SQL** or **via an API program** (e.g., `FLDIMD10`).

#### Cursors

If the program defines DB2 cursors:

| Cursor Name | Table(s) | Purpose | Key Predicates |
|-------------|----------|---------|----------------|

Include the driving WHERE clause predicates. If the full SQL is visible in the source, reproduce it. If it's constructed dynamically or parameterized, note the host variables.

#### SQL Statements

Reproduce key SQL statements (SELECT, INSERT, UPDATE, DELETE) found in the program. Include:
- The full SQL text
- Host variables referenced
- SQLCODE checks performed after execution

#### File Definitions

| DD Name | I/O | RECFM | LRECL | Description |
|---------|-----|-------|-------|-------------|
| _name_ | Input/Output | FB/VB/etc. | _length_ | _purpose_ |

Include every `SELECT ... ASSIGN TO` (COBOL) or `FILE` (Easytrieve) definition.

#### Record Layouts

For each file, document the record layout either by:
1. **Referencing the copybook** that defines the layout, or
2. **Extracting field definitions** directly from WORKING-STORAGE or the copybook

Provide the field-level detail as a table:

| Field Name | PIC Clause | Position | Length | Description |
|------------|-----------|----------|--------|-------------|
| _name_ | _PIC X(7)_ | 1–7 | 7 | _business meaning_ |

For REDEFINES structures, show each variant separately with the discriminator field identified.

#### Processing Algorithm

Document the program's logic flow using paragraph/section names from the source:

1. **_paragraph-name_** — What it does (2–3 sentences)
   - Sub-steps, loops, conditional branches
   - Key data transformations
   - Error handling paths

Follow the actual COBOL PERFORM structure. Use paragraph names exactly as they appear in the source.

#### Key Business Rules

Extract every business rule embedded in the code. For each rule:
- State the rule in plain English
- Cite the paragraph or line range where it's implemented
- Note any hardcoded values, threshold constants, or magic numbers
- Flag rules that are uncommented or ambiguous

Format as a bulleted list:
- **Rule name/summary:** Description. _(paragraph-name, lines N–M)_

#### Condition Code / Return Code Logic

| Return Code | Meaning | Set By |
|-------------|---------|--------|
| 0 | Normal completion | _paragraph_ |
| 4 | Warning / no data | _paragraph_ |
| 8+ | Error conditions | _paragraph_ |

#### Called Programs (CALL Statements)

| Program | Purpose | Parameters In | Parameters Out |
|---------|---------|--------------|----------------|
| _name_ | _what it does_ | _LINKAGE SECTION fields_ | _return codes, output fields_ |

#### Calling Programs (Called BY)

If determinable from the codebase, list which programs call this one.

---

## Step 3 — Produce JCL Step Documentation

Create or update documentation covering the complete JCL job flow.

### 3.1 — Job-Level Configuration

Document:
- Job name, class, MSGCLASS, REGION
- JOBLIB / STEPLIB libraries
- Key symbolic parameters and their default values
- Scheduling information (CA-7, TWS, or other scheduler details from `.TXT` files)

### 3.2 — Step Decomposition Table

| Step | Program | Purpose | COND/IF Logic | Inputs (DD) | Outputs (DD) | Control Card |
|------|---------|---------|---------------|-------------|--------------|--------------|

For every JCL step, document:
- Step name (e.g., PS001, PS010)
- Program executed
- Purpose (one line)
- Conditional execution logic (COND parameter or IF-THEN-ELSE)
- All input DD statements with dataset names
- All output DD statements with dataset names
- Control card reference (if SORT/ICETOOL/IDCAMS)

### 3.3 — Pipeline Identification

Group steps into logical pipelines and document:

| # | Pipeline Name | Steps | Description | Can Run in Parallel? |
|---|--------------|-------|-------------|---------------------|

### 3.4 — Step Dependency Graph

Document which steps produce output consumed by later steps:

| Producer Step | Output Dataset | Consumer Step | Input DD |
|--------------|----------------|--------------|----------|

### 3.5 — Conditional Execution Logic

For each IF-THEN-ELSE block or complex COND chain, document:
- The condition being tested (return code, file existence, etc.)
- The True path (which steps execute)
- The False path (which steps execute or are skipped)
- The business meaning of the condition

---

## Step 4 — Produce Control Card Documentation

### 4.1 — Control Card Inventory

| Control Card | Type | Consuming Step | Purpose |
|-------------|------|---------------|---------|
| _name.CTL_ | DFSORT/ICETOOL/IDCAMS/Email/DB2 Plan | _step_ | _one-line summary_ |

### 4.2 — Per-Card Analysis

For each DFSORT/ICETOOL control card:

**Sort Keys:**
| Position | Length | Format | Direction | Field Name (if known) |
|----------|--------|--------|-----------|----------------------|

**INCLUDE/OMIT Conditions:**
- Document each condition in plain English
- Map positional references to field names where possible

**OUTREC / OUTFIL Reformatting:**
- Document field transformations, builds, and padding
- Note any hardcoded literals or constants

**Hardcoded Values / Magic Numbers:**
- List any unexplained constants with positions and values

---

## Step 5 — Produce Data Structure Documentation

### 5.1 — DB2 Table Inventory

| Table | Schema | DCLGEN Copybook | Programs | CRUD |
|-------|--------|----------------|----------|------|

For each table, provide:
- Column inventory (from DCLGEN copybook)
- Primary key / index columns (if determinable)
- Relationships to other tables

### 5.2 — DB2 CRUD Matrix

| Table | Program 1 | Program 2 | Program 3 | ... |
|-------|-----------|-----------|-----------|-----|

Use `C` (Create/INSERT), `R` (Read/SELECT), `U` (Update), `D` (Delete) for each cell.

### 5.3 — Host Variable Mapping

For key tables, map COBOL host variables to DB2 columns:

| COBOL Host Variable | PIC Clause | DB2 Column | DB2 Type | Notes |
|---------------------|-----------|------------|----------|-------|

### 5.4 — Flat File Inventory

| File (DD Name) | DSN Pattern | RECFM | LRECL | Producer | Consumer | Layout Copybook |
|----------------|-------------|-------|-------|----------|----------|----------------|

### 5.5 — Record Layout Cross-Reference

For each unique record layout, provide the complete field mapping:

| Field | PIC | Offset | Length | Description |
|-------|-----|--------|--------|-------------|

Map sort card positional references back to these layouts so every `SORT FIELDS=(pos,len,fmt,dir)` can be understood by field name.

### 5.6 — Copybook Inventory

| Copybook | Type | Description | Used By |
|----------|------|-------------|---------|
| _name_ | DCLGEN / Record Layout / API Interface / Constants / Error Handling | _description_ | _program list_ |

### 5.7 — External Input File Catalog

Per the pre-staging assumption, list all files not produced within this application:

| File | Source System | RECFM/LRECL | Layout Copybook | Refresh Frequency | Notes |
|------|-------------|-------------|----------------|--------------------|-------|

---

## Step 6 — Produce Business Rules Documentation

Create a dedicated section (or standalone document) organizing all extracted business rules by category.

### 6.1 — Rule Inventory Table

| # | Rule Name | Category | Program | Paragraph | Lines | Documented in Source? |
|---|-----------|----------|---------|-----------|-------|-----------------------|
| 1 | _short name_ | _category_ | _program_ | _paragraph_ | _N–M_ | Yes / Partial / No |

### 6.2 — Categories

Organize rules into these categories (add others as needed):

| Category | What to Extract |
|----------|----------------|
| **Eligibility / Enrollment** | Who qualifies? Enrollment codes, status checks, opt-in/opt-out logic |
| **Fee Calculation** | How are fees computed? Rate tables, tiers, minimums, maximums |
| **Fee Aggregation** | How are detail amounts rolled up? Grouping keys, SUM vs. average |
| **Account Hierarchy** | Master/sub/household relationships, consolidation logic |
| **Date / Calendar** | Billing periods, business day calculations, holiday handling |
| **Validation / Filtering** | What records are accepted, rejected, or skipped? |
| **Code Transformations** | Status codes, action codes, type codes, and their mappings |
| **Priority / Override** | Which rule wins when multiple apply? Cascade order |
| **Error Handling** | What constitutes an error? How is it handled? |
| **Output Formatting** | Report layout rules, CSV formatting, header/footer generation |
| **Suppression** | What causes records/reports to be suppressed? |
| **Idempotency / Rerun** | Can the job be rerun safely? What prevents duplicates? |

### 6.3 — Per-Rule Detail

For each significant rule, provide:

**Rule:** _(plain English statement of the rule)_

**Implementation:**
- Program: _name_, Paragraph: _paragraph-name_, Lines: _N–M_
- Code summary: _(what the COBOL does)_

**Inputs:** _(fields, tables, or files that drive the decision)_

**Outputs:** _(what changes as a result — field values, file writes, return codes)_

**Hardcoded Values:** _(any magic numbers, thresholds, or constants)_

**Ambiguities:** _(anything unclear, uncommented, or potentially incorrect)_

---

## Step 7 — Produce Data Flow Documentation

### 7.1 — End-to-End Data Flow

Document the complete data flow from inputs through processing to outputs. Use a textual flow diagram:

```
Input Files / DB2 Tables
        ↓
   [Step 1: Program A]
        ↓
   Intermediate File 1
        ↓
   [Step 2: SORT]
        ↓
   Sorted File
        ↓
   [Step 3: Program B]
        ↓
   Output Files / DB2 Updates
```

### 7.2 — Data Lineage per Output

For each final output file or DB2 update, trace the lineage backward:
- Which step produces it?
- Which inputs feed that step?
- What transformations are applied?
- What fields in the output come from which fields in the input?

---

## Step 8 — Produce Error Handling & Operations Documentation

### 8.1 — Return Code Matrix

| Program | RC=0 | RC=4 | RC=8 | RC=11 | RC=12 | RC=16 |
|---------|------|------|------|-------|-------|-------|
| _name_ | _meaning_ | _meaning_ | _meaning_ | _meaning_ | _meaning_ | _meaning_ |

### 8.2 — ABEND Code Inventory

| Code | Program | Paragraph | Meaning | Recovery |
|------|---------|-----------|---------|----------|
| _code_ | _name_ | _paragraph_ | _what went wrong_ | _how to recover_ |

### 8.3 — Error File Inventory

| Error File (DD) | LRECL | Layout | Producer | Consumer | Content |
|----------------|-------|--------|----------|----------|---------|
| _name_ | _len_ | _copybook_ | _program_ | _who reviews it_ | _what errors_ |

### 8.4 — Checkpoint / Restart

For each program with restart capability:
- Checkpoint mechanism (BIDRST10, custom, inline COMMIT)
- Restart table / fields
- Manual restart procedure (from JCL `.TXT` documentation)

### 8.5 — Email / Notification Inventory

| Trigger | Step | Recipient | Subject/Content | Control Card |
|---------|------|-----------|-----------------|-------------|

---

## Step 9 — Verify Completeness

Before finalizing, confirm:

- [ ] **Every program** in the Programs directory has a documentation section
- [ ] **Every JCL step** is mapped in the step decomposition table
- [ ] **Every control card** is mapped to its consuming step with sort keys documented
- [ ] **Every copybook** is listed with its using programs
- [ ] **Every DB2 table** is in the CRUD matrix
- [ ] **Every file DD** is in the flat file inventory
- [ ] **Every CALL statement** is documented with parameters
- [ ] **Every business rule** is extracted and categorized
- [ ] **No magic numbers** remain unexplained (or are flagged as needing SME input)
- [ ] **Record layouts** map sort card positions to field names
- [ ] **Maintenance history** (change IDs from program headers) is captured
- [ ] **Error handling** is documented for every program

---

## Step 10 — Create Documentation Index

Create a file named `README.md` in:
`existing-mainframe/Documentation/<Application Name>/`

This file serves as the **entry point** for anyone exploring the documentation. It should orient the reader, summarize what was documented, and link to every deliverable.

### 10.1 — Header

```
# <Application Name> — Documentation Index

> Auto-generated documentation package for the **<Application Name>** mainframe batch application.
> Produced by the COBOL Application Documentation Prompt.
```

### 10.2 — Application Summary

Provide a concise (3–5 sentence) overview of what the application does, drawn from the System Overview in PROGRAM_DOCUMENTATION.md. Include:
- Business purpose
- Key inputs and outputs
- Execution context (batch job name, scheduler, frequency if known)

### 10.3 — Inventory At-a-Glance

A quick-reference table summarizing what was analyzed:

| Artifact | Count |
|----------|-------|
| Programs | _N_ (breakdown by language: _X_ COBOL, _Y_ Easytrieve, _Z_ Assembler) |
| JCL Steps | _N_ |
| Control Cards | _N_ |
| Copybooks | _N_ |
| DB2 Tables/Views | _N_ |
| Flat Files | _N_ |
| Business Rules | _N_ categories, _M_ total rules |
| Email Notifications | _N_ |

### 10.4 — Documentation Guide

A table linking to each deliverable with a description of what it contains and when to consult it:

| Document | Purpose | Start Here When… |
|----------|---------|-------------------|
| [PROGRAM_DOCUMENTATION.md](PROGRAM_DOCUMENTATION.md) | Detailed analysis of every program: purpose, logic, copybooks, DB2 access, file I/O, business rules, calls | You need to understand what a specific program does or how it processes data |
| [JCL_STEP_DOCUMENTATION.md](JCL_STEP_DOCUMENTATION.md) | Complete JCL job flow: step decomposition, pipelines, dependencies, conditional logic, restart/rerun | You need to understand execution order, step dependencies, or how to restart after a failure |
| [CONTROL_CARD_ANALYSIS.md](CONTROL_CARD_ANALYSIS.md) | Analysis of every control card: sort keys, INCLUDE/OMIT filters, reformatting rules, field-position mapping | You need to understand a SORT/ICETOOL step or decode positional references |
| [DATA_STRUCTURES.md](DATA_STRUCTURES.md) | DB2 tables, CRUD matrix, host variables, flat file inventory, record layouts, copybook catalog | You need to understand data storage, file formats, or find which programs use a table |
| [BUSINESS_RULES.md](BUSINESS_RULES.md) | All business rules categorized and cross-referenced: eligibility, fees, validation, hierarchy, calendar | You need to understand _why_ the code does something, not just _what_ it does |
| [DATA_FLOW.md](DATA_FLOW.md) | End-to-end data flow diagrams, per-output data lineage, record-size progression | You need to trace data from input to output or understand how files feed through the pipeline |
| [ERROR_HANDLING.md](ERROR_HANDLING.md) | Return codes, ABENDs, error files, checkpoint/restart, email notifications, recovery procedures | You're troubleshooting a failure, planning operations, or need restart instructions |

### 10.5 — Key Cross-References

Provide a short list of the most common cross-document lookups:

- **"What does step PSxxx do?"** → JCL_STEP_DOCUMENTATION.md § Step Decomposition Table
- **"What program runs in that step?"** → JCL_STEP_DOCUMENTATION.md → then PROGRAM_DOCUMENTATION.md § for that program
- **"What does this sort card do?"** → CONTROL_CARD_ANALYSIS.md → field positions map to DATA_STRUCTURES.md § Record Layouts
- **"Which programs touch table X?"** → DATA_STRUCTURES.md § CRUD Matrix
- **"Why was this record filtered out?"** → BUSINESS_RULES.md § Validation / Filtering category
- **"The job failed — what do I do?"** → ERROR_HANDLING.md § Return Code Matrix → § Restart Instructions

### 10.6 — Open Items / SME Review

If BUSINESS_RULES.md contains an "Ambiguities / SME Review Items" section, reproduce or summarize those items here so they are visible from the index.

### 10.7 — Source Artifacts

List the source directories that were analyzed:

```
Mainframe Code Extract/<Application Name>/
├── Programs/          ← _N_ source files
├── Jobs/              ← JCL and job procedures
├── ControlCards/      ← _N_ control cards (.CTL)
├── Copybooks/         ← _N_ copybooks (.CPY)
└── Documentation/     ← This documentation package
```

---

## Output Checklist

All output files are placed in `existing-mainframe/Documentation/<Application Name>/`.

| Deliverable | Filename | Required |
|-------------|----------|----------|
| Documentation index | `README.md` | ✅ |
| Program documentation | `PROGRAM_DOCUMENTATION.md` | ✅ |
| JCL step documentation | `JCL_STEP_DOCUMENTATION.md` (or embedded) | ✅ |
| Control card analysis | `CONTROL_CARD_ANALYSIS.md` (or embedded) | ✅ |
| Business rules inventory | `BUSINESS_RULES.md` (or embedded) | ✅ |
| Data flow diagram | `DATA_FLOW.md` (or embedded) | ✅ |
| DB2 CRUD matrix | `DB2_CRUD_MATRIX.md` (or embedded) | ✅ |
| Flat file inventory | `FILE_INVENTORY.md` (or embedded) | ✅ |
| Copybook inventory | `COPYBOOK_INVENTORY.md` (or embedded) | ✅ |
| Error handling matrix | `ERROR_HANDLING.md` (or embedded) | ✅ |

> **Note:** For large applications (20+ programs), it may be necessary to produce
> documentation incrementally. Prioritize programs in order of: (1) line count
> descending (largest programs have the most business logic), (2) programs with DB2
> access (highest migration complexity), (3) programs called by multiple others
> (shared utilities), (4) remaining programs.

---

## Quality Standards

The documentation must meet these standards:

1. **Traceable:** Every statement references specific paragraphs, line ranges, or copybooks
2. **Complete:** No program, step, file, or table is undocumented
3. **Accurate:** Business rules match the actual COBOL logic, not assumptions
4. **Actionable:** A developer could implement the same logic in another language from this documentation alone
5. **Honest about gaps:** Where the code is ambiguous, uncommented, or uses magic numbers, say so explicitly and flag it for SME review rather than guessing

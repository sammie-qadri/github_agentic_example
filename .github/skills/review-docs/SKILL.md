---
name: review-docs
description: "Review a Documentation folder for a mainframe code extract and generate a navigable HTML WIKI with TL;DRs, pitfalls, Mermaid diagrams, data flow charts, open TODOs, and SME/HITL decision logs. Use when: you want a persistent, navigable HTML WIKI output. For a quick chat-based findings summary (TODOs + SME/HITL), use @document-reviewer directly instead."
argument-hint: "Path to Documentation folder (e.g., 'existing-mainframe/Documentation/Legacy Migration' or 'existing-mainframe/Documentation/Legacy Fee Aggregation')"
---

# Documentation Review & WIKI Generation

Review all documentation in a target folder and generate a navigable HTML WIKI that surfaces TL;DRs, pitfalls, diagrams, TODOs, and SME decision items.

## When to Use

- After `/document-cobol-app` generates documentation — review it for completeness and create a human-friendly WIKI
- Before a migration shard — audit the existing docs for gaps and open items
- When preparing an SME review package
- When onboarding new team members who need a quick overview of documentation state
- Any time you need a navigable, searchable summary of a documentation folder

## Quick Findings vs Full WIKI — Which to Use?

| Need | Recommended Approach |
|------|---------------------|
| "What are the TODOs in this doc folder?" | Use **`@document-reviewer`** directly — produces a markdown findings table in chat |
| "What SME decisions are still needed?" | Use **`@document-reviewer`** directly — Quick Findings Mode |
| "Give me a persistent, navigable WIKI" | Use **`/review-docs`** (this skill) — generates HTML files |
| "Generate a WIKI for an SME review package" | Use **`/review-docs`** (this skill) |
| "Update an existing WIKI with a new program" | Use **`/review-docs`** (this skill) |

> **Tip:** `@document-reviewer` Quick Findings Mode is the faster option — no HTML files created, results appear directly in chat. Use `/review-docs` when you need a sharable, file-based WIKI that persists across sessions.

## Invocation

```
/review-docs "existing-mainframe/Documentation/Legacy Migration"
/review-docs "existing-mainframe/Documentation/Legacy Fee Aggregation"
```

## Pre-Hook: Validate Documentation Folder

```powershell
$docPath = "{Documentation Path}"

if (-not (Test-Path $docPath)) {
    Write-Error "Documentation folder not found: $docPath"
    exit 1
}

$files = Get-ChildItem -Path $docPath -File -Recurse | Where-Object { $_.Extension -in @('.md', '.txt', '.csv') }
$count = $files.Count

if ($count -eq 0) {
    Write-Error "No documentation files found in: $docPath"
    exit 1
}

Write-Host "Found $count documentation files in $docPath"
$files | ForEach-Object { Write-Host "  - $($_.Name) ($([math]::Round($_.Length / 1KB, 1)) KB)" }
```

**Gate:** At least one documentation file must exist. If none found, STOP and report.

## Main Workflow

### Phase 1 — Inventory & Read

1. Delegate to `@explorer` to list all files in the target Documentation folder (recursive).
2. Read every `.md`, `.txt`, and `.csv` file.
3. Build an inventory table:

```
| # | File | Type | Size | Sections | Mermaid Blocks | TODOs | SME Items |
|---|------|------|------|----------|----------------|-------|-----------|
| 1 | README.md | md | 5.2 KB | 8 | 0 | 2 | 1 |
| 2 | BUSINESS_RULES.md | md | 42 KB | 15 | 0 | 5 | 8 |
...
```

### Phase 2 — Extract & Analyze

For each document, extract the following categories. Use regex patterns and markdown parsing.

#### 2a. TL;DR Summary
- Read the first section (usually `# Title` + first paragraph)
- Extract any explicit "Overview", "Purpose", "Summary" sections
- Produce a 2-4 sentence summary capturing: what the doc covers, its scope, and key takeaway

#### 2b. Pitfalls & Gotchas
Scan for markers and patterns:
- Explicit: `⚠️`, `WARNING`, `CAUTION`, `PITFALL`, `GOTCHA`, `NOTE:`, `IMPORTANT:`
- Implicit: sentences containing "careful", "watch out", "must not", "do not", "avoid", "beware", "tricky", "subtle"
- Errata sections, review findings, correction notes
- Hardcoded values or magic numbers mentioned
- DB2 vs SQL Server differences noted
- COBOL-to-Java mapping caveats

For each pitfall, capture:
- Source file and section
- The pitfall text
- Severity: `critical` | `important` | `info`

#### 2c. Mermaid Diagrams
- Extract all ` ```mermaid ` fenced code blocks
- Capture the diagram type (flowchart, sequenceDiagram, classDiagram, stateDiagram, erDiagram, gantt, journey, graph)
- Capture surrounding context (heading, description)
- Assign a slug ID for linking

#### 2d. Data Flow Charts
- Extract sections titled "Data Flow", "Data Lineage", "Pipeline", "Input/Output"
- Extract any tables mapping inputs → transformations → outputs
- Look for file → step → table relationships
- If described textually but not diagrammed, generate a Mermaid flowchart

#### 2e. Open TODOs & Action Items
Scan for these patterns (case-insensitive):
- `TODO`, `FIXME`, `HACK`, `XXX`, `TEMP`, `PLACEHOLDER`
- `[ ]` (unchecked checkboxes)
- "needs to be", "not yet implemented", "pending", "deferred", "will be added"

For each item, capture:
- Source file, line context
- The TODO text
- Severity: `blocking` | `deferred` | `nice-to-have`

#### 2f. SME/HITL Decision Log
Scan for these patterns:
- `SME`, `HITL`, `REVIEW NEEDED`, `SME REVIEW`, `DECISION`, `TBD`, `OPEN QUESTION`
- `ASSUMPTION`, `ASSUMED`, `UNRESOLVED`, `NEEDS CLARIFICATION`
- `⚠️ SME REVIEW NEEDED` (the project's standard marker)

For each item, capture:
- Source file and section
- Full context paragraph
- Status: `resolved` | `unresolved` | `assumed`
- Category: `business-rule` | `data-mapping` | `architecture` | `process` | `other`

#### 2g. Business Rules
- Extract from BUSINESS_RULES.md if present
- Also scan all docs for "rule", "business rule", "requirement", "criteria"
- Capture: rule name, description, status, source

#### 2h. Cross-References
- Extract all markdown links `[text](target)`
- Check if targets exist (identify broken links)
- Build a reference graph: which docs link to which
- Identify isolated docs (no incoming or outgoing links)

#### 2i. Conversion Readiness — Spring Batch Migration TODOs

Review every documented program, JCL step, file I/O, business rule, and stored procedure call through the lens of **"What decisions must be made to convert this to a Spring Batch job using batch-engine?"**. Use `batch-how-to.md` as the authoritative reference.

Scan for these conversion-blocking patterns:

| Category | Tag | Pattern to Detect |
|----------|-----|-------------------|
| Step Classification | `STEP-CLASS` | Programs with multi-cursor logic (CHUNK vs TASKLET unclear), programs doing both file I/O and DB I/O |
| Entity/Model Mapping | `ENTITY-MAP` | Tables with unknown column types, copybooks not in extract, byte range discrepancies |
| Stored Procedure Migration | `STORED-PROC` | DB2 EXEC SQL CALL statements, embedded SQL that needs conversion to SQL Server |
| Business Rule Ambiguity | `BIZ-RULE` | Hardcoded values without explanation, 88-level conditions with unclear business meaning |
| File Format Decisions | `FILE-FORMAT` | Files with unknown RECFM/LRECL, mixed format files, header/trailer detection needed |
| Sort/Merge Elimination | `SORT-ELIM` | JCL SORT steps that need Java equivalents, multi-key sorts, conditional INCLUDE/OMIT |
| Control Card Translation | `CTRL-CARD` | Control cards (.CTL) referenced but not in extract, OUTFIL multi-output logic |
| Cross-Job Dependencies | `CROSS-JOB` | GDG datasets consumed from other jobs, trigger files, scheduling dependencies |
| Error Handling Strategy | `ERROR-STRAT` | Uncommon return codes, commented-out ABEND calls, no checkpoint/restart logic |
| Missing Artifacts | `MISSING-ART` | COPY books not extracted, called programs not in extract, PDS members referenced without source |

For each item, capture:
- Category tag
- Severity: `CRITICAL` (blocks conversion) | `HIGH` (requires SME before coding) | `MEDIUM` (proceed with assumptions) | `LOW` (nice-to-have)
- Description of what needs to be decided/verified
- The specific program, step, or file affected
- Source document and section
- What conversion work this blocks (YAML job def, processor, tasklet, model, etc.)

These items are surfaced on the **todos.html** page in a dedicated "Conversion Readiness" section with category badges and severity indicators.

### Phase 3 — Generate HTML WIKI

#### Canonical Page Structure (MANDATORY — consistency across all programs is required)

Every program MUST produce identical page structure. Inconsistency between programs is a defect.

**index.html** (Program Landing Page):
1. `<section id="quick-stats">` — Stats grid (documents, business rules, SME items, pitfalls, diagrams)
2. `<section id="critical-items">` — Top 5-8 SME/HITL items using `.card.card-sme` divs with severity badges
3. `<section id="doc-index">` — Source Documents table with numbered rows + markdown source links
- **NO "WIKI Pages" or "key-links" navigation card sections** — the dynamic sidebar handles page navigation

**summary.html**: Cards with `.card-tldr` class, one per source document, each with 2-4 sentence summary + source link

**pitfalls.html**: Grouped by severity (Critical → Important → Info) using `<details>`, items use `.card-pitfall`

**data-flows.html**: Mermaid diagrams via `<pre class="mermaid">`, CDN script in `<head>` only on this page

**todos.html**: Existing TODOs section + `<section id="conversion-readiness">` with stats grid + `<details>` per category (TODO-C### numbering)

**decisions.html**: Grouped by source document using `<details>`, items use `.card-sme` with resolved/unresolved badges

**business-rules.html**: Summary stats + rules grouped by category using `<details>`, implementation status indicators

**cross-references.html**: Program/JCL/control card/DB2 inventory tables, inter-document reference map

The WIKI uses a **multi-program expandable architecture**. Each `/review-docs` invocation adds a program section to the shared WIKI. Programs are registered in `assets/manifest.js` (a JS file that sets `window.WIKI_MANIFEST`) and the sidebar is built dynamically. Using a JS file instead of JSON avoids CORS issues when opening the WIKI via `file://` protocol.

#### Directory Structure

```
docs-wiki/
├── index.html                          # Master landing page (all programs)
├── assets/
│   ├── styles.css                      # Shared stylesheet
│   ├── manifest.js                     # Program registry (sets window.WIKI_MANIFEST)
│   └── nav.js                          # Dynamic sidebar builder (reads WIKI_MANIFEST)
├── {program-slug}/                     # One folder per program
│   ├── index.html                      # Program landing page
│   ├── summary.html
│   ├── pitfalls.html
│   ├── data-flows.html
│   ├── todos.html
│   ├── decisions.html
│   ├── business-rules.html
│   └── cross-references.html
├── {another-program-slug}/             # Added by next /review-docs run
│   └── ...
```

#### Program Slug Generation
Convert the source folder name to a URL-friendly slug:
- Lowercase
- Replace spaces and `&` with hyphens
- Remove consecutive hyphens
- Example: `Legacy Fee Adjustments` → `legacy-fee-aggregation`

#### manifest.js Structure
The manifest is a JS file that sets `window.WIKI_MANIFEST`. This avoids `fetch()` CORS errors when the WIKI is opened from `file://`.
```javascript
window.WIKI_MANIFEST = {
  "title": "IMBilling Mainframe Migration — Documentation Review WIKI",
  "generated": "2026-04-14",
  "programs": [
    {
      "slug": "legacy-fee-aggregation",
      "name": "Legacy Fee Adjustments",
      "source": "existing-mainframe/Documentation/Legacy Fee Adjustments",
      "generated": "2026-04-14",
      "stats": { "documents": 8, "businessRules": 16, "smeItems": 38, "pitfalls": 28, "diagrams": 5, "dataFlows": 5, "todos": 0, "brokenLinks": 0 },
      "pages": ["index.html", "summary.html", "pitfalls.html", "data-flows.html", "todos.html", "decisions.html", "business-rules.html", "cross-references.html"]
    }
  ]
}
```

When running `/review-docs` for a new program:
1. If `docs-wiki/` does not exist, create it with `index.html`, `assets/manifest.js`, `assets/styles.css`, and `assets/nav.js`.
2. If `docs-wiki/` already exists, read `assets/manifest.js` and append the new program entry to the `window.WIKI_MANIFEST.programs` array.
3. Create the program subfolder `docs-wiki/{slug}/` with all pages.
4. The master `index.html` and sidebar navigation automatically pick up the new program from `manifest.js` — no need to edit existing pages.

#### WIKI_CONTEXT Variable
Every HTML page sets `window.WIKI_CONTEXT` right after the `<body>` tag.  This tells `nav.js` how to build the sidebar:

```html
<!-- Master index (depth=0) -->
<script>window.WIKI_CONTEXT = { program: null, page: 'master-index', depth: 0 };</script>

<!-- Program-level page (depth=1) -->
<script>window.WIKI_CONTEXT = { program: 'legacy-fee-aggregation', page: 'pitfalls', depth: 1 };</script>

```

#### Relative Path Rules
| Page Location | CSS Path | nav.js Path | Source Link Prefix |
|--------------|----------|-------------|-------------------|
| `docs-wiki/index.html` (depth=0) | `assets/styles.css` | `assets/manifest.js` then `assets/nav.js` | N/A |
| `docs-wiki/{slug}/*.html` (depth=1) | `../assets/styles.css` | `../assets/manifest.js` then `../assets/nav.js` | `../../` |

#### 3a. Generate `assets/styles.css`

```css
/* === Documentation Review WIKI Stylesheet === */
:root {
    --sidebar-bg: #1e1e2e;
    --sidebar-text: #cdd6f4;
    --sidebar-active: #4a90d9;
    --content-bg: #fafafa;
    --card-bg: #ffffff;
    --text-primary: #1e1e2e;
    --text-secondary: #585b70;
    --accent-blue: #4a90d9;
    --accent-green: #40a02b;
    --accent-yellow: #df8e1d;
    --accent-red: #d20f39;
    --accent-orange: #fe640b;
    --accent-gray: #8c8fa1;
    --border-color: #e0e0e0;
    --code-bg: #f5f5f5;
    --font-main: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: var(--font-main);
    color: var(--text-primary);
    background: var(--content-bg);
    display: flex;
    min-height: 100vh;
}

/* Sidebar Navigation */
.sidebar {
    width: 260px;
    background: var(--sidebar-bg);
    color: var(--sidebar-text);
    padding: 1.5rem 0;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
    flex-shrink: 0;
}

.sidebar h2 {
    padding: 0 1.2rem;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: #fff;
}

.sidebar a {
    display: block;
    padding: 0.5rem 1.2rem;
    color: var(--sidebar-text);
    text-decoration: none;
    font-size: 0.9rem;
    border-left: 3px solid transparent;
    transition: all 0.2s;
}

.sidebar a:hover, .sidebar a.active {
    background: rgba(74, 144, 217, 0.15);
    color: #fff;
    border-left-color: var(--sidebar-active);
}

.sidebar .nav-section {
    margin-top: 1rem;
    padding: 0 1.2rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent-gray);
}

/* Main Content */
main {
    margin-left: 260px;
    padding: 2rem 3rem;
    max-width: 960px;
    width: 100%;
}

h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
h2 { font-size: 1.4rem; margin: 1.5rem 0 0.75rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.3rem; }
h3 { font-size: 1.1rem; margin: 1rem 0 0.5rem; }

p { line-height: 1.6; margin-bottom: 0.75rem; }

/* Cards */
.card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.2rem;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.card-tldr {
    border-left: 4px solid var(--accent-blue);
}

.card-pitfall {
    border-left: 4px solid var(--accent-orange);
    background: #fff8f0;
}

.card-todo {
    border-left: 4px solid var(--accent-yellow);
}

.card-sme {
    border-left: 4px solid var(--accent-red);
    background: #fff5f5;
}

.card-resolved {
    border-left: 4px solid var(--accent-green);
    background: #f5fff5;
}

/* Badges */
.badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.badge-critical { background: var(--accent-red); color: #fff; }
.badge-important { background: var(--accent-orange); color: #fff; }
.badge-info { background: var(--accent-blue); color: #fff; }
.badge-blocking { background: var(--accent-red); color: #fff; }
.badge-deferred { background: var(--accent-yellow); color: #fff; }
.badge-nice-to-have { background: var(--accent-gray); color: #fff; }
.badge-resolved { background: var(--accent-green); color: #fff; }
.badge-unresolved { background: var(--accent-red); color: #fff; }
.badge-assumed { background: var(--accent-yellow); color: #1e1e2e; }

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    font-size: 0.9rem;
}

th, td {
    padding: 0.6rem 0.8rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

th {
    background: var(--sidebar-bg);
    color: #fff;
    font-weight: 600;
}

tr:hover { background: rgba(74, 144, 217, 0.04); }

/* Code */
code {
    font-family: var(--font-mono);
    background: var(--code-bg);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.85em;
}

pre {
    background: var(--code-bg);
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1rem 0;
}

pre code { background: none; padding: 0; }

/* Search */
#wiki-search {
    width: 100%;
    padding: 0.7rem 1rem;
    font-size: 1rem;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    margin-bottom: 1.5rem;
    transition: border-color 0.2s;
}

#wiki-search:focus {
    outline: none;
    border-color: var(--accent-blue);
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
}

.stat-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
}

.stat-card .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--accent-blue);
}

.stat-card .stat-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Source link */
.source-link {
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-decoration: none;
}

.source-link:hover { color: var(--accent-blue); }

/* Mermaid diagrams */
.mermaid {
    background: var(--card-bg);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    margin: 1rem 0;
    text-align: center;
}

/* Generated date */
.generated-date {
    color: var(--text-secondary);
    font-size: 0.85rem;
    margin-bottom: 1.5rem;
}

/* Print styles */
@media print {
    .sidebar { display: none; }
    main { margin-left: 0; }
    .card { break-inside: avoid; }
}

/* Responsive */
@media (max-width: 768px) {
    .sidebar { width: 100%; height: auto; position: relative; }
    main { margin-left: 0; padding: 1rem; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
```

#### 3b. Navigation Architecture (Dynamic Sidebar)

Navigation is handled by `assets/nav.js`, which reads `window.WIKI_MANIFEST` (set by `assets/manifest.js`) and builds the sidebar dynamically. This means:
- **Adding a new program** only requires adding an entry to `manifest.js` — existing pages automatically show the new program in their sidebar.
- **No need to regenerate existing pages** when adding a new program.
- **Static fallback**: Each page includes a `<nav class="sidebar">` with basic links as a no-JS fallback. `nav.js` overwrites this on load.

Every HTML page includes:
1. A `<nav class="sidebar">` element (static fallback)
2. A `<script>window.WIKI_CONTEXT = {...}</script>` right after `<body>`
3. A `<script src="{depth-relative}/assets/manifest.js"></script>` before `</body>` (loads manifest data)
4. A `<script src="{depth-relative}/assets/nav.js"></script>` after manifest.js (builds sidebar)

**Important:** `manifest.js` must be loaded BEFORE `nav.js`. This is critical for `file://` protocol compatibility.

The sidebar shows:
- **All Programs** section at the top (always visible)
- **Current Program** section when navigating within a program (topic pages)
- Active page highlighting based on `WIKI_CONTEXT.page`

#### 3c. Generate Master `index.html` (if not exists)

The master landing page at `docs-wiki/index.html`:
- Reads `window.WIKI_MANIFEST` (set by `manifest.js`)
- Renders clickable program cards with inline stat grids
- Shows aggregate stats across all programs
- Lists critical SME items with links to each program's decisions page

Only generate this file on the FIRST `/review-docs` run. On subsequent runs, it auto-updates from `manifest.js`.

#### 3d. Generate Program `{slug}/index.html`

One TL;DR card per document:
```html
<div class="card card-tldr">
    <h3>{Document Title}</h3>
    <p>{2-4 sentence summary}</p>
    <a class="source-link" href="{relative path to source}">[source]</a>
</div>
```

#### 3e. Generate `pitfalls.html`

Aggregated pitfalls grouped by severity:
```html
<div class="card card-pitfall">
    <span class="badge badge-{severity}">{severity}</span>
    <p>{pitfall description}</p>
    <a class="source-link" href="{relative path to source}">{source file} — {section}</a>
</div>
```

Each topic page (pitfalls.html, todos.html, decisions.html, business-rules.html) groups items by source document using collapsible `<details>` sections:
```html
<details open>
    <summary>From PROGRAM_DOCUMENTATION.md (8 items)</summary>
    <!-- cards for items from this document -->
</details>
```
This provides per-document drill-down without needing separate pages.

#### 3f. Generate `data-flows.html`

All data flow diagrams:
- Mermaid diagrams extracted from docs (rendered client-side)
- Auto-generated flow diagrams from textual descriptions
- Each diagram has a caption and source link

Include Mermaid JS:
```html
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad: true, theme: 'default'});</script>
```

#### 3g. Generate `todos.html`

All TODOs grouped by severity, with source links:
```html
<div class="card card-todo">
    <span class="badge badge-{severity}">{severity}</span>
    <p>{TODO text}</p>
    <code>{source file}:{line context}</code>
</div>
```

Include count summary at top.

#### 3h. Generate `decisions.html`

SME/HITL decision log:
```html
<div class="card card-sme">  <!-- or card-resolved if resolved -->
    <span class="badge badge-{status}">{status}</span>
    <span class="badge badge-info">{category}</span>
    <h3>{decision title}</h3>
    <p>{full context paragraph}</p>
    <a class="source-link" href="{relative path to source}">{source file} — {section}</a>
</div>
```

#### 3i. Generate `business-rules.html`

Business rules table and detail cards:
- Summary table with rule name, category, status, source
- Expandable detail cards for each rule

#### 3j. Generate `cross-references.html`

- Reference matrix table showing which docs link to which
- List of broken links with source location
- Isolated documents (no links in or out)
- Optionally: a Mermaid graph of the document reference network

## Post-Hook: Validate WIKI

```powershell
$wikiDir = "docs-wiki"
$slug = "{program-slug}"  # e.g., "legacy-fee-aggregation"
$progDir = Join-Path $wikiDir $slug

# Validate shared assets
$sharedFiles = @("index.html", "assets/manifest.js", "assets/styles.css", "assets/nav.js")
foreach ($file in $sharedFiles) {
    $path = Join-Path $wikiDir $file
    if (-not (Test-Path $path)) { Write-Error "MISSING SHARED: $file" }
}

# Validate program files
$programFiles = @("index.html", "summary.html", "pitfalls.html", "data-flows.html", "todos.html", "decisions.html", "business-rules.html", "cross-references.html")
$missing = @()
$empty = @()

foreach ($file in $programFiles) {
    $path = Join-Path $progDir $file
    if (-not (Test-Path $path)) {
        $missing += $file
    } elseif ((Get-Item $path).Length -eq 0) {
        $empty += $file
    }
}

# Validate manifest.js contains the program slug
$manifestContent = Get-Content (Join-Path $wikiDir "assets/manifest.js") -Raw
if ($manifestContent -notmatch [regex]::Escape($slug)) { Write-Error "Program '$slug' not found in assets/manifest.js" }

if ($missing.Count -gt 0) { Write-Error "MISSING WIKI PAGES: $($missing -join ', ')" }
if ($empty.Count -gt 0) { Write-Error "EMPTY WIKI PAGES: $($empty -join ', ')" }
Write-Host "Program '$slug': $($programFiles.Count) core pages"
Write-Host "Total programs in WIKI: $($manifest.programs.Count)"
if ($missing.Count -eq 0 -and $empty.Count -eq 0) { Write-Host "ALL WIKI PAGES VERIFIED" }
```

**Gate:** All 8 program core files must exist and be non-empty. Program must be registered in `assets/manifest.js`.

## Post-Hook: Open WIKI in Browser

```powershell
$indexPath = Join-Path (Get-Location) "docs-wiki/index.html"
if (Test-Path $indexPath) {
    Start-Process $indexPath
    Write-Host "Opened WIKI in default browser: $indexPath"
}
```

## Multi-Program Workflow

When `/review-docs` is run for a **new** program:
1. Check if `docs-wiki/` exists. If not, create the shared assets (master `index.html`, `assets/manifest.js`, `styles.css`, `nav.js`).
2. Generate the program-slug from the source folder name.
3. Check if `docs-wiki/{slug}/` already exists. If so, regenerate in place (update manifest stats).
4. Create all program pages under `docs-wiki/{slug}/`.
5. Add or update the program entry in `assets/manifest.js`.
6. The master `index.html` automatically reflects the new program (reads manifest via JS).
7. All existing program sidebars automatically show the new program (sidebar built from manifest via `nav.js`).

**No existing HTML files need to be modified when adding a new program.**

## Customization Options

The user can customize the WIKI generation by specifying:

| Option | Default | Description |
|--------|---------|-------------|
| Output path | `docs-wiki/` | Where to write the WIKI files |
| Mermaid CDN | `jsdelivr` | CDN for Mermaid JS (or local bundle) |
| Theme | `default` | CSS theme (default, dark, minimal) |
| Include source | `true` | Whether to embed source excerpts in topic pages |
| Auto-diagrams | `true` | Whether to auto-generate Mermaid diagrams from textual descriptions |

## Integration

- Run after `/document-cobol-app` to review generated documentation
- Run for multiple programs to build a comprehensive cross-program WIKI
- Use the WIKI as a pre-migration checklist to ensure all open items are addressed
- Share the WIKI with SMEs for review — they can navigate it without any tooling
- Re-run after documentation updates to keep the WIKI current
- The `@document-reviewer` agent uses this skill as its primary workflow

## Example Invocation

```
/review-docs "existing-mainframe/Documentation/Legacy Migration"
/review-docs "existing-mainframe/Documentation/Legacy Fee Aggregation"
/review-docs "existing-mainframe/Documentation/Legacy Data Collection"
```

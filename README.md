# GitHub Agentic Development Example

An example repository demonstrating **agentic software development** patterns using [GitHub Copilot](https://github.com/features/copilot) — including custom agents, reusable skills, orchestration workflows, and a self-improvement memory loop.

## What This Repo Demonstrates

This repo shows how to structure a software project so that AI agents can autonomously plan, implement, review, and commit work — while keeping humans in control of key decisions.

The example domain is a **COBOL-to-Java batch migration** project: converting legacy mainframe jobs (JCL/COBOL) into a YAML-driven Spring Batch application. The domain is incidental — the patterns work for any complex engineering project.

---

## Key Concepts

### 1. Custom Agents (`.github/agents/`)

Agents are specialised AI personas with scoped responsibilities. Each agent has a dedicated instruction file that defines its role, constraints, and delegation rules.

| Agent | Role |
| ----- | ---- |
| [`@architect`](/.github/agents/architect.agent.md) | Tier-1 orchestrator. Makes design decisions, resolves ambiguity, delegates to sub-agents. The **only** agent allowed to ask the user questions. |
| [`@coder`](/.github/agents/coder.agent.md) | Implements features, fixes bugs, writes code. Escalates decisions to `@architect`. |
| [`@explorer`](/.github/agents/explorer.agent.md) | Fast, lightweight file search and context gathering. |
| [`@documenter`](/.github/agents/documenter.agent.md) | Generates documentation from source artifacts. |
| [`@document-reviewer`](/.github/agents/document-reviewer.agent.md) | Reviews documentation folders and generates navigable HTML wikis. |
| [`@code-reviewer`](/.github/agents/code-reviewer.agent.md) | Reviews changed code for quality, standards compliance, and resolves TODOs. |
| [`@red-green-tdd-conversion`](/.github/agents/red-green-tdd-conversion.agent.md) | Ad-hoc COBOL→Java TDD conversion using strict RED-GREEN-REFACTOR. |

**Orchestration pattern:** `@architect` coordinates all work. Sub-agents never ask the user questions directly — they escalate to `@architect`, which invokes the `vscode/askQuestions` tool and routes the answer back.

### 2. Reusable Skills (`.github/skills/`)

Skills are packaged workflows that any agent can load and follow. They encode tested, repeatable processes for common tasks.

| Skill | Purpose |
| ----- | ------- |
| [`/verify`](/.github/skills/verify/) | Build verification loop — compile → test → coverage |
| [`/commit`](/.github/skills/commit/) | Safe commit with pre-flight checks and conventional commit format |
| [`/push`](/.github/skills/push/) | Safe push with branch validation and test gate |
| [`/scaffold`](/.github/skills/scaffold/) | Generate standards-compliant boilerplate (processor, tasklet, model) |
| [`/impl-check`](/.github/skills/impl-check/) | Scan code for anti-patterns and standards violations |
| [`/review`](/.github/skills/review/) | Pre-PR code review with structured findings report |
| [`/lessons`](/.github/skills/lessons/) | Manage the lessons-learned log |
| [`/status`](/.github/skills/status/) | Migration status dashboard |
| [`/shard-plan`](/.github/skills/shard-plan/) | Analyze mainframe artifacts and generate migration shard specs |
| [`/convert-job`](/.github/skills/convert-job/) | Orchestrate a full job conversion shard-by-shard with verify+commit gates |
| [`/integration-test`](/.github/skills/integration-test/) | Generate integration tests for a converted job |
| [`/review-docs`](/.github/skills/review-docs/) | Review a documentation folder and generate a navigable HTML wiki |
| [`/document-cobol-app`](/.github/skills/document-cobol-app/) | Generate documentation from COBOL/JCL source artifacts |

### 3. Copilot Instructions (`.github/copilot-instructions.md`)

The central source of truth for all agents. Defines:

- Project structure and package boundaries
- Coding standards and naming conventions
- Technology stack
- COBOL-to-Java conversion mapping
- Testing standards and TDD workflow

### 4. Self-Improvement Memory Loop (`.github/memory/`)

Every time a bug is found, an assumption is corrected, or an approach changes, an agent **must** append a new entry to [`.github/memory/lessons.md`](/.github/memory/lessons.md) before closing the task.

This creates a growing knowledge base that prevents the same mistakes from recurring across sessions.

---

## Repository Structure

```text
.github/
├── agents/                   # Custom agent instruction files
│   ├── architect.agent.md    # Orchestrator (Tier 1)
│   ├── coder.agent.md        # Implementation specialist (Tier 2)
│   ├── explorer.agent.md     # Context gatherer (Tier 4)
│   └── ...
├── skills/                   # Reusable packaged workflows
│   ├── verify/SKILL.md       # Build verification loop
│   ├── scaffold/SKILL.md     # Boilerplate generation
│   ├── commit/SKILL.md       # Safe commit workflow
│   └── ...
├── memory/
│   ├── lessons.md            # Self-improvement log (append-only)
│   └── todos.md              # Open TODO tracker
├── prompts/                  # Standalone prompt templates
├── workflows/                # GitHub Actions CI/CD workflows
└── copilot-instructions.md   # Global agent instructions
```

---

## Getting Started

### Prerequisites

- [GitHub Copilot](https://github.com/features/copilot) with agent mode enabled
- VS Code with the GitHub Copilot extension

### Using Agents

Invoke agents in the Copilot Chat panel:

```text
@architect Help me plan the migration of JOB001
@coder Implement the processor for the CustomerStagingData entity
@explorer Find all tasklet classes in the project
```

### Using Skills

Skills are invoked with a `/` prefix in the chat:

```text
/verify                            # Run the full build and test cycle
/scaffold processor MyLoadProcessor  # Generate a processor scaffold
/commit "feat(job001): add load processor"
/shard-plan "Legacy Data Collection"  # Plan migration shards for a job
```

### Running the Build

```bash
# Compile
mvn clean compile

# Run tests
mvn clean test

# Full build with coverage report
mvn clean verify
# Coverage report: target/site/jacoco/index.html
```

---

## Agentic Workflow Patterns

### Pattern 1: Orchestrator + Sub-Agent Delegation

```text
User → @architect (orchestrator)
         ↓
    Delegates context gathering → @explorer
    Delegates implementation → @coder
    Delegates documentation → @documenter
    Reviews result → @code-reviewer
```

The orchestrator never does routine work directly. It reasons, decides, and delegates.

### Pattern 2: Question Escalation

Sub-agents never ask the user questions. When input is needed:

```java
// In sub-agent (e.g., @coder)
if (needsUserInput) {
    return raiseQuestionToOrchestrator({
        header: "Design Decision",
        question: "Should this step be CHUNK or TASKLET?",
        options: ["CHUNK", "TASKLET"],
        allowFreeformInput: true
    });
}

// @architect receives it, invokes vscode/askQuestions, returns the answer
```

### Pattern 3: Skill-Gated Shard Execution

Large migrations are broken into shards. Each shard follows a verified gate:

```text
/shard-plan "Legacy Data Collection"   # Generate shard specs
/convert-job JOB001                    # Execute shards with verify+commit gates
/integration-test JOB001               # Generate end-to-end tests
```

### Pattern 4: Self-Improvement Loop

After every task involving a correction:

1. Agent detects it made an assumption or bug
2. Appends entry to `.github/memory/lessons.md`
3. Future tasks search lessons before making similar decisions

---

## Contributing

See the [copilot-instructions.md](/.github/copilot-instructions.md) for the authoritative coding standards, naming conventions, and workflow rules that all agents and contributors must follow.

---

## Static Site (Next.js + GitHub Pages)

This repository now includes a root-level Next.js App Router site that is configured for static export and GitHub Pages deployment.

### Local development

```bash
nvm use
npm install
npm run dev
```

The site is developed and deployed against Node 20.

### Production build (static export)

```bash
npm run build
```

Optional local validation:

```bash
npm run typecheck
```

The static output is generated in `out/`.

### GitHub Pages deployment

Deployment is automated by [`.github/workflows/nextjs.yml`](/.github/workflows/nextjs.yml):

1. Trigger on push to `main` (or run manually via `workflow_dispatch`).
2. Install dependencies with `npm ci`.
3. Build the static site (`npm run build`).
4. Upload `out/` as the Pages artifact.
5. Deploy with `actions/deploy-pages`.

In the GitHub repository settings, set **Pages** to **GitHub Actions** as the source.

The Next.js config automatically applies a project-site base path in GitHub Actions using `${GITHUB_REPOSITORY}` (for example, `/github_agentic_example`) so asset URLs work correctly on Pages.

The workflow also enforces `npm run typecheck` and `npm audit --audit-level=high` before deployment so the exported site is checked for both type drift and known high-severity dependency issues.

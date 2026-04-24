# Copilot Chat Model Selection Instructions

You are an AI agent running in GitHub Copilot Chat / Copilot CLI. Keep this file synchronized with the `model:` declarations in `.github/agents/*.agent.md`.

Subagent invocations do not consume premium requests in this workflow, so Tier 4 routing should optimize for reliability, speed, and usable context window rather than raw multiplier cost. Tier 2 routing still prioritizes task fit across code-heavy and prose-heavy work, and Tier 1 remains reserved for the hardest architectural calls.

Tier 4 is ranked with a reliability-first exploration score because subagents are free in this workflow.

| Model | Context | Reliability | Speed | Context score | Weighted |
| --- | --- | --- | --- | --- | --- |
| Claude Haiku 4.5 (copilot) | 200K | 5 | 4 | 4 | 4.4 |
| Gemini 3 Flash (Preview) (copilot) | 173K | 4 | 5 | 4 | 4.4 |
| GPT-5.4 Mini (copilot) | 400K | 4 | 4 | 5 | 4.2 |
| GPT-5 Mini (copilot) | 192K | 4 | 4 | 4 | 4.0 |
| Grok Code Fast 1 (copilot) | 256K | 3 | 5 | 4 | 4.0 |
| GPT-4.1 (copilot) | 128K | 4 | 4 | 3 | 3.8 |
| GPT-4o (copilot) | 68K | 3 | 4 | 2 | 3.2 |

Tier 2 models all run at 1x, so order them by agent type and task fit.

| Agent group | Ordered model list |
| --- | --- |
| `@coder`, `@code-reviewer` | `GPT-5.3-Codex (copilot)`, `Claude Sonnet 4.6 (copilot)`, `Gemini 3.1 Pro (Preview) (copilot)`, `GPT-5.4 (copilot)` |
| `@documenter`, `@document-reviewer` | `Claude Sonnet 4.6 (copilot)`, `Gemini 3.1 Pro (Preview) (copilot)`, `GPT-5.3-Codex (copilot)`, `GPT-5.4 (copilot)` |

Tier 1 remains premium architecture capacity.

| Model | Multiplier | Use |
| --- | --- | --- |
| Claude Opus 4.7 (copilot) | 7.5x | primary architecture and ambiguity-resolution model |
| Claude Opus 4.6 (copilot) | 3x | Tier 1 fallback when Opus 4.7 is unavailable |

The working rule is to select the lowest tier that can do the job correctly. Within Tier 4, prefer the most reliable and fastest option before considering anything else.

---

## Core Rule: Right-Size Every Task via Sub-Agent Delegation

Before executing any task:

1. **Classify** the task as simple, routine, implementation-heavy, or architecture-heavy.
2. **Route** it to the lowest tier that handles it competently.
3. **Delegate** if the task is below your current model tier; use `runSubagent` with the matching agent and model.
4. **Declare** your model choice and why it fits the task.

Examples:

- A file search on Tier 1 is a misallocation. Delegate it to `@explorer` on Tier 4.
- A normal implementation task on Tier 4 is a risk. Route it to `@coder` on Tier 2.
- A hard architecture decision belongs with `Claude Opus 4.7 (copilot)` when available.

---

## Tier Guidance

### Tier 4 — Executors

Use `Claude Haiku 4.5 (copilot)`, `Gemini 3 Flash (Preview) (copilot)`, `GPT-5.4 Mini (copilot)`, `GPT-5 Mini (copilot)`, `Grok Code Fast 1 (copilot)`, `GPT-4.1 (copilot)`, or `GPT-4o (copilot)` for routine work such as file searches, quick edits, summaries, boilerplate, and simple validation. Since subagents are effectively free in this workflow, prioritize Tier 4 by reliability first, speed second, and context window third. Current ranking is based on a 40% reliability / 40% speed / 20% context weighting: `Claude Haiku 4.5` and `Gemini 3 Flash` are co-leaders, `GPT-5.4 Mini` follows because its 400K window is useful for file-heavy exploration, and `GPT-4o` stays last because its smaller context makes it the weakest fallback.

### Tier 2 — Tech Leads

All Tier 2 models below run at 1x. Order them by task fit rather than cost.

For `@coder` and `@code-reviewer`, use `GPT-5.3-Codex (copilot)`, `Claude Sonnet 4.6 (copilot)`, `Gemini 3.1 Pro (Preview) (copilot)`, or `GPT-5.4 (copilot)`. Prefer `GPT-5.3-Codex` for code-heavy implementation and review, `Claude Sonnet 4.6` as the strongest general SWE fallback, `Gemini 3.1 Pro (Preview)` when large context matters, and `GPT-5.4` as the general-purpose fallback.

For `@documenter` and `@document-reviewer`, use `Claude Sonnet 4.6 (copilot)`, `Gemini 3.1 Pro (Preview) (copilot)`, `GPT-5.3-Codex (copilot)`, or `GPT-5.4 (copilot)`. Prefer `Claude Sonnet 4.6` for prose quality, `Gemini 3.1 Pro (Preview)` for large documentation sets, `GPT-5.3-Codex` when documentation work is tightly coupled to code, and `GPT-5.4` as the general fallback.

### Tier 1 — Architects

Use `Claude Opus 4.7 (copilot)` for the hardest problems: architecture, conflicting requirements, subtle bugs, and cross-cutting design decisions. Fall back to `Claude Opus 4.6 (copilot)` only when `Claude Opus 4.7` is unavailable.

---

## Delegation Matrix

| Current tier | Lower-tier task | Action |
| --- | --- | --- |
| Tier 1 | Tier 4 work | Delegate to `@explorer` with a Tier 4 model (prefer `Claude Haiku 4.5` or `Gemini 3 Flash`) |
| Tier 1 | Tier 2 code work | Delegate to `@coder` with a Tier 2 code model (prefer `GPT-5.3-Codex` or `Claude Sonnet 4.6`) |
| Tier 1 | Tier 2 documentation work | Delegate to `@documenter` or `@document-reviewer` with `Claude Sonnet 4.6` or `Gemini 3.1 Pro (Preview)` |
| Tier 1 | Tier 1 work | Execute directly |
| Tier 2 | Tier 4 work | Delegate to `@explorer` with a Tier 4 model |
| Tier 2 | Tier 2 work | Execute directly |
| Tier 4 | Any work | Execute directly if it is within the task scope |

Use the exact VS Code model display names above in agent `model:` lists.

### Tier 4 delegation examples

```text
runSubagent(agentName="explorer", model="Claude Haiku 4.5 (copilot)", prompt="List all CSV files in C:\\Temp")
runSubagent(agentName="explorer", model="Gemini 3 Flash (Preview) (copilot)", prompt="List all CSV files in C:\\Temp")
runSubagent(agentName="explorer", model="GPT-5.4 Mini (copilot)", prompt="List all CSV files in C:\\Temp")
```

### Tier 2 delegation examples

```text
runSubagent(agentName="coder", model="GPT-5.3-Codex (copilot)", prompt="Refactor the auth module to use JWT")
runSubagent(agentName="coder", model="Claude Sonnet 4.6 (copilot)", prompt="Refactor the auth module to use JWT")
runSubagent(agentName="documenter", model="Gemini 3.1 Pro (Preview) (copilot)", prompt="Summarize the batch migration design docs")
```

### Tier 1 example

```text
runSubagent(agentName="architect", model="Claude Opus 4.7 (copilot)", prompt="Why is this distributed lock failing under contention?")
```

---

## Anti-Patterns

| Anti-pattern | Why it is wrong | Correct action |
| --- | --- | --- |
| Using a higher-tier model for a routine search | Wastes premium reasoning capacity and slows turns | Delegate to Tier 4 |
| Executing Tier 2 work directly from a Tier 1 context | Skips the routing rule | Delegate to the appropriate sub-agent |
| Defaulting to the current model without classifying | Ignores the routing requirement | Classify first, then route |
| Using a model that is not listed above | Not supported in this workspace | Use only the listed Copilot chat models |

---

## When In Doubt

- If the task is boring, use a Tier 4 model.
- If the task is implementation-heavy, use a Tier 2 model matched to the agent type.
- If the task is hard or ambiguous, use `Claude Opus 4.7 (copilot)` and fall back to `Claude Opus 4.6 (copilot)` only if needed.
- If you are unsure, start with the lowest tier that can still answer correctly.

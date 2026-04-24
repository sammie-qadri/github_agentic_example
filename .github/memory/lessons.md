# Lessons Learned Log

## Update Rule

Append a new entry **at the bottom of the Entries section** before closing a task whenever any of the following occurred:

- wrong assumption
- bug in generated code
- human correction
- misread requirement/schema/component structure
- type/lint/test failure caused by generated change
- approach changed mid-task after discovering a better/required path

Entries are ordered **oldest first, newest last**. Always append — never insert in the middle or at the top.

## Entry Template

Copy this block for each new lesson:

```md
## YYYY-MM-DD - <short title>
Category: <bug|assumption|architecture|rule|type|lint|other>
What happened: <1-2 sentences>
Root cause: <why it happened>
Rule going forward: <specific behavior to follow next time>
```

## Entries

<!-- Append new entries below this line. Oldest first, newest last. -->

---

## 2026-04-13 - Agent Question Escalation Architecture

Category: architecture
What happened: All sub-agents were required to escalate user questions to the orchestrator so that only the architect could invoke `vscode/askQuestions`.
Root cause: The instruction files needed a single, explicit rule for user-question handling.
Rule going forward: Every agent instruction file must document the escalation flow and include a code or pseudocode example that routes questions to the orchestrator instead of prompting the user directly.

## 2026-04-16 - New agent files must include the mandatory Question Escalation Rule

Category: architecture
What happened: `convert-job1.agent.md`, `convert-job2.agent.md`, and `red-green-tdd-conversion.agent.md` were created without the mandatory `## Question Escalation Rule` section. They also used CLI-format model IDs (`claude-sonnet-4.6`) instead of VS Code agent format (`Claude Sonnet 4.6 (copilot)`), and `red-green-tdd-conversion` incorrectly told the sub-agent to delegate directly to Claude Opus 4.6.
Root cause: The new agent files were authored without fully cross-checking the Question Escalation Architecture in `copilot-instructions.md` and without validating model IDs against the agent definitions.
Rule going forward: Every new `.agent.md` file must include the Question Escalation Rule section, use the VS Code model ID format, and only escalate questions through `@architect`. Model references in instruction files must correspond to real agent definitions.

## 2026-04-21 - Lessons log entries must satisfy markdown linting

Category: lint
What happened: Normalizing the lessons log to the required template exposed markdown spacing issues around headings and lists.
Root cause: The entry template was updated without preserving markdown-lint spacing rules in the surrounding prose.
Rule going forward: When updating `.github/memory/lessons.md`, keep the template content and the surrounding markdown lint rules aligned, and run a file-level validation after each formatting change.

## 2026-04-22 - Model policy updates must separate agent tier logic from cost logic

Category: rule
What happened: The model-selection instructions and agent model lists had to be corrected because Tier 4 ordering was still optimized around cost instead of the current VS Code subagent behavior, and Tier 2 ordering did not distinguish code-heavy agents from prose-heavy agents.
Root cause: The guidance treated all routing as a simple capability-plus-cost ranking instead of reflecting the actual execution model and agent-specific task fit.
Rule going forward: When updating model policy files, verify subagent pricing assumptions first, rank Tier 4 by reliability and speed when subagents are free, and keep Tier 2 model order specific to each agent type.

## 2026-04-24 - Verify npm package versions before pinning

Category: type
What happened: Initial dependency installation failed because the pinned version `@types/react-dom@19.0.8` was not available on npm.
Root cause: I pinned an unverified type package version while scaffolding the new Next.js project.
Rule going forward: Validate pinned npm versions during setup and prefer known available patch versions when bootstrapping new frontend projects.

## 2026-04-24 - Showcase frontends need a distinctive interaction model, not just feature cards

Category: rule
What happened: The first website pass was functional, but the follow-up requirement made it clear that a generic section-and-card layout was not enough for a repo whose main value is orchestration flow and askQuestions behavior.
Root cause: I translated the information architecture too literally instead of making the interaction model itself reflect the system being demonstrated.
Rule going forward: For showcase frontends, make at least one central interaction embody the product's core behavior, and use the layout to express the system's logic rather than only listing its parts.

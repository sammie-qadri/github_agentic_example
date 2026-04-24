export type AgentCard = {
  name: string;
  tier: string;
  role: string;
  modelHint: string;
};

export type SkillCard = {
  command: string;
  purpose: string;
};

export type WorkflowStep = {
  title: string;
  owner: string;
  signal: string;
  outcome: string;
};

export const heroStats = [
  { label: "Custom agents", value: "7" },
  { label: "Reusable skills", value: "14" },
  { label: "Memory tracks", value: "3 scopes" },
  { label: "Question gate", value: "askQuestions" },
];

export const agents: AgentCard[] = [
  {
    name: "@architect",
    tier: "Tier 1",
    role: "Orchestrates work, resolves ambiguity, and is the only agent that asks users questions.",
    modelHint: "Claude Opus 4.7 (copilot)",
  },
  {
    name: "@coder",
    tier: "Tier 2",
    role: "Implements features, refactors code, and handles debugging inside clear boundaries.",
    modelHint: "GPT-5.3-Codex (copilot)",
  },
  {
    name: "@explorer",
    tier: "Tier 4",
    role: "Performs rapid file search, listing, and context gathering for higher tiers.",
    modelHint: "Claude Haiku 4.5 (copilot)",
  },
  {
    name: "@documenter",
    tier: "Tier 2",
    role: "Creates implementation-ready documentation from source artifacts.",
    modelHint: "Claude Sonnet 4.6 (copilot)",
  },
  {
    name: "@code-reviewer",
    tier: "Tier 2",
    role: "Reviews changed files, standards, and unresolved TODO/FIXME items.",
    modelHint: "GPT-5.3-Codex (copilot)",
  },
  {
    name: "@document-reviewer",
    tier: "Tier 2",
    role: "Reviews docs and generates fast findings or a navigable HTML wiki.",
    modelHint: "Claude Sonnet 4.6 (copilot)",
  },
  {
    name: "@red-green-tdd-conversion",
    tier: "Tier 2",
    role: "Executes strict RED-GREEN-REFACTOR conversion flows for legacy code migration.",
    modelHint: "Claude Sonnet 4.6 (copilot)",
  },
];

export const skills: SkillCard[] = [
  { command: "/verify", purpose: "Compile, test, and coverage loop." },
  { command: "/impl-check", purpose: "Detect project anti-patterns before review." },
  { command: "/review", purpose: "Create a pre-PR findings report." },
  { command: "/scaffold", purpose: "Generate processor/tasklet/model boilerplate." },
  { command: "/commit", purpose: "Apply commit safety checks and conventional message rules." },
  { command: "/push", purpose: "Run pre-push checks and push safely." },
  { command: "/status", purpose: "Summarize migration progress and consistency." },
  { command: "/lessons", purpose: "Record and search lessons-learned memory." },
  { command: "/shard-plan", purpose: "Generate shard specs from mainframe artifacts." },
  { command: "/convert-job", purpose: "Run shard-by-shard migration orchestration." },
  { command: "/integration-test", purpose: "Generate integration tests for converted jobs." },
  { command: "/review-docs", purpose: "Create documentation findings and HTML wiki output." },
];

export const memoryScopes = [
  {
    title: "User memory (/memories/)",
    detail: "Cross-workspace preferences and recurring practices. Short, durable notes only.",
  },
  {
    title: "Session memory (/memories/session/)",
    detail: "Task-scoped notes and in-progress state for the active conversation.",
  },
  {
    title: "Repository memory (/memories/repo/)",
    detail: "Stable repository facts with citations and reasoning for future coding tasks.",
  },
];

export const instructionPanels = [
  {
    title: "Copilot Instructions",
    bullets: [
      "Orchestrator-first delegation model with explicit agent boundaries.",
      "Project standards around coding style, test discipline, and safety checks.",
      "Mandatory self-improvement loop via lessons logging after corrections.",
    ],
  },
  {
    title: "Model Selection",
    bullets: [
      "Route each task to the lowest capable tier before execution.",
      "Tier 4 prioritizes reliability and speed for routine exploration.",
      "Tier 2 is optimized for implementation depth and code review quality.",
    ],
  },
  {
    title: "askQuestions Rule",
    bullets: [
      "The architect is the only agent allowed to question the user directly.",
      "Sub-agents escalate uncertainty instead of scattering prompts across threads.",
      "Completion is explicit because the next step is always routed through one gate.",
    ],
  },
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Classify the task",
    owner: "@architect",
    signal: "Decide whether the work belongs in Tier 4, Tier 2, or Tier 1.",
    outcome: "Routine work gets routed down before premium reasoning is spent.",
  },
  {
    title: "Gather context",
    owner: "@explorer",
    signal: "Search only the smallest surface needed to establish the controlling path.",
    outcome: "Turns stay fast and the implementation agent starts from evidence instead of guesses.",
  },
  {
    title: "Implement",
    owner: "@coder",
    signal: "Make the smallest grounded change that fits the repo rules.",
    outcome: "The solution stays local, reversible, and easier to verify.",
  },
  {
    title: "Validate",
    owner: "/verify + /impl-check",
    signal: "Run the narrowest executable check before widening scope.",
    outcome: "Broken assumptions are caught early, before they spread across files.",
  },
  {
    title: "Escalate questions",
    owner: "askQuestions via @architect",
    signal: "Blocking ambiguity is routed through a single orchestrated entry point.",
    outcome: "Clarifications stay auditable and answers return to the right sub-agent.",
  },
  {
    title: "Close the loop",
    owner: "@architect + /lessons",
    signal: "Record corrections and force an explicit next step or clean stop.",
    outcome: "The system improves over time instead of relearning the same failure mode.",
  },
];
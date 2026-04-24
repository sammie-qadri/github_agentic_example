"use client";

import { useState } from "react";

const scenarios = {
  clarification: {
    label: "Clarification",
    direct: {
      title: "Sub-agent asks directly",
      bullets: [
        "The same missing detail is phrased differently by each agent.",
        "Thread history fragments because the question is detached from orchestration.",
        "The next agent inherits less context than the one that asked.",
      ],
      score: 42,
      metrics: [
        { label: "Clarity", value: 48 },
        { label: "Auditability", value: 36 },
        { label: "Continuity", value: 41 },
      ],
    },
    orchestrated: {
      title: "Question routed through @architect",
      bullets: [
        "One gate standardizes wording and answer handling.",
        "The orchestrator routes the answer back to the blocked sub-agent.",
        "The clarification becomes part of the task narrative instead of a side thread.",
      ],
      score: 93,
      metrics: [
        { label: "Clarity", value: 94 },
        { label: "Auditability", value: 95 },
        { label: "Continuity", value: 90 },
      ],
    },
  },
  completion: {
    label: "Task completion",
    direct: {
      title: "Passive handoff",
      bullets: [
        "The session ends with an open-ended offer and no explicit next-step state.",
        "Users must reconstruct what is finished and what remains.",
        "Follow-on requests start with less momentum.",
      ],
      score: 39,
      metrics: [
        { label: "Closure", value: 35 },
        { label: "Traceability", value: 42 },
        { label: "Momentum", value: 40 },
      ],
    },
    orchestrated: {
      title: "Explicit next-step gate",
      bullets: [
        "Completion triggers a structured next-step prompt instead of a vague offer.",
        "The user can stop cleanly or route immediately into the next task.",
        "Session state stays active without losing the final implementation summary.",
      ],
      score: 90,
      metrics: [
        { label: "Closure", value: 92 },
        { label: "Traceability", value: 88 },
        { label: "Momentum", value: 90 },
      ],
    },
  },
} as const;

type ScenarioKey = keyof typeof scenarios;
type PathKey = "direct" | "orchestrated";

export function AskQuestionsDemo() {
  const [scenario, setScenario] = useState<ScenarioKey>("clarification");
  const [path, setPath] = useState<PathKey>("orchestrated");
  const activeScenario = scenarios[scenario][path];

  return (
    <div className="ask-demo">
      <div className="scenario-strip" role="tablist" aria-label="askQuestions scenario">
        {(Object.entries(scenarios) as Array<[ScenarioKey, (typeof scenarios)[ScenarioKey]]>).map(
          ([key, value]) => (
            <button
              key={key}
              type="button"
              role="tab"
              className={scenario === key ? "scenario-pill is-active" : "scenario-pill"}
              onClick={() => setScenario(key)}
              aria-selected={scenario === key}
            >
              {value.label}
            </button>
          ),
        )}
      </div>

      <div className="toggle-wrap" role="tablist" aria-label="askQuestions comparison mode">
        <button
          type="button"
          role="tab"
          className={path === "direct" ? "toggle is-active" : "toggle"}
          onClick={() => setPath("direct")}
          aria-selected={path === "direct"}
        >
          Direct prompts
        </button>
        <button
          type="button"
          role="tab"
          className={path === "orchestrated" ? "toggle is-active" : "toggle"}
          onClick={() => setPath("orchestrated")}
          aria-selected={path === "orchestrated"}
        >
          Orchestrated prompts
        </button>
      </div>

      <div className="ask-panel">
        <p className="detail-label">Scenario</p>
        <h3>{activeScenario.title}</h3>
        <ul>
          {activeScenario.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="metric-list">
          {activeScenario.metrics.map((metric) => (
            <div key={metric.label} className="metric-row">
              <div className="metric-heading">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
              <div className="score-bar" aria-hidden="true">
                <span style={{ width: `${metric.value}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="score-wrap" aria-label="workflow quality score">
          <span>Workflow quality score</span>
          <strong>{activeScenario.score}/100</strong>
        </div>
        <div className="score-bar" aria-hidden="true">
          <span style={{ width: `${activeScenario.score}%` }} />
        </div>
      </div>
    </div>
  );
}
"use client";

import type { WorkflowStep } from "@/src/data/siteContent";
import { useMemo, useState } from "react";

type WorkflowSimulatorProps = {
  steps: WorkflowStep[];
};

export function WorkflowSimulator({ steps }: WorkflowSimulatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = steps[activeIndex];

  const stageHint = useMemo(() => {
    if (activeIndex === 0) {
      return "The first decision is economic, not cosmetic: route work to the cheapest tier that can still be correct.";
    }
    if (activeIndex === steps.length - 1) {
      return "Closure is part of the system, not an afterthought. Lessons and next-step gating prevent drift between sessions.";
    }
    return "The middle of the workflow is about preserving signal: narrow reads, explicit owners, and executable checks.";
  }, [activeIndex, steps.length]);

  return (
    <div className="simulator">
      <div className="simulator-row">
        {steps.map((step, index) => (
          <button
            key={step.title}
            className={`step-chip ${index === activeIndex ? "is-active" : ""}`}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <span className="step-index">{index + 1}</span>
            {step.title}
          </button>
        ))}
      </div>
      <p className="simulator-hint">{stageHint}</p>
      <div className="simulator-track" aria-hidden="true">
        <span
          className="simulator-progress"
          style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
      <article className="workflow-detail">
        <div className="workflow-heading">
          <span>{activeStep.owner}</span>
          <h3>{activeStep.title}</h3>
        </div>
        <div className="detail-grid">
          <div>
            <p className="detail-label">Signal</p>
            <p>{activeStep.signal}</p>
          </div>
          <div>
            <p className="detail-label">Outcome</p>
            <p>{activeStep.outcome}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
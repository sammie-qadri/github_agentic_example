import { AskQuestionsDemo } from "@/src/components/AskQuestionsDemo";
import { WorkflowSimulator } from "@/src/components/WorkflowSimulator";
import {
    agents,
    heroStats,
    instructionPanels,
    memoryScopes,
    skills,
    workflowSteps,
} from "@/src/data/siteContent";

export default function Home() {
  return (
    <main className="page-shell">
      <nav className="signal-bar reveal" aria-label="Section navigation">
        <a href="#agents">Agents</a>
        <a href="#skills">Skills</a>
        <a href="#memory">Memory</a>
        <a href="#workflow">Flow</a>
        <a href="#ask-questions">askQuestions</a>
      </nav>

      <section className="hero reveal">
        <p className="eyebrow">GitHub Agentic Example</p>
        <h1>Static, intentional, and orchestrated by design.</h1>
        <p className="hero-copy">
          This site mirrors the repository&apos;s agent system: role-based delegation, reusable skills,
          memory-backed self-improvement, and question handling routed through askQuestions.
        </p>
        <div className="stat-grid">
          {heroStats.map((stat) => (
            <article key={stat.label} className="stat-card">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="atlas-grid reveal" aria-label="System overview">
        <article className="panel atlas-panel atlas-panel-primary">
          <div className="section-header">
            <h2>Operating Geometry</h2>
            <p>The repo is built like a control system: one orchestrator, specialized workers, and explicit gates.</p>
          </div>
          <div className="route-strip" aria-hidden="true">
            <span className="route-node">User</span>
            <span className="route-link" />
            <span className="route-node">@architect</span>
            <span className="route-link" />
            <span className="route-node">@explorer / @coder / reviewers</span>
          </div>
        </article>

        <article className="panel atlas-panel">
          <div className="section-header">
            <h2>Why It Feels Different</h2>
          </div>
          <ul className="mini-list">
            <li>Question handling is centralized instead of improvised.</li>
            <li>Model routing is part of the architecture, not an afterthought.</li>
            <li>Lessons are treated as product memory, not chat residue.</li>
          </ul>
        </article>
      </section>

      <section id="agents" className="panel reveal">
        <div className="section-header">
          <h2>Agents Showcase</h2>
          <p>Specialized roles, explicit tiers, and clear boundaries.</p>
        </div>
        <div className="card-grid">
          {agents.map((agent) => (
            <article key={agent.name} className="info-card">
              <div className="card-topline">
                <h3>{agent.name}</h3>
                <span>{agent.tier}</span>
              </div>
              <p>{agent.role}</p>
              <code>{agent.modelHint}</code>
            </article>
          ))}
        </div>
      </section>

      <section id="skills" className="panel reveal">
        <div className="section-header">
          <h2>Skills Catalog</h2>
          <p>Portable workflows that keep delivery quality consistent.</p>
        </div>
        <div className="skill-list">
          {skills.map((skill) => (
            <article key={skill.command} className="skill-row">
              <span className="skill-command">{skill.command}</span>
              <p>{skill.purpose}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="memory" className="two-up reveal">
        <article className="panel">
          <div className="section-header">
            <h2>Memory System</h2>
            <p>Persistent context where it matters, temporary context where it does not.</p>
          </div>
          <div className="memory-list">
            {memoryScopes.map((scope) => (
              <div key={scope.title} className="memory-item">
                <h3>{scope.title}</h3>
                <p>{scope.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-header">
            <h2>Instructions + Models</h2>
            <p>Rules define behavior, model routing defines execution economics.</p>
          </div>
          <div className="instruction-grid">
            {instructionPanels.map((panel) => (
              <div key={panel.title} className="instruction-card">
                <h3>{panel.title}</h3>
                <ul>
                  {panel.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section id="workflow" className="panel reveal">
        <div className="section-header">
          <h2>Intended Workflow</h2>
          <p>Move through the stages to simulate agentic delivery from plan to lessons capture.</p>
        </div>
        <WorkflowSimulator steps={workflowSteps} />
      </section>

      <section id="ask-questions" className="panel reveal">
        <div className="section-header">
          <h2>askQuestions Benefit Demo</h2>
          <p>
            Compare direct sub-agent prompting with orchestrated question routing through
            <strong> @architect</strong>.
          </p>
        </div>
        <AskQuestionsDemo />
      </section>
    </main>
  );
}
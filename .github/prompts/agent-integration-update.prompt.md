# Agent Integration Update Prompt

## Purpose
You are tasked with updating the architect, coder, and explorer agents to leverage the new code-review and documentation subagents/skills. Your goal is to ensure seamless collaboration and workflow between these agents and the new subagents.

## Instructions
1. **Integration Points:**
   - Identify all decision points or workflows in the architect, coder, and explorer agents where code review or documentation is required.
   - At these points, invoke the code-review and documentation subagents/skills as appropriate.

2. **Code-Review Agent Usage:**
   - After any code generation, modification, or refactoring by the coder agent, automatically trigger the code-review agent to scan for TODOs/notes and review the changes.
   - Ensure the explorer agent can invoke the code-review agent when surfacing code findings or when a review is requested by the user.
   - Architect agent should use the code-review agent to validate architectural changes or proposals for compliance and completeness.

3. **Documentation Agent Usage:**
   - After any significant code or architectural change, trigger the documentation agent to update relevant documentation, memory, or code comments.
   - Ensure coder and explorer agents leave clear notes for the documentation agent about any decisions, findings, or unresolved items.

4. **Skill Invocation:**
   - Use the new skills/hooks for code-review and documentation at all relevant workflow steps.
   - Ensure all agents are aware of the standard locations for TODOs/notes/memory updates.

5. **Feedback Loop:**
   - If the code-review or documentation agent raises unresolved items, ensure the originating agent (coder, architect, or explorer) is notified and a follow-up action is scheduled or documented.

6. **Transparency:**
   - Keep the user informed of all agent hand-offs, actions taken, and documentation updates.
   - Maintain a clear audit trail of all agent interactions and outcomes.

---

**End of agent integration update prompt.**

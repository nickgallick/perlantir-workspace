# POST-V1-ROADMAP.md — Nexus

**Created**: 2026-04-02 21:04 UTC+8
**Author**: Governor
**Status**: Active
**Prerequisite**: Nexus v1 COMPLETE (2026-04-02 15:00 UTC+8), Post-V1 Polish COMPLETE (2026-04-02 19:33 UTC+8)

---

## 1. Presentation / Launch Polish

V1 is complete. Post-v1 polish (README rewrite, demo upgrade, first-user path) is complete. The following are **optional** presentation improvements — none are blockers.

| Item | Type | Value | Effort |
|------|------|-------|--------|
| Terminal recording (asciinema/VHS) of demo script output | Visual | Embeddable demo in README without running anything | Low |
| Architecture diagram (Mermaid or SVG) for README | Visual | Replaces mental model text with image | Low |
| `examples/` directory with standalone use-case scripts | Onboarding | Shows SDK patterns beyond the comparison demo | Medium |
| CHANGELOG.md for v1 release | Convention | Standard open-source artifact | Low |

**Rule**: None of these gate any downstream work. Pick them up opportunistically or skip entirely.

---

## 2. OpenClaw Operator Workflow

This section defines how Nexus integrates into live OpenClaw multi-agent execution — making it an active part of the operating system, not a standalone library.

### 2.1 When Decisions Get Recorded

| Trigger | Actor | What Gets Recorded |
|---------|-------|--------------------|
| Operator approves a design choice | Governor | Decision with status `approved`, tags from domain, `made_by: operator` |
| Architect resolves an ambiguity | Architect (via Governor) | Decision with edges to superseded alternatives |
| Implementation deviates from plan | Specialist (via Governor) | Decision with `context` explaining deviation, edge to original plan decision |
| Phase completes | Governor | Status update on phase-level decision (if tracked), new decision for phase outcome |
| Postmortem identifies a lesson | Governor | Decision tagged `lesson-learned`, edges to triggering decisions |

**Not recorded**: Routine file edits, test fixes, formatting changes, heartbeat results. Only decisions that affect downstream agent behavior or project direction.

### 2.2 When Compile Runs

| Trigger | Actor | Purpose |
|---------|-------|---------| 
| Agent begins a new task | Governor (before dispatch) | Compile role-appropriate context for the specialist about to execute |
| Agent requests context mid-task | Specialist (self-serve via SDK) | Refresh context when encountering an unfamiliar area |
| Phase kickoff | Governor | Compile summary context for phase planning, scoped to the phase's domain tags |
| Operator asks "what does X know about Y?" | Governor | Diagnostic compile to show what an agent would see |

**Not compiled**: Every heartbeat, every message, every file read. Compile is a deliberate act when an agent needs decision-aware context to do work correctly.

### 2.3 When Supersede Is Used

| Scenario | What Happens |
|----------|-------------|
| New decision replaces an old one | Old decision status → `superseded`, edge created (type: `supersedes`) |
| Architecture pivot | All affected decisions superseded in batch, new decisions created with edges |
| Operator overrides an agent decision | Agent's decision superseded, operator's decision linked |

**Supersede is not deletion.** Superseded decisions remain in the graph with a 0.4 score penalty (0.1 if excluded from budget). Agents still see them if relevant — they just rank lower.

### 2.4 When Propagation Matters

The Change Propagator fires notifications when:

1. **Decision created** → Agents subscribed to matching tags receive `info`-level notification
2. **Decision superseded** → Agents subscribed to the superseded decision's tags receive `high`-urgency notification (their cached context is now stale)
3. **Decision reverted** → Same as superseded, `high` urgency

**In practice for OpenClaw**:
- Governor checks notifications before dispatching work — if a specialist has unread `high`-urgency notifications, Governor compiles fresh context before dispatch
- Specialists check their notifications at task start — stale context means re-compile before proceeding
- WebSocket push (post-v1) will make this real-time instead of poll-based

### 2.5 What Governor / Agents Do in Practice

**Governor workflow with Nexus**:
1. Receives operator directive
2. Checks Change Propagator notifications for relevant agents
3. Calls `compile()` for the specialist(s) about to execute, scoped to project + role
4. Includes compiled context in dispatch payload
5. Records any decisions made during the phase
6. Updates decision statuses on phase completion

**Specialist workflow with Nexus**:
1. Receives dispatch with compiled context package
2. Uses context to understand current project state, relevant decisions, and constraints
3. If encountering an area outside compiled context, requests re-compile with different tags
4. Reports decisions made back to Governor for recording

**What this replaces**: Manual context loading from memory files, ad-hoc "read the spec" instructions, hope-based consistency between agents. Nexus makes context explicit, scored, and role-appropriate.

---

## 3. Post-v1 Engineering Backlog

### Priority 1 — Production Hardening (pre-deployment)

| ID | Item | Description | Designed? |
|----|------|-------------|-----------|
| PB-1 | Compilation performance baseline | Phase A: warn thresholds (non-blocking). Phase B: CI fail (blocking after ≥3 stable runs). Datasets at 4 sizes. Staged model fully designed in Phase 9 H-6. | Yes — `PHASE-9-HARDENING-PLAN.md` §H-6 |
| PH-1 | Input validation | Field length limits, array bounds, enum checking on all API inputs. Audit completed in Phase 8 security skills — concrete fix code exists. | Partially — fix patterns in `SKILL-API-INPUT-VALIDATION.md` |
| PH-2 | Per-project API keys | Replace single `NEXUS_API_KEY` with project-scoped keys. Required for multi-project use. | No — design needed |
| PH-3 | Rate limiting | Per-key rate limits on API. Required before any shared/hosted deployment. | No — design needed |

### Priority 2 — Capability Expansion

| ID | Item | Description |
|----|------|-------------|
| CE-1 | WebSocket real-time push | Change Propagator notifications delivered via WS instead of polling. Client registry exists in code (stub). |
| CE-2 | Conversation distillery | Spec §12 — LLM-powered summarization of agent sessions into decisions. Requires embedding provider integration. |
| CE-3 | Session summary routes | AMB-2 — opt-in session tracking and summary endpoints. |

### Priority 3 — Developer Experience

| ID | Item | Description |
|----|------|-------------|
| DX-1 | Migration CLI | Standalone CLI for running migrations outside server startup. Nice-to-have for ops. |
| DX-2 | OpenTelemetry / structured logging | Observability layer for production debugging. |
| DX-3 | Multiple embedding providers | Currently OpenAI-only. Support for local models, Anthropic, etc. |

### Cancelled

| ID | Item | Reason |
|----|------|--------|
| ~~Phase 1B capability files~~ | 9 scoped planning files | Implementation complete — planning artifacts add no value to shipped product |

---

## 4. Future Integrations

### 4.1 Hermes Readiness

**What**: Hermes is the communication agent in Perlantir — handles cross-agent messaging, external notifications, and communication routing.

**Integration point**: Hermes consumes Change Propagator notifications and delivers them to agents via its own transport (not Nexus's responsibility).

**What Nexus needs to provide**:
- Notification query API (exists: `GET /api/notifications`)
- Webhook/callback registration for new notifications (does not exist)
- Structured notification payload with enough metadata for Hermes to route (partially exists — needs `target_agent_id` and `urgency` in response)

**Prerequisite**: Hermes must exist as a defined system with a communication protocol. Nexus adapts its notification output to Hermes's input contract. Not the reverse.

**Status**: Blocked on Hermes definition. No Nexus work until Hermes protocol is specified.

### 4.2 ruflo Integration

**What**: ruflo is the workflow/orchestration system — manages task dispatch, execution sequences, and agent coordination.

**Integration point**: ruflo calls `compile()` before dispatching work to an agent, embedding the context package in the task payload.

**What Nexus needs to provide**:
- SDK client (exists: `@nexus-ai/sdk`)
- Compile endpoint (exists: `POST /api/projects/:id/compile`)
- Agent registration endpoint (exists: `POST /api/agents`)

**What ruflo needs to implement**:
- Pre-dispatch hook that calls Nexus compile
- Context injection into agent task payload
- Decision recording callback after task completion

**Prerequisite**: ruflo must exist as a defined system. Integration is ruflo calling Nexus, not Nexus calling ruflo.

**Status**: Blocked on ruflo definition. Nexus API surface is already sufficient for basic integration.

### 4.3 Broader Orchestration / Personal Stack

**What**: Nexus as part of the broader Perlantir operating system and Nick's personal AI stack (OpenClaw).

**Near-term (OpenClaw integration)**:
- Governor uses Nexus SDK to record decisions during real project work
- Context compiled before specialist dispatch in live sessions
- Decision graph grows organically from actual project execution

**Medium-term (platform layer)**:
- Nexus becomes a service in the Perlantir platform docker-compose
- All Perlantir agents have Nexus context available by default
- Decision graph spans multiple projects

**Long-term (product)**:
- Multi-tenant hosted Nexus (requires PH-2, PH-3)
- Dashboard for decision graph visualization (separate frontend project)
- Marketplace listing (requires cloud deployment infrastructure)

---

## 5. Recommended Execution Order

### Phase A: Live Integration (OpenClaw Operator Workflow)

**Objective**: Make Nexus part of real Governor execution, not a standalone library.

1. Define the Governor ↔ Nexus protocol (when Governor calls compile, how decisions are recorded)
2. Implement Governor integration points (SDK calls in Governor dispatch flow)
3. Record first real decisions from actual Perlantir project work
4. Validate: compiled context actually improves specialist output vs. manual context loading

**Why first**: This is the entire point. A context compiler that isn't compiling context for real agents is a demo, not a product. Everything else is premature until Nexus proves value in live execution.

### Phase B: Production Hardening

**Objective**: Make the live integration safe and measurable.

1. PB-1: Performance baseline (Phase A warn, then Phase B CI fail after 3 stable runs)
2. PH-1: Input validation on all API routes
3. DX-2: Structured logging (need visibility into live compile calls)

**Why second**: Once Nexus is running in real execution, you need to know it's fast enough and safe enough. Not before.

### Phase C: Capability Expansion

**Objective**: Extend Nexus based on real usage patterns from Phase A.

1. CE-1: WebSocket push (if polling proves too slow for real-time agent coordination)
2. CE-2: Conversation distillery (if manual decision recording proves too burdensome)
3. PH-2 + PH-3: Per-project keys + rate limiting (if multi-project use demands isolation)

**Why third**: Let real usage reveal what's actually needed. CE-1 might be unnecessary if Governor polls are fast enough. CE-2 might be critical if manual recording is too slow.

### Phase D: Platform Integration

**Objective**: Connect Nexus to other Perlantir components.

1. Hermes integration (when Hermes exists)
2. ruflo integration (when ruflo exists)
3. Multi-project graph support (when more than one project uses Nexus)

**Why last**: Blocked on external dependencies. No point designing integration protocols for systems that don't exist yet.

---

## Anti-Drift Rules

1. **No phase starts without operator approval** — same governance as v1
2. **Phase A is mandatory first** — no production hardening or capability work until Nexus is running in real execution
3. **No new features during hardening** — Phase B is purely about making existing functionality safe and measurable
4. **Integration waits for dependencies** — no speculative protocol design for Hermes/ruflo until they're defined
5. **Personal stack experiments are separate** — OpenClaw integration (Phase A) is product work; broader stack experimentation is tracked separately and doesn't block or scope-creep Nexus

---

## Summary

| Phase | Scope | Depends On | Estimated Effort |
|-------|-------|------------|-----------------|
| A | Live OpenClaw integration | Nothing (start here) | Medium — protocol design + Governor changes |
| B | Production hardening (PB-1, PH-1, logging) | Phase A proving value | Medium — implementation work with existing designs |
| C | Capability expansion (WS, distillery, keys) | Phase A/B usage patterns | Large — new features driven by real needs |
| D | Platform integration (Hermes, ruflo) | External system existence | Unknown — blocked on dependencies |

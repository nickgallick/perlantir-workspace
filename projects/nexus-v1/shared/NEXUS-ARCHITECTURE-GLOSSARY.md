# NEXUS-ARCHITECTURE-GLOSSARY.md

Canonical definitions for Nexus v1. All agents use these terms exactly as defined here. No synonyms, no reinterpretation.

---

**Decision Graph** — Directed graph where nodes are project decisions and edges are typed relationships. Stored in `decisions` + `decision_edges` tables. (Spec §4, §7)

**Decision** — A recorded project decision with title, description, reasoning, confidence, status, affects list, tags, and optional embedding. Statuses: `active`, `superseded`, `reverted`, `pending`. (Spec §4, §5)

**Edge Relationship** — Typed connection between two decisions. Types: `supersedes`, `requires`, `informs`, `blocks`, `contradicts`. Self-edges prohibited. (Spec §4, §5)

**Context Compiler** — The core algorithm. Takes an agent ID + task description → produces a role-aware context package within a token budget. 12-step pipeline: get agent → embed task → get decisions → score → expand graph → apply freshness → score artifacts → get notifications → get sessions → pack → format → cache. (Spec §7)

**Relevance Profile** — Per-agent configuration that controls how decisions are scored. Contains: `weights` (tag→number map), `decision_depth` (graph traversal hops), `freshness_preference` (`recent_first` | `validated_first` | `balanced`), `include_superseded` (boolean). (Spec §5, §6)

**Role Template** — Pre-built relevance profile for a standard role. 8 built-in: `builder`, `reviewer`, `product`, `docs`, `launch`, `ops`, `blockchain`, `challenge`. (Spec §6)

**Scored Decision** — A decision with computed scores: `relevance_score` (0-1), `freshness_score` (0-1), `combined_score` (70% relevance + 30% freshness), `graph_depth`, `inclusion_reason`. (Spec §5, §7)

**Token Budget Packer** — Allocates token budget across content types: 10% notifications, 55% decisions, 30% artifacts, 5% sessions. Overflow from one category flows to the next. (Spec §8)

**Context Package** — The compiled output. Contains: agent info, task, scored decisions, scored artifacts, notifications, sessions, formatted markdown, formatted JSON, compilation stats. (Spec §5, §7)

**Change Propagator** — When a decision is created, superseded, or reverted, generates role-appropriate notifications for affected agents and invalidates their context cache. Delivers via WebSocket if connected. (Spec §10)

**Conversation Distillery** — Post-launch feature. Uses Claude to extract structured decisions from conversation text. Code included in spec but NOT default in v1. (Spec §11)

**Freshness Score** — Exponential decay. Unvalidated decisions: 7-day half-life. Validated decisions: 30-day half-life. Formula: `Math.exp(-ageHours / (halfLifeDays * 24))`. Stale threshold: < 0.3. (Spec §7, §12)

**Artifact** — A project artifact (spec, code, design, report, config, documentation, other) linked to decisions. Has optional embedding for semantic matching. (Spec §4, §5)

**Context Cache** — Per-agent, per-task-hash cached compilation result. Expires after 1 hour. Invalidated on any decision change affecting the agent. (Spec §4, §7)

**Subscription** — Agent subscription to a topic, with notification triggers (`update`, `supersede`, `revert`). (Spec §4, §5)

---

## What this changes in execution

Every agent references the same terms with the same meaning. Eliminates: terminology drift between agents, misunderstanding of scoring mechanics, confusion about what "compilation" means vs. "formatting" vs. "packing." Saves an estimated 1-2 clarification rounds per phase.

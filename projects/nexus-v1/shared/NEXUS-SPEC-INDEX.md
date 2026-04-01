# NEXUS-SPEC-INDEX.md

Quick-reference: concept → spec section. Source: `projects/nexus-v1-spec.txt`.

---

| Concept | Spec § | What's There |
|---------|--------|-------------|
| Product overview + positioning | §1 | What Nexus is, v1 scope, what's NOT in v1, competitive differentiation |
| Tech stack decisions | §2 | All stack choices with rationale (TypeScript, Hono, PostgreSQL+pgvector, Vitest, Turborepo+pnpm, Docker) |
| Project/file structure | §3 | Complete directory tree for the monorepo |
| Database schema (SQL) | §4 | 9 tables, 2 functions, triggers. Complete CREATE statements |
| TypeScript types | §5 | All interfaces: Project, Agent, Decision, Edge, Artifact, SessionSummary, CompileRequest, ContextPackage, ScoredDecision, etc. |
| Role templates | §6 | 8 built-in roles with full weight maps, `getRoleTemplate()`, `listRoleTemplates()`, `inspectRoleTemplate()` |
| Context Compiler algorithm | §7 | `ContextCompiler` class, `compile()`, `scoreDecisions()`, `expandGraphContext()`, `applyFreshness()`, all helpers |
| Token Budget Packer | §8 | `packIntoBudget()`, token estimation, budget allocation percentages |
| Context Formatter | §9 | `formatAsMarkdown()`, `formatAsJson()` |
| Change Propagator | §10 | `ChangePropagator` class, `onDecisionCreated()`, `onDecisionSuperseded()`, `onDecisionReverted()`, notification generation |
| Conversation Distillery (post-launch) | §11 | Extraction prompt, `ConversationDistillery` class |
| Temporal/Freshness | §12 | `computeFreshness()`, `isStale()`, decay formulas |
| Embedding utility | §13 | `createOpenAIEmbedder()`, `cosineSimilarity()` |
| API server (Hono routes) | §14 | All routes: projects, agents, decisions, artifacts, notifications, compile, health. `app.ts` + `index.ts` |
| TypeScript SDK | §15 | `NexusClient` class, all methods, convenience helpers, `seedSoftwareTeamDemo()` |
| Docker Compose + Dockerfile | §16 | Service topology, multi-stage build, env vars, health checks |
| Comparison demo | §17 | `comparison.ts` — baseline vs. Nexus, change propagation demo |
| README template | §18 | Key messaging lines, structure, comparison table |
| 15-day build order | §19 | Day-by-day deliverables, week structure |
| Testing strategy | §20 | Unit tests (4 files), scenario tests (5 scenarios), performance targets |
| Launch checklist | §21 | Pre-launch verification, launch day schedule |
| Post-launch roadmap | §22 | 10 features with demand triggers |

---

## What this changes in execution

Agents find the right spec section in seconds instead of searching a 56-page document. Eliminates: repeated spec scanning, citing the wrong section, missing relevant spec content. Every capability file and every implementation decision references spec sections by number.

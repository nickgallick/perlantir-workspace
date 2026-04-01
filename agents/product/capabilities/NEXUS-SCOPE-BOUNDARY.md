# NEXUS-SCOPE-BOUNDARY.md

What is in Nexus v1 and what is not. Derived from Spec §1, §22. This is the scope gate — use it to accept or reject any feature request instantly.

---

## IN v1 (Build It)

| Feature | Spec § |
|---------|--------|
| Decision Graph (CRUD + edges + typed relationships + recursive traversal) | §4, §7 |
| Context Compiler (role-aware scoring + graph expansion + freshness + packing + formatting) | §7, §8, §9 |
| Change Propagator (create/supersede/revert → role-specific notifications + cache invalidation) | §10 |
| Temporal/Freshness scoring (7-day and 30-day decay, stale detection) | §12 |
| 8 built-in role templates (builder, reviewer, product, docs, launch, ops, blockchain, challenge) | §6 |
| REST API server (Hono, all CRUD routes + /api/compile) | §14 |
| TypeScript SDK with convenience helpers | §15 |
| Comparison demo (baseline vector vs. Nexus role-aware + change propagation) | §17 |
| Docker compose (nexus + pgvector postgres, one-command setup) | §16 |
| PostgreSQL 16 + pgvector data layer (9 tables, recursive CTE, IVFFlat indexes) | §4 |
| OpenAI embeddings (text-embedding-3-small, 1536 dims) | §13 |
| WebSocket real-time notifications | §10 |
| Context cache (per-agent, per-task, 1-hour TTL) | §4, §7 |
| API key authentication | §4 (table), §3 (auth middleware file) |
| README + 5 docs files + CONTRIBUTING.md | §18 |
| GitHub Actions CI/CD (test on PR, publish on tag) | §19 Day 13 |
| MIT license | §19 Day 13 |
| Launch content (blog, tweets, HN, Reddit, LinkedIn) | §19 Day 14 |

## NOT in v1 (Do Not Build)

| Feature | Why Not | Trigger for Inclusion |
|---------|---------|----------------------|
| Python SDK | Not enough demand signal | 10+ user requests (§22) |
| LangChain adapter | No integration partner | Requested or LangChain team interest (§22) |
| CrewAI adapter | No integration partner | Requested or CrewAI team interest (§22) |
| AutoGen adapter | No demand | Community PR or request (§22) |
| OpenClaw adapter | Not needed yet | When needed for VPS (§22) |
| Conversation Distillery (as default) | Code included but opt-in only | Demo proves demand (§22) |
| Visual graph explorer UI | No UI in v1 | After 500+ GitHub stars (§22) |
| Cloud hosted version (SaaS) | Self-hosted only | After 1000+ stars + enterprise interest (§22) |
| RBAC / access control | No multi-tenant in v1 | Enterprise request (§22) |
| Analytics dashboard | No telemetry in v1 | Enterprise request (§22) |
| Enterprise features (audit, compliance) | Self-hosted open source in v1 | Enterprise request (§22) |

## ONLY WITH EXPLICIT OPERATOR OVERRIDE

Any feature not in the two lists above requires operator approval before even scoping. Examples:
- Custom role template editor UI
- Decision import/export
- Multi-project dashboards
- GraphQL API (Hono REST only)
- Alternative embedding providers
- SSO/OAuth for API access

## Scope Creep Detection Rules

If someone proposes work and you can't find it in the "IN v1" table above, the answer is **no** unless operator overrides. Common traps:

- "It would be easy to also add..." → No. Easy doesn't mean in-scope
- "Users will expect..." → v1 users are early adopters who expect the core to work, not feature completeness
- "Competitors have..." → Nexus differentiates on role-aware compilation, not feature count
- "We should future-proof by..." → Build what ships. Refactor when demand proves the direction

---

## What this changes in execution

Product (and every other agent) can answer "is this in v1?" in under 10 seconds. No debate, no analysis, no judgment call. The scope boundary is a lookup table. Eliminates: scope creep discussions, "should we also..." tangents, building features that don't serve launch, and post-hoc justification for unauthorized scope expansion.

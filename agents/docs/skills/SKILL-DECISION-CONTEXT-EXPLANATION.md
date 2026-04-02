# SKILL-DECISION-CONTEXT-EXPLANATION

## Purpose

Explain the core Nexus concept — decision-aware context compilation for multi-agent teams — in user-facing documentation without implementation jargon. Bridge from pitch ("different agents need different context") to understanding with concrete before/after examples.

## When to Use

- README writing (pain statement, fix statement, "how it works" section)
- Blog post authoring
- Landing page copy
- Explaining Nexus to someone who hasn't seen the demo
- Any "what is Nexus?" context

## Inputs Required

**Messaging (use these lines, don't reinvent):**
- `agents/docs/capabilities/NEXUS-KEY-MESSAGING.md` — headline, subhead, one-liner, competitive differentiation, README structure, key phrases

**Concrete proof data (for before/after examples):**
- `examples/software-team/comparison.ts` — the 4-section demo showing baseline vs Nexus
- `projects/nexus-v1/shared/ROLE-DIFFERENTIATION-PROOF.md` — numerical proof with specific scores
- `agents/product/capabilities/NEXUS-SCOPE-BOUNDARY.md` — what Nexus is and isn't

**System behavior (for "how it works" accuracy):**
- `packages/core/src/context-compiler/scoring.ts` — 4 scoring signals (for simplified explanation)
- `packages/core/src/roles.ts` — 8 role templates (for the "built-in roles" section)

## Execution Method

### The Explanation Framework

Every explanation of Nexus must follow this 4-step structure (from KEY-MESSAGING.md README spec):

**Step 1 — Pain (what's broken):**
Multi-agent teams share a project but each agent needs different context. Vector search returns the same results for every agent. A builder and a marketing agent get identical "relevant" documents. Context is lost at every handoff.

Key phrase: "Vector search finds SIMILAR text. Nexus finds RELEVANT context."

**Step 2 — Fix (what Nexus does):**
Nexus compiles role-aware context for each agent from a shared decision graph. Same project, same decisions — different compiled output per role based on what actually matters to that agent's task.

Key phrase: "Decision-aware context compilation for coding-agent teams."

**Step 3 — Proof (the demo):**
Show the before/after from the comparison demo:

*Before (baseline vector retrieval):*
- Query: "Implement the auth middleware"
- Builder gets: same 5 results
- Reviewer gets: same 5 results
- Launch agent gets: same 5 results

*After (Nexus compilation):*
- Builder gets: JWT auth, rate limiting, Argon2 hashing (implementation decisions)
- Reviewer gets: JWT auth, rate limiting, security decisions (review-relevant)
- Launch gets: SSO scope, feature flags, deprecation timeline (go-to-market decisions)

Source: `examples/software-team/comparison.ts` sections A and B.

Key phrase: "Same project. Same decisions. Different agents. Different context. Zero handoff loss."

**Step 4 — How it works (simplified):**

```
Decisions → Score per agent → Expand graph → Pack into budget → Format output
```

1. **Decision Graph**: Decisions are stored with metadata (who made it, who it affects, tags, relationships to other decisions).
2. **Role-Aware Scoring**: Each agent has a relevance profile. Nexus scores every decision against the agent's role, task, and profile weights.
3. **Graph Expansion**: High-scoring decisions pull in their neighbors (connected decisions at reduced priority).
4. **Budget Packing**: Scored decisions are packed into the agent's token budget (most relevant first).
5. **Change Propagation**: When decisions change, affected agents are notified with role-appropriate context.

Do NOT explain the formula (4 signals, weights, penalties). Say "role-aware relevance scoring" and link to technical docs for details.

### Adapting for Different Audiences

**README (developers)**: Focus on quickstart code + demo output. Show the `NexusClient` in 10 lines. Link to demo script.

**Blog post (technical audience)**: Include the before/after comparison, explain why vector search is insufficient, reference the March 2026 position paper (arxiv 2603.10062), show the scoring signals at high level.

**HN comment (skeptical audience)**: Lead with the concrete demo output. Show numbers: "Builder gets score 0.607, launch gets 0.030 for the same decision." Then explain why.

**Landing page (non-technical)**: Lead with the pain: "Your AI agents are flying blind." Then the fix: "Nexus gives each agent the context it actually needs." Then the demo screenshot.

### Source-of-Truth Rules

| Claim | Must derive from |
|-------|-----------------|
| Headline / subhead / one-liner | `NEXUS-KEY-MESSAGING.md` (verbatim) |
| Competitive differentiation | `NEXUS-KEY-MESSAGING.md` table (with evidence column) |
| Before/after demo output | `comparison.ts` sections A + B |
| Score values in examples | `ROLE-DIFFERENTIATION-PROOF.md` or `scoring.test.ts` |
| Role template names | `roles.ts` — `listRoleTemplates()` returns 8 |
| Feature list (what's in v1) | `NEXUS-SCOPE-BOUNDARY.md` — IN v1 table |
| What's NOT in v1 | `NEXUS-SCOPE-BOUNDARY.md` — NOT IN v1 / EXPLICITLY OUT tables |

### Do NOT Do This

- **Do not invent new taglines.** Use the lines from KEY-MESSAGING.md or close derivatives.
- **Do not explain the scoring formula in user-facing docs.** Say "role-aware relevance scoring" and link to technical reference.
- **Do not claim features that are deferred** (per-project API keys, WebSocket real-time, session summaries). Check SCOPE-BOUNDARY.md.
- **Do not use "AI memory" framing.** Nexus is "decision-aware context compilation," not memory. The competitive differentiation is explicit about this: "Those store memory for SINGLE agents. Nexus coordinates memory across MULTIPLE specialized agents."
- **Do not show code examples that haven't been tested.** All code in docs must come from test files or the demo script.
- **Do not describe the system as "multi-tenant" or "cloud-hosted."** Nexus v1 is self-hosted, single-tenant.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Messaging inconsistent across surfaces | Writer invented new tagline | Compare against KEY-MESSAGING.md | Replace with canonical line |
| Feature claimed but not implemented | Scope boundary not checked | Feature not in codebase | Check SCOPE-BOUNDARY.md before claiming |
| Demo output doesn't match docs | Demo script updated but docs stale | Run demo, compare | Re-derive from current `comparison.ts` |
| Score values wrong in blog | Copied from memory, not source | Verify against `scoring.test.ts` | Use exact values from tests |

## Exit Criteria

- Explanation follows 4-step structure: pain → fix → proof → how it works
- All messaging lines traceable to KEY-MESSAGING.md
- Before/after examples derived from `comparison.ts`
- No claimed features absent from SCOPE-BOUNDARY.md
- No implementation jargon in user-facing text (no "JSONB," no "pg.Pool," no "LATERAL JOIN")
- Technical accuracy verified against source files listed above

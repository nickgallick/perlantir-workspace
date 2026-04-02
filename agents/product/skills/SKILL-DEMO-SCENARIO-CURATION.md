# SKILL-DEMO-SCENARIO-CURATION

## Purpose

Design demo scenarios that showcase Nexus value with realistic, relatable decision sets for specific audiences. Each scenario must produce an obvious before/after contrast with minimal setup and maximum "aha moment" density.

## When to Use

- Preparing a demo for a specific audience (developers, enterprise, conference)
- Current demo doesn't resonate with a target market
- Marketing content needs a fresh scenario
- New seed data needed for README quickstart
- Evaluating whether a proposed scenario actually demonstrates differentiation

## Inputs Required

**Current demo (baseline to match or exceed):**
- `examples/software-team/comparison.ts` — 4-section demo (baseline / Nexus / propagation / ergonomics)
- `packages/sdk/src/client.ts` — `seedSoftwareTeamDemo()` (6 agents, 10 decisions, 4 edges)

**What makes differentiation visible:**
- `projects/nexus-v1/shared/ROLE-DIFFERENTIATION-PROOF.md` — proven score differences
- `agents/qa/capabilities/NEXUS-SCENARIO-DEFINITIONS.md` — test scenario patterns

**Messaging framing:**
- `agents/docs/capabilities/NEXUS-KEY-MESSAGING.md` — demo message, key phrases, competitive claims

## Execution Method

### What Makes a Good Demo Scenario

A demo scenario must satisfy ALL of these criteria:

| Criterion | Test | Fail example |
|-----------|------|-------------|
| **Relatable domain** | Audience recognizes the project type instantly | "Quantum computing research pipeline" — too niche |
| **Clear role separation** | 3+ agents with obviously different concerns | 3 "developer" agents — no visible differentiation |
| **Obvious before/after** | Baseline gives identical output; Nexus gives different output per role | All agents get different output even in baseline — demo doesn't prove anything |
| **Supersede moment** | At least 1 decision change with visible propagation impact | No decision changes — skips the most compelling section |
| **< 30 seconds to understand** | Non-technical person can follow the output | Requires reading 10 decisions to see the point |

### Current Demo: Software Team Building Auth

**Scenario**: 6 agents (builder, reviewer, product, docs, launch, ops), 10 decisions about API authentication, 4 edges.

**Why it works**:
- Auth is universally understood by developers
- Builder cares about implementation (JWT, Argon2, rate limiting)
- Launch cares about messaging (SSO scope, deprecation timeline)
- Reviewer cares about security (all auth decisions)
- The supersede moment (SSO delayed → SSO for enterprise beta) is dramatic and relatable
- 10 decisions is enough for differentiation without overwhelming

**Where it falls short**:
- Only resonates with software teams
- Auth domain is narrow — may feel like a toy
- Enterprise buyers may want to see their domain, not generic SaaS

### Scenario Design Template

```
Audience:       Who is watching this demo?
Domain:         What kind of project?
Agents (3-6):   Name + role + one-line concern
Decisions (8-12): Title + affects + tags (enough for differentiation, not overwhelming)
Edges (3-5):    Key relationships that trigger graph expansion
Supersede:      Which decision changes? What's the before/after?
Punchline:      What's the "aha" moment in the output?
```

### Candidate Scenarios for Future Audiences

**Scenario B — ML Team Shipping a Model**

```
Audience:     ML engineers, data teams
Agents:       data-engineer, ml-researcher, mlops, compliance, product
Decisions:    model selection, training infra, data pipeline, bias audit,
              serving architecture, monitoring, A/B test design, privacy review
Supersede:    "Use GPT-4" → "Use fine-tuned Llama 3" (cost/privacy pivot)
Punchline:    data-engineer gets pipeline decisions, compliance gets bias/privacy,
              product gets A/B test and timeline — none see each other's concerns
Tags needed:  ml, training, inference, data, pipeline, bias, privacy, monitoring, serving
```

Differentiation check: `ml`, `training`, `inference`, `bias` don't appear in current roleTagMaps → need custom role templates with these tags at ≥ 0.8.

**Scenario C — Platform Team Managing Microservices**

```
Audience:     Platform/infra engineers, CTOs
Agents:       platform-eng, security, sre, api-designer, cost-analyst
Decisions:    service mesh, auth gateway, rate limiting, DB per service vs shared,
              observability stack, cost allocation, API versioning, incident response
Supersede:    "Shared database" → "DB per service" (scaling pressure)
Punchline:    SRE gets observability + incident response, security gets auth + rate limiting,
              cost-analyst gets cost allocation + DB decision — zero overlap in top-3
```

**Scenario D — Startup Pre-Launch**

```
Audience:     Founders, product managers, non-technical stakeholders
Agents:       founder, developer, marketer, legal, ops
Decisions:    MVP scope, pricing model, launch timeline, terms of service,
              hosting provider, brand positioning, beta access criteria
Supersede:    "Free tier" → "Paid-only with trial" (revenue pressure)
Punchline:    Developer sees hosting + MVP scope, marketer sees positioning + pricing,
              legal sees ToS + pricing changes — same pivot, 3 different action items
```

### Scenario Validation Checklist

Before committing to a new scenario:

- [ ] ≥ 3 agents with non-overlapping high-weight tag domains
- [ ] ≥ 8 decisions with diverse `affects` arrays (not all targeting the same agent)
- [ ] ≥ 2 tag domains represented in decisions (mixing domains strengthens differentiation)
- [ ] ≥ 1 supersede moment that changes context for ≥ 2 agents
- [ ] Run through `compile()` mentally or in test: verify different agents get different top-3 decisions
- [ ] Non-expert can follow the demo output in < 30 seconds
- [ ] Scenario can be seeded via SDK in < 20 lines of code

### Implementing a New Scenario

1. Create a seed function in `client.ts` or a standalone script: `seedScenarioB()`
2. Follow the `seedSoftwareTeamDemo()` pattern: create project → agents → decisions → edges
3. Add to `examples/` directory: `examples/<domain>/comparison.ts`
4. Run the comparison: baseline (all same) → Nexus (role-differentiated) → supersede (propagation)
5. Verify output is compelling — if you can't immediately tell why the roles got different context, the scenario is weak

### Bad Product Move

**Temptation**: "Let's build 5 demo scenarios to cover every audience segment before launch."

**Why it weakens Nexus**: Each scenario requires custom role templates (with roleTagMap validation), custom seed functions, custom demo scripts, and ongoing maintenance as the API evolves. One excellent demo that every audience can follow beats five mediocre demos that split attention. The current software-team demo works because auth is universal — developers, CTOs, and product managers all understand it.

**The rule**: Ship with 1 polished demo. Add a second only when a specific audience segment provides feedback that the current demo doesn't resonate, with evidence (not speculation).

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Scenario doesn't differentiate | Tags overlap between roles | All agents get same top decisions | Redesign tag domains; ensure ≥ 2 exclusive high-weight tags per role |
| Scenario too complex | 20+ decisions, audience confused | Demo takes > 2 minutes to explain | Cut to 8-12 decisions, 3-4 agents |
| Supersede moment is underwhelming | Decision change doesn't affect multiple roles | Only 1 agent gets a notification | Choose a decision in `affects` for ≥ 3 agents |
| Audience doesn't relate to domain | Wrong domain for the room | Questions are "what is this?" not "how does this work?" | Use the current auth scenario or tailor domain |

## Exit Criteria

- Scenario satisfies all 5 criteria in "What Makes a Good Demo Scenario"
- Validation checklist passes (≥ 3 agents, ≥ 8 decisions, ≥ 1 supersede, < 30s comprehension)
- Role templates exist or can be created with ≥ 2 exclusive high-weight tags
- Seed function follows `seedSoftwareTeamDemo()` pattern
- Demo output clearly shows different top decisions per role
- Non-technical observer can identify the differentiation without explanation

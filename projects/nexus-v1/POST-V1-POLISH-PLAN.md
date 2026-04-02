# POST-V1-POLISH-PLAN.md — Nexus v1

**Created**: 2026-04-02 15:37 UTC+8
**Objective**: Elevate README, demo, and first-user path from "functional" to "elite" — the kind of artifacts that make people want to use the product.

---

## What "Top-Tier" Means

**README**: A developer reads it and understands the product in 30 seconds, can run it in 60 seconds, and knows exactly what it does differently. No wasted sections. Every sentence earns its place. The "why this exists" hits before the "how to install."

**Demo**: A developer runs it and sees the core claim proven in their terminal — same decisions, different agents, different context — with enough visual clarity that they could screenshot it and show someone.

**First-User Path**: Zero friction from clone to "wow." `docker compose up`, one curl, one SDK call, visible role differentiation. No dead ends, no "coming soon."

---

## Polish Items

### P-1: README Restructure + Upgrade

**What exists**: Functional README (9KB). Covers setup, architecture, API, SDK, scoring, config, dev. Written during ship closure — accurate but flat.

**What needs improvement**:

| Issue | Fix |
|-------|-----|
| Opens with a tagline, then jumps to "What It Does" — the *problem* is never stated | Add a crisp "The Problem" → "The Solution" arc before the feature list |
| "What It Does" is a numbered list of internal mechanics | Rewrite as outcome-oriented: what the *user* gets, not what the code does |
| Architecture diagram is ASCII art with internal package names | Keep it but add a 1-sentence "why this matters" for each layer |
| API reference is a wall of tables | Add response examples for compile endpoint (the money shot) |
| SDK section is code-only, no narrative bridge | Add a 1-sentence explanation before each code block |
| No "Why Nexus?" / differentiation section | Add 3-line comparison: before Nexus vs with Nexus |
| Quick Start says `<repo-url>` placeholder | Remove placeholder, use relative instructions |
| Scoring section buries the insight | Lead with "same decision, different score for different roles" then show the table |
| No compile response example anywhere | Add a concrete ContextPackage JSON snippet showing role differentiation |
| "Proprietary" license at bottom is fine but abrupt | Keep as-is (no change needed) |

**Exit criteria**: A developer with no context reads the README and can articulate: (1) what problem Nexus solves, (2) how it's different from just stuffing everything into context, (3) how to run it, (4) what the compile output looks like — all within 2 minutes.

---

### P-2: Demo Script Clarity Upgrade

**What exists**: `examples/software-team/comparison.ts` (193 lines). 4 sections (baseline vs Nexus vs change propagation vs SDK ergonomics). Runs against live server.

**What needs improvement**:

| Issue | Fix |
|-------|-----|
| Section A (baseline) is hypothetical — it lists decisions but doesn't actually show "same output for every agent" | Make it concrete: compile for 2+ agents without Nexus scoring (raw list), show identical results |
| Section B shows 3 agents but doesn't visually highlight score differences | Add side-by-side score comparison for same decision across roles |
| Console output has no color/emphasis for the "aha moment" | Add ANSI color for scores (green = high, dim = low) and role names |
| Section D (SDK ergonomics) is a misc bag of CRUD calls | Trim to 2-3 most impressive operations. CRUD is not a demo moment. |
| No opening banner or summary of what the demo will prove | Add a 3-line banner at start: "This demo proves..." |
| No timing summary at end | Add total execution time |

**Exit criteria**: Running the demo produces terminal output that clearly shows the core claim without reading the code. A non-technical observer looking at the output would understand "different agents get different context."

---

### P-3: First-User Path Documentation

**What exists**: README Quick Start section (clone → docker compose up → curl health). SDK section with code examples.

**What needs improvement**:

| Issue | Fix |
|-------|-----|
| No end-to-end "first 5 minutes" walkthrough | Add a "Try It" section: start server → seed demo data → compile for 2 roles → see different output |
| Demo script requires separate `npx tsx` invocation with no instructions in README | Add "Run the Demo" section with exact command |
| No curl examples for the compile endpoint | Add curl example showing compile request + abbreviated response |
| SDK install instructions missing (`npm install @nexus-ai/sdk` — but it's a workspace package, not published) | Clarify: SDK is used within the monorepo or linked locally. No npm publish yet. |

**Exit criteria**: A developer can go from zero to seeing role-differentiated compilation output using only the README, in under 5 minutes, with no guesswork.

---

## Execution Order

```
P-1  README restructure + upgrade     ~25 min
P-2  Demo script clarity upgrade      ~20 min
P-3  First-user path (README section) ~10 min  (builds on P-1)
```

P-1 first because it's the entry point. P-2 next because the demo is the proof. P-3 last because it's a README section that references the demo.

---

## What Is NOT In Scope

- No new API endpoints
- No new SDK methods
- No new tests (existing 214 pass — polish doesn't change behavior)
- No Dockerfile/compose changes
- No publishing to npm
- No new features disguised as "polish"

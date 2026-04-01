# NEXUS-KEY-MESSAGING.md

Non-negotiable messaging lines from the spec. Use these verbatim or as close derivatives in README, docs, blog, and launch content. (Spec §1, §18)

---

## Headline

> Decision-aware context for coding-agent teams

Use everywhere: README H1, npm description, GitHub repo description, social bios.

## Subhead

> Different agents need different context. Nexus compiles the right decisions for the right role at the right time.

Use in: README below headline, blog intro, landing page (if built later).

## One-Liner

> Your agents talk. Nexus makes them think together.

Use in: README, tweet thread opener, HN title or first comment.

## Technical Claim

> Vector search finds SIMILAR text. Nexus finds RELEVANT context — based on agent role, task requirements, and a graph of causally connected decisions.

Use in: README "How it's different" section, blog post core argument, HN first comment.

## Demo Message

> Same project. Same decisions. Builder, reviewer, and launch get completely different context packages based on their role and current task.

Use in: README demo section header, demo output intro, comparison walkthrough.

## Competitive Differentiation

| Claim | Evidence |
|-------|---------|
| "Those store memory for SINGLE agents. Nexus coordinates memory across MULTIPLE specialized agents." | Letta/Mem0/Zep are single-agent memory. Nexus has multi-agent role profiles + per-agent compilation |
| "Those use vector similarity search. Nexus uses role-aware relevance scoring + graph traversal." | Nexus scoring: 4 signals (direct affect, tag matching, role relevance, semantic similarity) + graph expansion. Competitors: embedding similarity only |
| "Those treat all stored information equally. Nexus understands that different agents need different context from the same project." | Context Compiler produces different output per role from identical input data |

Source: Spec §1 "What makes this different"

## Key Phrases (Reusable)

- "Zero handoff loss" — closing line of demo, use in taglines
- "Role-aware relevance scoring" — technical description of the compiler
- "Graph of causally connected decisions" — how decisions relate (not just similarity)
- "Decision-aware context compilation" — the full technical name
- "Token-budget-aware packing" — context fits within LLM limits

## README Structure (Spec §18)

The README must follow this structure:
1. Headline + subhead
2. Pain statement (multi-agent memory is broken)
3. Fix (what Nexus does)
4. 60-second quickstart code snippet
5. Demo instructions (`pnpm demo:compare`)
6. Comparison table: vector retrieval vs. Nexus
7. How it works (decision graph → context compiler → change propagator)
8. Role templates (list all 8)
9. Use cases
10. Self-hosting (docker compose)
11. API table (endpoints)
12. Roadmap
13. License (MIT)

## Blog Post Reference (Spec §19 Day 14)

Title: "Why Multi-Agent Memory Is Broken"

Must include:
- Reference to March 2026 position paper (arxiv 2603.10062)
- Before/after demo output
- Explanation of why vector search ≠ relevance
- Technical walkthrough of the scoring algorithm

## Launch Day Schedule (Spec §19 Day 15)

- 7:00 AM ET — Hacker News post
- 7:15 AM ET — Tweet thread
- 7:30 AM ET — Reddit (r/LocalLLaMA, r/MachineLearning)
- 8:00 AM ET — LinkedIn
- Ongoing — respond to every HN comment within 30 min, every GitHub issue within 2 hours

---

## What this changes in execution

Docs and GTM have the exact messaging lines, README structure, and launch schedule. No one invents new taglines or restructures the README. The competitive claims are backed by specific technical evidence from the spec. Eliminates: inconsistent messaging across surfaces, README that buries the value prop, launch content that doesn't reference the demo, competitive claims without evidence.

# NEXUS-SUCCESS-RUBRIC.md

Five things that must be true for Nexus v1 to ship. Derived from Spec §1, §17, §20, §21.

---

## 1. Different Roles Get Different Context

**The core claim.** Same project, same decisions. Builder, reviewer, and launch agents get materially different context packages based on their role and current task.

**How to verify:** Run the comparison demo (Spec §17). Builder's top decisions must differ from reviewer's top decisions. Launch agent must not receive implementation internals. Relevance scores must visibly diverge.

**Source:** Spec §1 ("The killer demo"), §7 (scoring algorithm), §17 (comparison script), §20 (Scenario A)

## 2. Change Propagation Works

**When a decision is created, superseded, or reverted:** affected agents receive role-appropriate notifications with context explaining why it matters to their role. Unaffected agents receive nothing. Context cache is invalidated.

**How to verify:** Supersede a decision → check that builder gets "Check if your implementation aligns," reviewer gets "Review criteria may have changed," launch gets "Public messaging may need updating." (Spec §10, role context map)

**Source:** Spec §10, §17 (propagation section of demo), §20 (Scenario B, C)

## 3. Demo Is Compelling

**`pnpm demo:compare` runs end-to-end** and produces output that clearly shows: (a) baseline vector retrieval gives same results to every agent, (b) Nexus gives different, role-appropriate context. Output must be readable, well-formatted, and self-explanatory.

**How to verify:** Run demo. A developer who has never seen Nexus should understand the value in 60 seconds from the output alone.

**Source:** Spec §17, §19 (Days 6-7)

## 4. Docs Are Clear

**A developer can go from zero to running the demo in under 10 minutes** using only README + quickstart. Concepts doc explains the system to a LangChain/CrewAI-experienced audience without requiring source code reading.

**How to verify:** Fresh clone → follow quickstart → demo runs. No undocumented steps.

**Source:** Spec §18, §19 (Days 11-12)

## 5. One-Command Setup Works

**`docker compose up -d` starts a working Nexus instance** with healthy PostgreSQL (pgvector), migrations applied, API responding on `/api/health`.

**How to verify:** Fresh machine with Docker → clone → `cp .env.example .env` → fill API keys → `docker compose up -d` → `curl localhost:3000/api/health` returns `{"status":"ok"}`.

**Source:** Spec §16, §21 (launch checklist)

---

## What this changes in execution

Every agent can evaluate whether their work contributes to one of these 5 outcomes. If work doesn't serve at least one, it's out of scope or deferred. Eliminates: scope drift toward features that don't serve launch, over-engineering of non-critical paths, under-investing in the demo and docs.

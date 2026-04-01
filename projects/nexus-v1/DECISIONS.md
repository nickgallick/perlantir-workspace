# DECISIONS.md — Nexus v1

---

### Decision: Capability Layer Before Implementation

**Date:** 2026-04-01

**Owner:** Operator (Nick)

**Context:** Nexus v1 is the first project under full Perlantir governance. 56-page spec with dense implementation detail. Risk of agents making spec-contradicting decisions without preparation.

**Decision:** Build a Nexus-specific capability layer before any implementation. Phase 1A: 15 highest-leverage files (4 shared + 11 agent-specific). Phase 1B: 9 additional files. Phase 1C: deferred until post-implementation.

**Trade-offs:** Delays first line of code by ~1 session. Gains: eliminates most rework, prevents spec contradictions, gives every agent a distilled role-appropriate view of the spec.

**Reversibility:** N/A — already executed. Files exist and are additive.

---

### Decision: Phase 1A Scope Compression

**Date:** 2026-04-01

**Owner:** Operator (Nick)

**Context:** Initial Phase 1A had 20 files. Operator directed compression to ~15, optimizing for execution velocity with maximum leverage.

**Options Considered:**
1. Full 20 files — complete but slower
2. Compressed 15 files — highest leverage only, 5 files moved to Phase 1B

**Decision:** 15 files. Removed: Component Dependency Map (derivable), Implementation Patterns (learnable mid-build), Success Criteria (pre-launch not pre-implementation), Runtime Constraints (covered by shared file), Input Validation Spec (needs routes to exist first).

**Trade-offs:** Slightly less preparation for Backend (missing patterns file) and Security (missing per-endpoint validation). Acceptable because algorithm reference + known spec issues cover the critical Backend gaps, and threat model covers Security's blocking concerns.

**Reversibility:** Easy — removed files are defined in Phase 1B and can be built anytime.

---

### Decision: APPROVED — Raw pg Driver, Drop Supabase Client (AMB-1)

**Date:** 2026-04-01 (identified) → 2026-04-01 23:57 UTC+8 (approved)

**Owner:** Operator (Nick)

**Context:** Spec §7, §10, §14 use `@supabase/supabase-js` client syntax. Spec §16 Docker compose connects to raw PostgreSQL. Supabase JS client requires HTTP/PostgREST endpoint — incompatible with raw PostgreSQL connection string.

**Options Considered:**
1. Full Supabase local stack — rejected (8 containers, excessive for a library)
2. **Raw pg driver (node-postgres)** — adopted
3. PostgreSQL + standalone PostgREST — rejected (unnecessary HTTP hop, no value)
4. Supabase cloud — rejected (breaks self-hosted positioning)

**Decision:** Adopt raw `pg` (node-postgres). Remove `@supabase/supabase-js` assumption entirely. Preserve PostgreSQL 16 + pgvector as data layer. Preserve 2-service Docker compose topology. All ~30 Supabase query calls rewritten as parameterized SQL.

**Trade-offs:** ~30 mechanical query rewrites during implementation. No business logic changes. Gains: simplest possible data layer, no intermediary, transparent SQL, ecosystem standard driver.

**Downstream consequences:**
- `NexusConfig`: `supabaseUrl`/`supabaseKey` → `databaseUrl`
- New dependency: `pg` + `@types/pg` (replaces `@supabase/supabase-js`)
- Docker compose: `SUPABASE_URL` → `DATABASE_URL`, remove `SUPABASE_SERVICE_KEY`
- Core classes (`ContextCompiler`, `ChangePropagator`): constructor takes `pg.Pool` instead of `SupabaseClient`
- New file: `packages/core/src/db/client.ts` — pool creation and query helpers

**Reversibility:** Medium. Switching back to Supabase client would require rewriting all queries again. Unlikely to be needed — pg driver is strictly simpler.

**Status:** LOCKED. Full analysis: `projects/nexus-v1/AMB-1-SUPABASE-VS-POSTGRES-DECISION.md`

---

### Decision: pnpm Install Method

**Date:** 2026-04-02

**Owner:** Backend (implementation)

**Context:** Day 1 T1 — `corepack enable` requires elevated filesystem permissions (symlink to /usr/local/bin) which are not available inside the Docker container.

**Decision:** Use `npm install -g pnpm` instead of corepack. Functionally equivalent — pnpm 10.33.0 installed and working.

**Trade-offs:** Minor deviation from ideal corepack flow. No impact on project structure or Dockerfile (which already uses `npm install -g pnpm`).

**Reversibility:** Trivial. If corepack becomes available, switch to it.

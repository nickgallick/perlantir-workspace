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

### Decision: PENDING — Supabase Client vs. Raw PostgreSQL (AMB-1)

**Date:** 2026-04-01 (identified)

**Owner:** Pending operator decision

**Context:** Spec §7, §10, §14 use `@supabase/supabase-js` client syntax. Spec §16 Docker compose connects to raw PostgreSQL. These are incompatible — Supabase JS client needs an HTTP/PostgREST endpoint, not a PostgreSQL connection string.

**Options:** See `projects/nexus-v1/AMB-1-SUPABASE-VS-POSTGRES-DECISION.md`

**Decision:** PENDING — blocks implementation

**Trade-offs:** TBD

**Reversibility:** TBD

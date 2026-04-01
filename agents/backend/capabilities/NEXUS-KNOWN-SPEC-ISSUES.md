# NEXUS-KNOWN-SPEC-ISSUES.md

Bugs, truncations, ambiguities, and inconsistencies found in the Nexus v1 spec code listings. Fix each during implementation — don't debug them later.

---

## Confirmed Bugs

### BUG-1: Missing Comma in `expandGraphContext` Object Literal (Spec §7)

**Location:** `compiler.ts`, inside `expandGraphContext()`, the object literal pushed to `included`:

```typescript
inclusion_reason: `graph_neighbor_depth_${conn.depth}_via_${conn.via_relationship}`
connected_decisions: [sd.decision.id]
```

**Problem:** Missing comma between `inclusion_reason` and `connected_decisions` properties. TypeScript will not compile this.

**Fix:** Add comma after the template literal:
```typescript
inclusion_reason: `graph_neighbor_depth_${conn.depth}_via_${conn.via_relationship}`,
connected_decisions: [sd.decision.id]
```

### BUG-2: Truncated Lines in Role Template Weight Maps (Spec §6)

**Location:** `roles.ts`, multiple role templates have weight map lines truncated by PDF/text extraction:

```
reviewer: ['security', 'architecture', 'testing', 'code_quality', 'code', 'vulnerabil
ops: ['infrastructure', 'deployment', 'config', 'monitoring', 'security', 'perfo
challenge: ['challenge', 'scoring', 'judge', 'benchmark', 'calibration', 'discriminati
```

**Problem:** These appear in `computeRoleRelevance()` in §7 (the `roleTagMap`). The actual role template weight objects in §6 appear to be complete, but the `roleTagMap` in §7 has truncated array values.

**Fix:** Reconstruct from the complete weight maps in §6:
- `reviewer` tags: `['security', 'architecture', 'testing', 'code_quality', 'code', 'vulnerability']`
- `ops` tags: `['infrastructure', 'deployment', 'config', 'monitoring', 'security', 'performance']`
- `challenge` tags: `['challenge', 'scoring', 'judge', 'benchmark', 'calibration', 'discrimination']`

Verify each by checking which tags have weight > 0 in the corresponding §6 role template.

### BUG-3: Truncated `computeFreshness` Line (Spec §7)

**Location:** `compiler.ts`, inside `computeFreshness()`:

```
const ageHours = (now - new Date(decision.validated_at).getTime()) / (1000 * 60 * 6
return Math.exp(-validatedAge / (30 * 24));
```

**Problem:** The divisor `(1000 * 60 * 6` is truncated. Should be `(1000 * 60 * 60)` (milliseconds to hours).

**Fix:**
```typescript
const validatedAge = (now - new Date(decision.validated_at).getTime()) / (1000 * 60 * 60);
```

Also note: the variable is named `validatedAge` but the line starts with `const ageHours` — use `validatedAge` to match the return statement.

### BUG-4: Truncated Lines in Formatter (Spec §9)

**Location:** `formatter.ts`, multiple lines truncated:

```
lines.push(`   By: ${d.made_by} | Confidence: ${d.confidence} | ${d.created_at.split('T'
```

**Problem:** Template literal not closed. Missing `[0]}` and closing backtick.

**Fix:**
```typescript
lines.push(`   By: ${d.made_by} | Confidence: ${d.confidence} | ${d.created_at.split('T')[0]}`);
```

Similar truncation in artifact formatter:
```
lines.push(`   By: ${a.produced_by} | Updated: ${a.updated_at?.split('T')[0] || 'unkno
```

**Fix:**
```typescript
lines.push(`   By: ${a.produced_by} | Updated: ${a.updated_at?.split('T')[0] || 'unknown'}`);
```

### BUG-5: Truncated Token Estimation Lines (Spec §8)

**Location:** `packer.ts`:

```
function artifactTokens(sa: ScoredArtifact): number {
  const a = sa.artifact;
  return estimateTokens([a.name, a.description || '', a.content_summary || '', a.path || ''].
}
```

and:

```
function sessionTokens(s: SessionSummary): number {
  return estimateTokens([s.topic, s.summary, s.assumptions.join(' '), s.open_questions.join('
}
```

**Problem:** Array `.join(' ')` calls are truncated.

**Fix:**
```typescript
return estimateTokens([a.name, a.description || '', a.content_summary || '', a.path || ''].join(' '));
```
```typescript
return estimateTokens([s.topic, s.summary, s.assumptions.join(' '), s.open_questions.join(' ')].join(' '));
```

---

## Ambiguities

### AMB-1: Supabase Client vs. Direct pg — RESOLVED

**Decision (LOCKED):** Adopt raw `pg` (node-postgres). Drop `@supabase/supabase-js`.

All spec query patterns using `.from().select().eq()` must be rewritten as parameterized SQL via `pg.Pool`. `.rpc()` calls become direct `pool.query('SELECT * FROM function_name($1, $2)', [args])`. `.upsert()` becomes `INSERT ... ON CONFLICT ... DO UPDATE`.

This affects ~30 query calls across compiler.ts, propagator.ts, and app.ts. The business logic is unchanged — only the database access layer changes.

See: `projects/nexus-v1/AMB-1-SUPABASE-VS-POSTGRES-DECISION.md`

### AMB-2: Session Summaries API Routes

The spec defines `session_summaries` table (§4) and types (§5), and the compiler can query them (§7), but there are no API routes for creating/listing session summaries in §14. The distillery (§11) is post-launch.

**Resolution:** Sessions are opt-in and post-launch. Create the table but don't build routes in v1. The compiler's session query path exists but is gated by `include_sessions === true` (default false).

### AMB-3: API Key Authentication

The spec defines an `api_keys` table (§4) and mentions `auth.ts` middleware in the file structure (§3), but doesn't provide the auth middleware implementation.

**Resolution:** OPEN decision for Architect/Security. Must be implemented before launch but implementation is not specified.

### AMB-4: `PackResult` Import in Formatter

Spec §9 shows the formatter importing `PackResult` from types, but the `PackResult` type is defined in the packer context, not in `types.ts`. The import line is truncated:

```
import { Agent, ScoredDecision, ScoredArtifact, Notification, SessionSummary, PackResult } fr
```

**Resolution:** Either add `PackResult` to `types.ts` or import from `./packer`. Prefer `types.ts` for cleanliness since `PackResult` is used across modules.

### AMB-5: WebSocket Handler Not Specified

The file structure (§3) includes `packages/server/src/ws/handler.ts`, but no code is provided. The `ChangePropagator` (§10) uses a `wsClients: Map<string, WebSocket>` but the server-side WS setup is not in §14.

**Resolution:** OPEN decision. WS handler must: accept connections, authenticate, register with propagator, handle disconnect cleanup.

---

## What this changes in execution

Backend fixes 5 confirmed bugs on first implementation pass instead of discovering them during debugging. 5 ambiguities are identified upfront with recommended resolutions — no mid-implementation confusion. Estimated savings: 2-4 hours of debugging + 1-2 escalation rounds.

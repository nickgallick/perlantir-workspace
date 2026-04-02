# SKILL-DEMO-SCRIPT-AUTHORING

## Purpose

Write and maintain demo scripts that showcase Nexus capabilities through the SDK with clear console output, compelling before/after contrast, and minimal setup burden. The demo script is the primary "show, don't tell" artifact — it must work flawlessly and convey the value proposition in under 2 minutes.

## When to Use

- Demo script broken by API change
- New Nexus feature needs to be showcased
- Preparing for conference talk or live demo
- Writing README quickstart that references demo output
- New audience-specific scenario (see SKILL-DEMO-SCENARIO-CURATION)

## Inputs Required

**Current demo (source of truth):**
- `examples/software-team/comparison.ts` — 4-section demo script
- `packages/sdk/src/client.ts` — `seedSoftwareTeamDemo()`, all SDK methods

**What the demo must prove:**
- `projects/nexus-v1/shared/ROLE-DIFFERENTIATION-PROOF.md` — numeric proof
- `projects/nexus-v1/shared/NEXUS-SYSTEM-INVARIANTS.md` — INV-1 (Role Differentiation)

**Messaging framing:**
- `agents/docs/capabilities/NEXUS-KEY-MESSAGING.md` — demo message, key phrases, closing line

## Execution Method

### Demo Script Architecture (4 Sections)

The current `comparison.ts` follows this structure. All future demo scripts must follow it:

**Section A — Baseline (what you have today):**
- Show that naive retrieval returns identical results for every agent
- Use `listDecisions()` to show the same flat list regardless of role
- Console output: "Returns the same N results for EVERY agent"
- End with explicit problems list (identical results, no reasoning, no graph)

**Section B — Nexus (the fix):**
- Compile for 3 different roles against the same task
- Show: different scores, different ordering, different top decisions
- Console output: agent name, task, top decisions with scores, formatted excerpt
- This is the "aha" section — spend the most lines here

**Section C — Change Propagation (the differentiator):**
- Supersede a decision (e.g., SSO scope change)
- Show role-specific notifications for each affected agent
- Recompile to show updated context reflects the change
- Console output: old → new, per-role notification with role_context

**Section D — Ergonomics (the polish):**
- Show edge CRUD, artifact CRUD, graph traversal, typed error handling
- Prove the SDK is pleasant to use, not just functional
- Console output: concise demonstrations of each capability

### Console Output Rules

**Formatting standards:**
```typescript
// Section headers
console.log('━'.repeat(70));
console.log(`  SECTION TITLE`);
console.log('━'.repeat(70));

// Key-value output
console.log(`   Decisions: ${ctx.decisions_included}/${ctx.decisions_considered} included`);
console.log(`   Tokens: ${ctx.token_count}`);

// Score tables
console.log(`     ${score.toFixed(3)} │ ${decision.title}`);

// Formatted context excerpts (indented, first 15 lines)
for (const line of ctx.formatted_markdown.split('\n').slice(0, 15)) {
  console.log(`   │ ${line}`);
}
```

**Rules:**
- Use `━` (box drawing) for section separators, not `-` or `=`
- Indent content with `   ` (3 spaces) for visual hierarchy
- Show scores to 3 decimal places: `score.toFixed(3)`
- Truncate formatted output to 15 lines with `...` indicator
- Use emoji sparingly: `✅` for success, `✗` for problems, `🔧` for setup

### Startup Pattern

Every demo script must begin:

```typescript
// 1. Health check
try {
  const h = await nx.health();
  console.log(`   Server: ${h.status} | DB: ${h.dependencies.database} | v${h.version}`);
} catch (e) {
  if (e instanceof NexusApiError) {
    console.error(`   Server error (${e.status}/${e.code}): ${e.serverMessage}`);
  } else {
    console.error(`   Cannot reach server at ${SERVER_URL}. Is it running?`);
  }
  process.exit(1);
}

// 2. Seed data
const { project, agents, decisions } = await nx.seedSoftwareTeamDemo();
```

Source: `comparison.ts` lines 1-50.

**Why health check first**: If the server isn't running, the user gets "Cannot reach server" immediately instead of a cryptic `fetch failed` 30 seconds into the demo.

### Maintaining the Demo After API Changes

When the SDK API changes:

1. **New method added**: Add to Section D if it demonstrates value. Most new methods don't need demo coverage.
2. **Method signature changed**: Update all calls in the demo. Run the script end-to-end.
3. **New field in ContextPackage**: Show it if it's user-facing (e.g., new scoring signal). Skip if internal.
4. **Seed data changed**: Re-verify that sections B and C still show clear differentiation. Adjust decision titles/tags if needed.
5. **Error envelope changed**: Update Section D error handling showcase.

**After any change, run the full demo end-to-end against a live server.** Console output must be reviewed visually — automated tests verify behavior, not presentation.

### What NOT to Do

- **Do not add sections E, F, G.** 4 sections is the maximum. If new capability needs showcasing, replace or shorten an existing section.
- **Do not show raw JSON in demo output.** Format scores, titles, and stats. JSON blobs are unreadable in a terminal.
- **Do not require manual setup steps beyond "start server + run script."** The seed function handles all data creation.
- **Do not use `console.log(JSON.stringify(obj, null, 2))` for large objects.** Extract and format the fields that matter.
- **Do not suppress errors with empty catch blocks.** Use `NexusApiError` handling and show the error clearly.
- **Do not demo features that aren't implemented.** Every demo call must succeed against the current server.

### Launch-Grade Path

Minimum standard for the demo script to be public-facing:

1. **Runs end-to-end without errors** against a fresh server with migrated DB
2. **Health check with clear failure message** if server unreachable
3. **Section B clearly shows ≥ 3 roles getting different top decisions** — this IS the product
4. **Section C shows ≥ 1 supersede with role-specific notifications** — this is the differentiator vs competitors
5. **Console output is readable without code context** — a non-developer watching the terminal can follow it
6. **Cleanup or idempotent** — running twice doesn't crash (seed creates new project each time)
7. **Exit code 0 on success, 1 on failure** — scriptable in CI/demo pipelines
8. **Server URL configurable via env var** — `NEXUS_URL` defaults to `http://localhost:3000`
9. **No hardcoded API keys** — `NEXUS_API_KEY` from env or omit for dev mode
10. **Execution path documented in script header comments**:
    ```
    // 1. Start PostgreSQL + run migrations
    // 2. Start the Nexus server
    // 3. Run: npx tsx examples/software-team/comparison.ts
    ```

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Demo crashes mid-run | API change broke a call | Script exits with error | Update call to match current API |
| Output shows identical scores for all roles | Seed data `affects` arrays changed | Section B output visually identical | Verify seed decisions have role-specific `affects` |
| Supersede section shows no notifications | Propagator not called in route handler | Section C output empty for notifications | Verify server route calls `propagator.onDecisionSuperseded` |
| Demo takes > 30 seconds | Too many decisions or slow DB | Time the run | Reduce seed data or optimize queries |
| "Cannot reach server" immediately | Server not started | Health check error on startup | Start server before running demo |

## Exit Criteria

- Demo runs end-to-end with exit code 0 against live server
- Health check produces clear pass/fail on startup
- Section B shows ≥ 3 roles with visibly different top decisions and scores
- Section C shows supersede with ≥ 2 role-specific notifications
- Console output readable without code context
- Script header documents execution path
- Server URL and API key configurable via environment
- Re-runnable without cleanup (creates new project each time)

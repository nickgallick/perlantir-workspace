# CHECKPOINT — Nexus v1

---

## Schema and Provenance

```
schema-version      : 1.0.0
checkpoint-id       : 005
prior-checkpoint-id : 004
last-writer         : Governor
last-updated        : 2026-04-02 03:52 UTC+8
active-owner        : Governor
lock-status         : UNLOCKED
```

---

## Project and Phase

```
project             : Nexus v1
phase               : Day 4 — Context Compiler (Assembly)
approval-category   : 2
approval-phrase     : "Day 4 Approved — Context Compiler (Assembly)"
approval-timestamp  : 2026-04-02 03:45 UTC+8
approved-scope      : Full assembly layer — compile pipeline, graph expansion, packer, formatter, integration tests
approval-freshness  : FRESH
lifecycle           : COMPLETED
status              : PHASE-COMPLETE
session-termination : CLEAN
recovery-mode       : NORMAL
```

---

## Deliverables

### Day 4 Output (4 new files, 2 updated)

**Context Compiler — Assembly:**
- [x] `packages/core/src/context-compiler/compiler.ts` — Full compile pipeline + expandGraphContext
- [x] `packages/core/src/context-compiler/packer.ts` — Token budget packing with priority cascade
- [x] `packages/core/src/context-compiler/formatter.ts` — Markdown + JSON output formatters

**Exports:**
- [x] `packages/core/src/context-compiler/index.ts` — Updated barrel exports
- [x] `packages/core/src/index.ts` — Updated public API exports

**Tests:**
- [x] `packages/core/tests/compiler.test.ts` — 25 tests (8 packer, 5 formatter, 12 integration)

**Proof Lock:**
- [x] `projects/nexus-v1/ROLE-DIFFERENTIATION-PROOF.md` — Permanent artifact: fixtures, outputs, analysis
- [x] `packages/core/tests/role-differentiation.test.ts` — 11 regression assertions

### Verification

- Build: 3/3 packages, zero TypeScript errors
- Tests: 126/126 pass (17 setup + 3 migrator + 27 decision-graph + 43 scoring + 25 compiler + 11 role-differentiation)
- No regressions in any prior test file

---

## Deviations

1. **Freshness score drift in determinism test**: Initial test compared scores from two compile calls with default `now`. Between calls, time advances ~10ms, causing freshness to drift at ~10⁻⁸ precision. Fixed by passing explicit `now` option. Not a code bug — test isolation issue.

No other deviations from approved scope.

---

## Correction Applied

Per operator directive (2026-04-02 03:45 UTC+8): completion standard tightened.
- Do not mark a phase complete if any unresolved signal exists
- Required sequence: detect → resolve/classify → re-run verification → declare with clean state
- Enforced going forward

---

## Next Phase

Day 5: Critical Test (THE scenario test: 3 agents, 10 decisions) + Change Propagator.
Requires explicit approval.

---

## Architecture Notes

### compile() Pipeline Order
1. fetchAgent (pg)
2. fetchProjectDecisions (pg, filters by status)
3. Generate task embedding (optional, via embeddingFn)
4. scoreDecisions (pure, all 5 signals)
5. expandGraphContext (pg, graph traversal, score decay 0.6^depth)
6. fetchAndScoreArtifacts (pg, scored by related decision scores)
7. fetchNotifications (pg, unread only)
8. fetchSessions (pg, opt-in, lookback window)
9. packIntoBudget (pure, priority cascade 10/55/30/5)
10. formatAsMarkdown + formatAsJson (pure)

### Token Budget Priority Cascade
| Priority | Category | Base % | Overflow |
|----------|---------|--------|----------|
| 1 | Notifications | 10% | → Decisions |
| 2 | Decisions | 55% + overflow | → Artifacts |
| 3 | Artifacts | 30% + overflow | → Sessions |
| 4 | Sessions | Remainder | — |

### Graph Expansion
- Threshold: combined_score ≥ 0.25 triggers expansion
- Decay: neighbor_score = parent_score × 0.6^depth
- Skip: if neighbor already scored higher independently
- Max depth: per agent's `relevance_profile.decision_depth`

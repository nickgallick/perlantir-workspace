# SKILL-NEXUS-DECISION-HYGIENE.md

**Purpose**: Rules for recording decisions. Ensure decisions are clean, complete, queryable, and valuable.

**When to Use**: Before calling createDecision(). When evaluating whether something deserves a decision record.

---

## What Deserves a Decision Record

**YES**:
- Operator approves a design choice
- Specialist resolves an architectural question
- Phase discovers a better approach (supersedes prior)
- Postmortem identifies a lesson
- System constraint discovered
- Trade-off accepted

**NO**:
- File edits
- Test fixes
- Formatting changes
- Routine task completion
- Process steps
- Heartbeat activities

---

## Decision Record Format

```json
{
  "title": "One line, specific decision name",
  "description": "Why was this decided? What alternatives existed?",
  "made_by": "operator | governor | architect | backend | qa | ...",
  "status": "pending | active | superseded | reverted",
  "tags": ["phase-a", "integration", "specific-domain"],
  "context": "Justification, constraints, tradeoffs, reasoning",
  "created_at": "ISO timestamp (auto-generated)",
  "id": "UUID (auto-generated)"
}
```

---

## Quality Checklist (Before Recording)

- [ ] **Title** is clear and specific (not vague)
  - ✅ "Use raw pg.Pool for database client"
  - ❌ "Database decision"

- [ ] **made_by** is accurate (who actually decided)
  - ✅ "backend" (engineer made the choice)
  - ❌ "governor" (Governor didn't decide, just recorded)

- [ ] **status** is correct (what stage is the decision in)
  - ✅ "active" (decision was approved and is being followed)
  - ❌ "pending" (unless truly waiting for approval)

- [ ] **tags** are relevant (for future scoring + querying)
  - ✅ ["phase-a", "integration", "sdk-methods"]
  - ❌ ["todo"] (not specific enough)

- [ ] **context** explains WHY (rationale)
  - ✅ "Raw pg.Pool chosen over Supabase SDK for lower-level control and support for pgvector + custom migrations"
  - ❌ "We decided to use pg"

- [ ] **Edges** link to related decisions (if any)
  - If superseding: create edge from old to new
  - If dependent: create edge showing dependency
  - If refining: create edge showing refinement

---

## Decision Queries (For Context Compilation)

**Governor will query decisions by**:
- Project (perlantir)
- Tags (["phase-a"])
- Agent role (architect, backend, qa)
- Status (active, superseded)
- Recency (last 14 days)

**Decisions must be tagged well** for scoring algorithm to find them.

---

## Supersede Pattern

**When a new decision supersedes an old one**:

```
Old Decision A: "Use Supabase SDK for database"
  status: "active"

New Decision B: "Use raw pg.Pool for database"
  status: "active"
  context: "Supabase SDK lacks pgvector + custom migration support"

Edge: A → B
  type: "supersedes"

Update A:
  status: "superseded"
  (now scores lower in context compilation, 0.4 penalty)
```

Both remain in the graph. A is visible but lower-scored. Audit trail is preserved.

---

## Decision Linked to Code

**When decision drives implementation**:

```
Decision: "SDK methods use async/await, not streams"
  made_by: "backend"
  tags: ["sdk", "implementation", "async"]

Code change: packages/sdk/src/client.ts
  Comment: "Decision: Use async/await for compile/createDecision"
  Reference: Link decision ID if available

Test: Confirms async behavior
  Comment: "Verifies async/await decision"
```

Decisions should be traceable in code.

---

**END SKILL-NEXUS-DECISION-HYGIENE**

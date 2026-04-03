# GOVERNOR-PHASE-TYPES.md

**Purpose**: Taxonomy of phase types and their execution patterns.

---

## Phase Types

### Type 1: Design Phase

**What**: Spec, protocol, architecture, plan
**How long**: Hours to days
**Specialist**: Architect
**Output**: Specification document
**Success**: Clear, unambiguous, executable by others
**Evidence**: None (design is not execution)
**Can be blocked?**: No (design doesn't require environment)

Example: PHASE-A-INTEGRATION-PROTOCOL.md (design phase, complete, not blocked)

---

### Type 2: Live Execution Phase

**What**: Real system call + real response + observable state change
**How long**: Minutes to hours (depends on environment)
**Specialist**: Engineer, Operator, Governor
**Output**: Evidence + state change
**Success**: State persisted, effect observable, repeatable
**Evidence**: Yes (real evidence collected)
**Can be blocked?**: Yes (environment dependency)

Example: First compile() call (live execution, blocked on DB)

---

### Type 3: Implementation Phase

**What**: Write code against a spec
**How long**: Hours to days
**Specialist**: Engineer
**Output**: Code + tests
**Success**: All tests pass, no regression, matches spec
**Evidence**: Yes (code works or doesn't)
**Can be blocked?**: Yes (if requires live environment for testing)

Example: Implement SDK methods based on protocol

---

### Type 4: Verification Phase

**What**: Prove that implementation matches spec
**How long**: Hours
**Specialist**: QA, Engineer
**Output**: Test results + evidence
**Success**: Spec requirements met, before/after diffs, measurable proof
**Evidence**: Yes (real evidence of functionality)
**Can be blocked?**: Yes (if implementation incomplete)

Example: Verify supersede changes compile output

---

### Type 5: Decision Recording Phase

**What**: Record decisions made during other phases
**How long**: Minutes (per decision)
**Specialist**: Governor (after specialist work complete)
**Output**: Decisions in system
**Success**: Decisions persisted, queryable, linked
**Evidence**: Yes (decisions in DB)
**Can be blocked?**: Yes (requires live DB)

Example: Record that SDK implementation chose async/await pattern

---

## Phase Sequencing

**Design → Implementation → Verification → Decision Recording**

Or:

**Design (blocked?) → Live Execution → Verify → Record**

Or:

**Live Execution → Verify → Record → Next Phase**

---

## Phase Completion Criteria

**Design Phase**:
- Specification is clear, unambiguous, complete
- Someone else could implement it without questions
- No blockers

**Live Execution Phase**:
- System call executed and responded
- State change observable and persisted
- Effect measurable
- No environment blockers remaining

**Implementation Phase**:
- Code complete
- All tests pass (no regression)
- Matches specification

**Verification Phase**:
- Spec requirements proven
- Evidence logged
- Before/after states documented

**Decision Recording Phase**:
- Decisions persisted in DB
- Queryable, have IDs
- Linked via edges

---

## Phase Boundaries (Enforcement)

**No auto-progression**: Phase N+1 does not start because Phase N is done.

**Explicit approval required**: "Approve Phase N+1 execution" (not assumed).

**Each phase has exit criteria**: Must be met before next phase starts.

---

**END GOVERNOR-PHASE-TYPES**

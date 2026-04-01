# CHANGE-CLASSIFICATION-AND-APPROVALS.md

## Purpose
Define how changes are classified and what approvals each category requires. Clear authority boundaries prevent chaos and ensure operator remains in control.

---

## Change Categories

### Category 1: Research
**Definition**: Exploration, investigation, fact-finding. No code changes, no decisions made.

**Examples**:
- Web research on topic X
- Codebase analysis
- Feasibility study
- Benchmark investigation
- Requirements gathering

**Authority Required**: None (implicit approval in session context)

**Output**: Report, findings, recommendations

**Timeline**: Can iterate quickly; no approval needed for iteration

**Approval Gate**: None before execution
- [ ] Can start immediately
- [ ] Report findings to operator
- [ ] Operator decides next step

**Example**:
```
Research: Current TypeScript version and ecosystem

Output: Report on latest versions, breaking changes, migration path

Next phase: Operator decides to upgrade or not
```

---

### Category 2: Proposal
**Definition**: Design, planning, hypothesis. No code yet. Operator input crucial.

**Examples**:
- Architecture design
- API specification
- Feature design
- Workflow proposal
- Standard improvement proposal

**Authority Required**: Implicit (research context)

**Output**: Detailed proposal with justification

**Timeline**: Propose, get feedback, refine, propose again

**Approval Gate**: Operator reviews and approves design before implementation
- [ ] Create proposal
- [ ] Operator reviews and provides feedback
- [ ] Refine based on feedback
- [ ] Operator approves (implicit or explicit)
- [ ] Ready for implementation phase

**Example**:
```
Proposal: Add SecurityAuditor specialist agent

Output: Detailed proposal with:
- What it does
- When it runs
- How it integrates
- Resource requirements
- Justification

Next: Operator reviews; if approved, Phase X (implementation) begins
```

---

### Category 3: Draft
**Definition**: Partial implementation or work-in-progress. Not finished, not approved for use.

**Examples**:
- First draft of a standard
- Incomplete feature
- Draft documentation
- Trial implementation
- Proof of concept

**Authority Required**: Explicit review + feedback loop

**Output**: Draft for operator feedback

**Timeline**: Iteration cycle

**Approval Gate**: Operator reviews draft; provides feedback
- [ ] Create draft
- [ ] Operator reviews
- [ ] Operator provides feedback
- [ ] Agent refines
- [ ] Repeat until ready for implementation

**Example**:
```
Draft: VERIFICATION-STANDARD.md (first version)

Process:
1. Agent creates draft (covers 80% of cases)
2. Operator reviews: "Good, but missing edge case X and Y"
3. Agent refines
4. Operator reviews again: "Looks good, ready"
5. Ready for full implementation
```

---

### Category 4: Implementation
**Definition**: Full execution of approved design. Code, configs, significant changes.

**Examples**:
- Implementing approved feature
- Deploying infrastructure
- Creating new files per specification
- Executing approved standard/workflow changes
- Major refactoring

**Authority Required**: Explicit approval of phase scope

**Output**: Complete deliverables per specification

**Approval Gate**: Explicit "Approved. Execute Phase X only." before starting
- [ ] Scope statement created
- [ ] Operator approves scope (with specific approval phrase)
- [ ] Execution begins
- [ ] No scope changes without new approval

**Example**:
```
Phase 5 Scope: Create 19 standards files

Approval required: "Approved. Execute Phase 5 only."

Execution: Create all 19 files with full content

No: Cannot change scope mid-phase without asking first
```

---

### Category 5: Verification
**Definition**: Testing, validation, quality assurance of completed work.

**Examples**:
- Running test suite
- Code review
- Smoke testing
- Security review
- Performance verification

**Authority Required**: Implicit (part of implementation phase)

**Output**: Test results, review notes, pass/fail evidence

**Approval Gate**: No approval gate; verification is required before "done"
- [ ] Tests run as part of phase completion
- [ ] Results reported
- [ ] If failing: Escalate (back to implementation)
- [ ] If passing: Supports "done" claim

**Example**:
```
Phase 5 Implementation: Complete

Verification:
- All 19 files created? Yes
- Content is substantive? Yes
- Integration notes present? Yes
- No extra files? Yes

Result: Verification passes; phase complete
```

---

### Category 6: Release / Deployment
**Definition**: Making changes live to users or production systems.

**Examples**:
- Deploying code to production
- Publishing public documentation
- Releasing new feature
- Deploying infrastructure changes
- Making external announcements

**Authority Required**: Explicit operator approval + verification complete

**Output**: Change deployed; system updated

**Approval Gate**: Operator approval required before deploying
- [ ] Implementation complete + verified
- [ ] Rollback plan documented
- [ ] Operator reviews and approves deployment
- [ ] Execute deployment
- [ ] Confirm deployment successful

**Example**:
```
Ready to Release: Feature X (fully tested, reviewed)

Request: "Ready to deploy to production. Rollback: git reset HEAD~3"

Operator: "Deploy when you're ready" (approval)

Execution: Deploy to production; confirm successful
```

---

## Approval Categories by Change Type

### Minimal Risk (Category 0) Changes
**Examples**: Comments, README, documentation, non-critical config

**Approval**: None required
- Can execute during session without explicit approval
- Operator is implicitly aware (in session context)

---

### Low Risk (Category 1) Changes
**Examples**: New tests, minor features, logging, refactoring

**Approval**: Phase scope approval
- Operator approves scope statement in session
- "Sounds good, go ahead" = approval

---

### Medium Risk (Category 2) Changes
**Examples**: API changes, database migrations, auth changes, feature flags

**Approval**: Explicit phase approval
- Operator provides explicit approval phrase: "Approved. Execute Phase X only."
- Scope statement recorded
- No mid-phase scope changes

---

### High Risk (Category 3) Changes
**Examples**: Secrets, billing, security, infra, external claims

**Approval**: Explicit written approval + risk assessment
- Operator reviews scope
- Operator reviews risk assessment
- Operator explicitly approves
- Written record of approval
- Often requires additional stakeholder review (attorney, security, etc.)

---

## Approval Flow by Category

### Research → Proposal → Implementation

```
Research (implicit)
  ↓ (findings)
Proposal (review & feedback)
  ↓ (approval)
Implementation (Phase X)
  ↓ (verification)
Verification (pass/fail)
  ↓ (if pass)
Release / Deploy (approval)
  ↓
Done
```

### Example: Add New Feature

```
1. Research Phase (implicit)
   - Investigate requirements
   - Research similar features
   - No approval needed

2. Proposal (review required)
   - Design feature
   - Get operator feedback
   - Iterate on design

3. Implementation Phase (explicit approval)
   - Approval: "Approved. Execute Phase 5 (Feature X) only."
   - Implement per design
   - Create tests
   - No scope changes mid-phase

4. Verification (no approval, but required)
   - Run tests: Pass or fail
   - Code review: Complete
   - If pass: Ready for release

5. Release (approval required)
   - Approval: "Deploy when ready"
   - Deploy to production
   - Confirm success
```

---

## Scope Change Protocol

### Mid-Phase Scope Change Request

**Scenario**: During implementation, you discover need for extra work.

**Process**:
1. Pause current phase
2. Propose new scope (what needs to be added, why)
3. Wait for operator decision

**Options**:
- A) Extend current phase scope (requires new approval)
- B) Finish current phase, defer to next phase
- C) Change approach to fit current scope

**Example**:
```
Current Phase: Implement API endpoint

During implementation, discover: We also need migration script for existing data

Options:
A) Extend scope: "Also create migration script (adds 2h)"
   Requires new approval

B) Defer migration: "Defer migration script to Phase 7"
   Current phase stays focused

C) Workaround: "Use schema default; migration not needed"
   Simpler, fits current scope

Waiting for operator decision...
```

---

## Approval Records

### What Gets Recorded

For any Category 2+ change:
- **Approval phrase**: Exact text operator provided
- **Approval date/time**: When approval was given
- **Scope statement**: What was approved
- **Execution results**: What was actually delivered
- **Any deviations**: If scope changed

### Where Approval is Recorded
- **Session memory**: Session notes (temporary)
- **MEMORY.md**: Major decisions (long-term)
- **Commit messages**: If using git (permanent)
- **Phase completion summary**: What was delivered

**Example**:
```
Phase 5 Approval Record

Approval: "Approved. Execute Phase 5 only." (April 1, 2026, 12:22 UTC)
Scope: Create 19 standards files + 3 memory files
Delivered: 19 + 3 files, all substantive
Verification: All files created, no extra files
Status: Complete, no deviations
```

---

## When to Ask for Approval

### Always Ask If
- [ ] Making changes to core system files (SOUL.md, AGENTS.md, etc.)
- [ ] Changing approval requirements or escalation thresholds
- [ ] Adding/removing features from system
- [ ] Mid-phase scope changes
- [ ] Deployment to production
- [ ] Any high-risk category work

### Don't Need to Ask If
- [ ] Research or investigation (implicit)
- [ ] Creating proposed design (implicit review follows)
- [ ] Low-risk, within normal workflow
- [ ] Continuation of already-approved phase

---

## Common Approval Mistakes

### ❌ Assuming Approval
```
"You seemed interested in this, so I started implementing"
(No explicit approval for implementation)
```

### ❌ Changing Scope Without Asking
```
"Phase scope was X, but I also did Y and Z"
(Scope creep without approval)
```

### ❌ Continuing After Scope Unclear
```
"I'm not sure what you want, but I'll implement something"
(Unclear scope; should ask first)
```

### ❌ Deploying Without Approval
```
"Changes are done and live in production"
(Release approval required)
```

---

## Approval Checklist

Before starting any Category 2+ work:

- [ ] Is this a research phase? (No approval needed, implicit)
- [ ] Is this a proposal? (Operator review, then approval)
- [ ] Is this implementation? (Explicit approval required with phrase)
- [ ] Do I have explicit approval? (Or doing something that doesn't need it?)
- [ ] Is approval still valid? (>24h old, should re-confirm)
- [ ] Could scope change? (Flag for new approval if so)
- [ ] Is this being deployed? (Separate approval needed)

---

## Integration with Other Standards

- **ENGINEERING-EXECUTION.md**: Phase-based execution; each phase needs approval
- **RISK-AND-ESCALATION-STANDARD.md**: Risk level determines approval tier
- **SELF-IMPROVEMENT-POLICY.md**: System improvements require approval
- **TOOL-USE-POLICY.md**: Risky tool use requires approval

---

## Key Principle

**Clear authority boundaries prevent chaos.**

Research: Free to explore
Proposal: Needs review
Implementation: Needs explicit approval
Release: Needs explicit approval

Never assume. Always ask if unsure.

Non-negotiable: No Category 2+ work without explicit approval.

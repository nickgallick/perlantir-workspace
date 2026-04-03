# CHECKLIST-MINIMAL-ARTIFACTS.md

**Purpose**: Verify you're creating only necessary artifacts. Delete ceremony.

**When to Use**: Before creating any new document. During cleanup.

---

## Before Creating Artifact

- [ ] This artifact is explicitly required by standards/governance?
  - YES: Create (Tier 1)
  - NO: Continue
- [ ] Will another session need this to resume?
  - YES: Create (Tier 1 state file)
  - NO: Continue
- [ ] Is this output of work, or a document about work?
  - Output (code, spec, decision): Create
  - About work (summary, report, review): Do NOT create
- [ ] Does this serve execution or describe execution?
  - Serves (specs, contracts, skills): Maybe create (Tier 2)
  - Describes (reports, summaries, overviews): Do NOT create
- [ ] Would STATUS.md capture this information?
  - YES: Don't create, put in STATUS.md
  - NO: Maybe create (re-evaluate if Tier 1 or 2)

**If uncertain**: Do not create.

---

## What NOT To Create (Delete These)

- [ ] ❌ Execution summaries
- [ ] ❌ Planning completion reports
- [ ] ❌ State preservation reports
- [ ] ❌ Index/navigation files
- [ ] ❌ Context packages (except real system output)
- [ ] ❌ Decision logs (except in decision table)
- [ ] ❌ Completion reports
- [ ] ❌ How-to documents
- [ ] ❌ Tutorial docs
- [ ] ❌ Generic best-practices guides

---

## What TO Create (Tier 1, Always)

- [ ] ✅ STATUS.md (evidence + state)
- [ ] ✅ CHECKPOINT.md (recovery point)
- [ ] ✅ MEMORY.md (updated if state changed)
- [ ] ✅ Specialist contracts (only before dispatch)
- [ ] ✅ Specifications (only if >1 specialist implements)

---

## What TO Create (Tier 2, If Needed)

- [ ] ✅ Capability files (foundational behavior)
- [ ] ✅ Skill files (reusable techniques)
- [ ] ✅ Playbook files (multi-step workflows)
- [ ] ✅ Checklist files (verification gates)

---

## Artifact Cleanup

**Review created artifacts**:
- [ ] Count how many artifacts exist
- [ ] For each non-Tier-1 artifact, ask: "Does this serve execution?"
  - YES: Keep it
  - NO: Delete it

**Target**: <25 total Governor-related artifacts

---

**END CHECKLIST-MINIMAL-ARTIFACTS**

# CHECKLIST-REPO-TRUTH-ALIGNMENT.md

**Purpose**: Verify all claims are backed by Git source of truth.

**When to Use**: Before reporting evidence, status, or completion. Daily.

---

## Source of Truth Check

- [ ] Everything claimed exists in `git show HEAD`?
  - New files: `git ls-tree HEAD [filepath]` shows them
  - Modified files: `git show HEAD:[filepath]` shows updates
  - Deletions: `git show --stat HEAD` lists deleted files
- [ ] No claims without Git evidence?
- [ ] Chat claims are ONLY about work in Git?
- [ ] Artifacts created are all committed?

---

## Example: Verify Evidence Claim

**Claim**: "STATUS.md was updated with evidence"

**Verify**:
```bash
git show HEAD:projects/nexus-v1/STATUS.md | head -20
# Should show "Truth Reset Complete" or "BLOCKED"
```

**If it shows old content**: Claim is false. File not actually updated.

---

## Examples: Verify Artifact Creation

**Claim**: "6 Governor skills created"

**Verify**:
```bash
git ls-tree HEAD agents/governor/skills/ | grep SKILL
# Should show 6 SKILL files
```

**If it shows <6**: Claim is incomplete. Some skills not committed.

---

## Rule

**No claim without Git verification.**

---

**END CHECKLIST-REPO-TRUTH-ALIGNMENT**

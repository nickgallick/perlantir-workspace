# VERIFICATION-STANDARD.md

## Purpose
Define what "done" means for different types of work. Separate implementation from verification. Specify required verifiers and when to run them. Ensure no false completion claims.

---

## Universal Verification Principle

**Implemented ≠ Verified**

- **Implemented**: Code/content written, edits applied, compiles/parses
- **Verified**: Changes tested, all verifiers passed, quality bar met, safe to deploy

### Completion Rule
Never claim phase complete without verification evidence.

---

## Verification by Work Type

### Type 1: Documentation / Content
**Examples**: README updates, guides, standards files, config examples

**Required Verifiers**:
1. **Read-through**: Content is clear, complete, no stale references
2. **Link check**: Any URLs or internal references work (if external URLs, check they resolve)
3. **Format check**: No broken markdown, consistent style with repo
4. **Scope check**: Content matches what was promised in phase scope

**How to Verify**:
- [ ] Read the updated section in full
- [ ] Check links with web fetch tool (sample, not exhaustive)
- [ ] Skim for formatting issues
- [ ] Confirm scope is met

**If Verifier Missing**: Report that scope is met but tooling not available to run automated checks.

---

### Type 2: Configuration / Templates
**Examples**: `.env` templates, config files, manifests, docker-compose.yml

**Required Verifiers**:
1. **Syntax check**: Valid JSON, YAML, TOML, etc. (use parser if available)
2. **Reference check**: All referenced files/keys exist
3. **Example validation**: If example provided, test it works (or document why not)
4. **Backwards-compat check**: Old configs still work (if not, document breaking changes)

**How to Verify**:
- [ ] Parse the file (JSON/YAML parser, or manual inspection)
- [ ] Check all referenced paths/keys exist
- [ ] If example config provided: test with actual tool if possible
- [ ] Document any breaking changes

**If Verifier Missing**: Use manual inspection or exec to validate syntax.

---

### Type 3: Code / Logic
**Examples**: Functions, classes, modules, scripts

**Required Verifiers (In Order)**:
1. **Syntax**: Code parses/compiles (use language parser)
2. **Lint**: Code style is consistent (use linter if configured)
3. **Type-check**: Type annotations correct (use type-checker if configured)
4. **Unit tests**: Tests pass (run test suite)
5. **Integration tests**: Changes work in context (smoke test, integration tests)
6. **Code review**: Logic is correct and safe (manual or automated)

**Minimum Bar**:
- Syntax must pass
- Unit tests must pass (if tests exist)
- If linter/type-checker configured, must pass

**How to Verify**:
- [ ] Run parser: `node -c script.js` or equiv
- [ ] Run linter: `eslint .` or equiv
- [ ] Run type-checker: `tsc --noEmit` or equiv
- [ ] Run tests: `npm test` or equiv
- [ ] Manual review of logic

**If Verifier Not Configured**:
- Report: "No verifier configured for <type>"
- Fall back to: Syntax check + code review
- Recommend: Operator configure linter/tests for next phase

**Never Claim Done Without**:
- Syntax passing
- Tests passing (if they exist)
- Code review confirming logic

---

### Type 4: Infrastructure / Deployment
**Examples**: Docker images, deployment scripts, infra-as-code, CI/CD pipelines

**Required Verifiers**:
1. **Syntax/Validation**: IaC validates (terraform plan, docker build --dry-run, etc.)
2. **Policy check**: Security policy enforced (no hardcoded secrets, permissions correct)
3. **Dry-run**: Changes can be applied without error (terraform plan, helm dry-run)
4. **Test deploy**: Changes work in test environment (if applicable)
5. **Rollback plan**: Operator knows how to revert

**How to Verify**:
- [ ] Run syntax validation
- [ ] Scan for secrets/hardcoded values
- [ ] Run dry-run to confirm no errors
- [ ] Test in staging if available
- [ ] Document rollback steps

**If Verifier Not Available**:
- Report: "No staging environment for testing"
- Fall back to: Syntax validation + code review
- Recommend: Operator approve manual testing or defer to staging

**Never Claim Done Without**:
- Syntax validation passing
- Rollback plan documented
- Security review complete

---

### Type 5: Research / Investigation
**Examples**: Web research, codebase analysis, feasibility studies

**Required Verifiers**:
1. **Source verification**: All claims have sources (links, file references)
2. **Recency check**: Current facts checked for staleness (is this still true?)
3. **Breadth check**: Multiple sources consulted (not single source)
4. **Synthesis**: Findings summarized clearly

**How to Verify**:
- [ ] Each fact has a source citation
- [ ] External sources checked for currency
- [ ] At least 2 sources for important claims
- [ ] Summary is clear and actionable

**If Source Not Available**:
- Mark as "unverified" or "hypothesis" explicitly
- Recommend: Operator confirm before acting on finding

---

## Evidence Format

### Required Evidence for Completion
Must provide **at least one** of:
1. **Test output**: Actual test run results (copy/paste or reference)
2. **Linter/formatter output**: Actual linting results
3. **Code review**: Manual review with specific sign-off
4. **Dry-run output**: Terraform plan, docker build output, etc.
5. **Link check**: Web fetch results for documentation

### Evidence Location
- **Inline**: Include in completion message (short snippets)
- **Logged**: Reference file path and line numbers
- **Attached**: Include in handoff notes for audit

### Example Evidence
```
✅ Type-check passed:
$ tsc --noEmit
(no errors)

✅ Tests passed:
$ npm test
PASS ./src/utils.test.js
  ✓ formatDate handles edge cases (8ms)
  ✓ parseJSON rejects invalid input (3ms)

2 passed, 0 failed
```

---

## Separating Implemented from Verified

### Phase Structure Example

**Phase X: Implement feature Y**
- Scope: Add function, tests, docs
- Output: 3 files modified
- Approval: "Approved. Execute Phase X only."
- Verification: Tests pass, code review passes
- **Completion**: All evidence provided, done

**vs.**

**Phase X: Implement feature Y**
- Scope: Add function, tests, docs
- Output: 3 files modified
- Approval: "Approved. Execute Phase X only."
- **Problem**: Tests not passing, need 2 more hours
- **Action**: Don't claim done. Escalate or request extended phase

---

## What "No Verifier Configured" Means

### Scenario
You've modified a type of code (e.g., Python scripts) and there's no test framework set up.

### Response Options

**Option 1: Manual Verification**
- Inspect the code for correctness
- Test the script manually if possible (run it)
- Report: "No test framework configured. Manual review confirms logic is correct."
- Recommend: Operator configure testing for next phase

**Option 2: Escalate**
- Report: "Code implemented but no verifier available. Requires manual testing."
- Operator decides: Test it themselves, accept risk, or defer phase

**Option 3: Propose and Implement Verifier**
- Propose: "I can add a test framework (pytest/jest/etc.) before finalizing this phase"
- Requires: Scope approval for verifier setup
- Then: Implement, run tests, verify

### Never
- Claim done without verification
- Assume code works because it "looks right"
- Skip verification because tooling isn't configured

---

## Checkpoints

### Before Phase Completion
- [ ] Scope fully met (re-read phase statement)
- [ ] All required verifiers identified
- [ ] All verifiers executed successfully
- [ ] Evidence collected and documented
- [ ] No false claims (only verified assertions)
- [ ] Rollback plan known
- [ ] Handoff notes complete

### During Verification Failure
- [ ] Report the failure exactly (what test failed, what error appeared)
- [ ] Do not continue with other work
- [ ] Ask operator: Continue debugging, expand phase scope, defer to next phase?

### At Phase Completion
- [ ] Summary includes verification evidence
- [ ] All verifiers passed
- [ ] Operator has confidence in quality
- [ ] Next phase can proceed with clean state

---

## Integration with DEFINITION-OF-DONE.md

This standard defines the **verification part** of Definition of Done. See DEFINITION-OF-DONE.md for the complete checklist.

Non-negotiable for all work phases.

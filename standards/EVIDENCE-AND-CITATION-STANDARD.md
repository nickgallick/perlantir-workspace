# EVIDENCE-AND-CITATION-STANDARD.md

## Purpose
Define exactly what evidence looks like. Separate inference from proof. Require citations for all external facts. Make "done" claims verifiable and trustworthy.

---

## Evidence Categories

### Category 1: Source File Citation
**What it is**: Reference to a file in the workspace with line numbers or block context.

**Format**:
```
Source: workspace/standards/EDIT-SAFETY.md#L45-L55
```

or in prose:
```
As stated in EDIT-SAFETY.md (lines 45–55), re-read discipline is mandatory.
```

**When required**:
- Claiming a policy or rule exists
- Referencing a previous decision
- Pointing to relevant context

**Example**:
```
✅ "Re-read discipline is required (EDIT-SAFETY.md#L45-L55)"
✅ "As defined in VERIFICATION-STANDARD.md, tests must pass before claiming done"
```

---

### Category 2: Test Output
**What it is**: Actual output from running tests, showing pass/fail status.

**Format**:
```
$ npm test
PASS src/utils.test.js
  ✓ parseDate handles edge cases (8ms)
  ✓ formatJSON rejects invalid (3ms)
  
2 passed, 0 failed
```

**When required**:
- Claiming tests pass
- Reporting test failures
- Providing verification evidence for code changes

**Evidence Standard**:
- Exact command run
- Full output (not summarized)
- Timestamp (if available)
- Test count and status

**Example**:
```
✅ Tests pass: npm test (completed at 14:30 UTC)
✅ 24 tests pass, 0 failed, 0 skipped

❌ Wrong: "Tests are passing" (no evidence)
❌ Wrong: "Most tests passed" (unclear)
```

---

### Category 3: Linter/Type-Checker Output
**What it is**: Actual output from code quality tools.

**Format**:
```
$ eslint src/
✓ 0 errors
✓ 0 warnings
```

**When required**:
- Claiming code passes linting
- Reporting linting errors
- Providing verification evidence for code quality

**Evidence Standard**:
- Tool name and version
- Command that was run
- Full output (error/warning list, or "0 errors")
- Timestamp

**Example**:
```
✅ Linting passes: eslint src/ (ESLint 8.42.0)
   0 errors, 0 warnings

❌ Wrong: "Code is clean" (no linter output)
❌ Wrong: "I fixed the linting issues" (no verification)
```

---

### Category 4: Dry-Run Output
**What it is**: Output from a dry-run or preview operation (terraform plan, docker build --dry-run, etc.).

**Format**:
```
$ terraform plan -out=tfplan
Plan: 3 to add, 0 to change, 0 to destroy
```

**When required**:
- Claiming infrastructure change is safe
- Reporting dry-run results before deployment
- Testing deployment/migration changes

**Evidence Standard**:
- Full dry-run output
- No errors reported
- Change summary (what will be added/changed/deleted)
- Timestamp

**Example**:
```
✅ Terraform plan: No errors
   Plan: 2 to add, 0 to change, 0 to destroy
   Changes: Add RDS instance and security group

❌ Wrong: "Infrastructure changes are safe" (no dry-run)
```

---

### Category 5: Web Citation
**What it is**: URL + date for external facts, especially current-fact research.

**Format**:
```
Source: https://api.example.com/docs (verified April 1, 2026, 14:30 UTC)
```

**When required** (RESEARCH-AND-BROWSER-POLICY.md):
- Making claims about current API versions
- Citing current product features
- Referencing current pricing or availability
- Any "current state" claim about external systems

**Evidence Standard**:
- Full URL (not shortened link)
- Date checked
- Time zone if precision matters
- Specific finding from the URL

**Example**:
```
✅ "Current API version is v3.2.0 (https://api.example.com/docs, verified April 1, 2026)"
✅ "Pricing is $29/month (https://example.com/pricing, checked today)"

❌ Wrong: "The API version is v3" (no source)
❌ Wrong: "I think it's v3" (no verification)
```

---

### Category 6: Code Review
**What it is**: Human review notes confirming logic correctness.

**Format**:
```
Code review: LGTM
- Logic implements spec correctly
- Edge cases handled (null, empty string, negative)
- Performance is O(n log n) as required
- No obvious security issues
```

**When required**:
- Claiming code is correct
- Verifying complex logic
- Security-sensitive changes

**Evidence Standard**:
- Specific points checked
- Concerns found (if any)
- Sign-off from reviewer
- Date of review

**Example**:
```
✅ Code review: 
   - Cache invalidation logic is correct (handles stale reads)
   - Thread safety: Proper mutex usage
   - Reviewed by: [reviewer name], April 1, 2026

❌ Wrong: "Code looks good" (too vague)
```

---

### Category 7: Diff / Before-After
**What it is**: Clear before/after comparison showing change.

**Format**:
```
File: config.js
Before: const API_TIMEOUT = 5000;
After:  const API_TIMEOUT = 10000;

Reason: API calls timeout at >7s; increased to be safe
```

**When required**:
- Important configuration changes
- API changes
- Critical value modifications
- Changes affecting performance/behavior

**Evidence Standard**:
- File name
- Old value/code
- New value/code
- Reason for change

**Example**:
```
✅ Change: .env
   DATABASE_POOL_SIZE: 10 → 20
   Reason: Production load increased; was hitting connection limits

❌ Wrong: "Updated config" (no specific change)
```

---

## Inference vs. Evidence

### Inference (Not Enough)
**Definition**: Conclusions drawn without direct evidence. Reasonable guesses.

**Examples**:
```
❌ "Tests are probably passing" (haven't run them)
❌ "The API supports JSON" (haven't checked docs)
❌ "Code is secure" (haven't reviewed it)
```

**When inference is acceptable**:
- In exploration/research phase (not final claims)
- During proposal/design (not implementation claims)
- When explicitly labeled as hypothesis/guess

**Example**:
```
✅ "I hypothesize that caching would improve this by ~30% (needs benchmark)"
✅ "Likely, the issue is in the parser (need to test)"
```

### Evidence (Required for Claims)
**Definition**: Direct proof from running tools, reading sources, or code review.

**Examples**:
```
✅ "Tests pass: npm test (24/24 passed)"
✅ "API docs confirm JSON support: https://api.example.com/docs"
✅ "Code review: No SQL injection vectors found"
```

---

## No Unsupported "Done" Claims

### ❌ Not Acceptable
```
"Phase complete. Tests pass, code is clean, no issues found."
(No evidence provided)
```

### ✅ Acceptable
```
"Phase complete. 

Evidence:
- Tests: npm test (24 passed, 0 failed)
- Linting: eslint src/ (0 errors, 0 warnings)
- Code review: Logic correct, edge cases handled
- Verification: Smoke test passed in staging environment

Files modified: 3 (src/utils.js, src/test.js, README.md)
Rollback: git reset HEAD~1
"
```

---

## Citation Standards

### For External Facts (Web Research)

**Required fields**:
1. URL (exact, not shortened)
2. Date accessed
3. Specific claim with source
4. Confidence (official docs, blog, third-party)

**Format**:
```
Current Node.js LTS is v20.11.0
Source: https://nodejs.org/en/ (verified April 1, 2026, 14:30 UTC)
Confidence: Official source (nodejs.org)
```

**Types of sources by reliability**:
```
✅ Official docs (highest confidence)
✅ Changelog or release notes (highest confidence)
✅ Official blog or announcement (high confidence)
⚠️ Third-party blog or tutorial (medium confidence, cite author)
⚠️ Stack Overflow (medium confidence, cite post and upvotes)
❌ Random forum post (low confidence, avoid)
❌ Uncited claim (no confidence)
```

### For Code Changes

**Required**: Before/after with file reference
```
Modified: src/config.js
- Line 15: const TIMEOUT = 5000;
+ Line 15: const TIMEOUT = 10000;

Reason: Increases timeout to match production SLA
```

### For Decisions

**Required**: Decision log with reasoning
```
Decision: Use PostgreSQL over MySQL
Date: Phase 3, April 1, 2026
Rationale: JSONB support, better concurrency, team expertise
Alternative: Considered MySQL 8.0 but lack JSONB
```

---

## Checkpoints for Evidence

### Before Claiming "Done"
- [ ] Ran all required verifiers? (tests, lint, type-check)
- [ ] Evidence collected (test output, linter results)?
- [ ] External sources cited? (dates, URLs)
- [ ] Code review completed?
- [ ] Edge cases verified?
- [ ] No unsupported claims?

### Before Making External Claim
- [ ] Cited authoritative source?
- [ ] Verified source is current?
- [ ] Compared against multiple sources (if conflicting info)?
- [ ] Did not infer; verified directly?

### Before Reporting Bug/Issue
- [ ] Reproduced the issue?
- [ ] Captured error message?
- [ ] Included log excerpts (with context)?
- [ ] Provided minimal reproduction steps?

---

## What NOT to Include as Evidence

### ❌ Promises or Plans
- "I will run tests" (not evidence; do it and provide output)
- "Tests should pass" (not evidence)

### ❌ Summaries Without Details
- "Everything checks out" (no detail)
- "No errors found" (unsupported)

### ❌ Partial Evidence
- "Most tests pass" (what failed?)
- "Code is mostly clean" (what warnings?)

### ❌ Hallucinated Output
- Fabricating test results
- Making up console output
- Inferring results without running tests

**Protection**: Re-read sources before citing; never guess at evidence.

---

## Evidence Format Examples

### Example 1: Code Change
```markdown
## File Modified: src/auth.js

**Change**: Added JWT token validation

**Evidence**:
- Code review: Logic verified, no auth bypass vectors ✓
- Tests: 12/12 tests pass (includes 3 new JWT tests) ✓
  ```
  $ npm test src/auth.test.js
  PASS src/auth.test.js
    ✓ validateToken accepts valid JWT (5ms)
    ✓ validateToken rejects expired JWT (3ms)
    ✓ validateToken rejects tampered JWT (4ms)
  
  3 passed
  ```
- Linting: 0 errors ✓

**Rollback**: `git revert <commit-hash>`
```

### Example 2: Current-Fact Research
```markdown
## API Version Research

**Claim**: OpenAI API v1.0 was released March 2024

**Evidence**:
- Source: https://openai.com/blog/new-openai-api-v1/ (verified April 1, 2026)
- Confirmed via: https://github.com/openai/openai-python/releases/tag/v1.0.0
- Date released: March 23, 2024 (per changelog)

**Confidence**: Official sources
```

### Example 3: Architecture Decision
```markdown
## Decision: Use Redis for Caching

**Date**: April 1, 2026 (Phase 5)

**Evidence**:
- Benchmark: Redis latency ~1ms, Memcached ~2ms
- Source: https://redis.io/benchmarks (verified today)
- Our requirements: <5ms latency needed
- Performance test: Implemented cache, stress test shows improvement

**Result**: Adopted Redis; measurable improvement in P99 latency
```

---

## Integration with Other Standards

- **VERIFICATION-STANDARD.md**: Defines what evidence is required by work type
- **RESEARCH-AND-BROWSER-POLICY.md**: Defines when citations are required
- **DEFINITION-OF-DONE.md**: Completion requires evidence checklist

Non-negotiable: Evidence is how trust is built. No unsupported claims.

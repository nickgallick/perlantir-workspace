# RISK-AND-ESCALATION-STANDARD.md

## Purpose
Classify work by risk level. Define required escalations, approvals, and controls for each. Protect critical systems, data, and decisions.

---

## Risk Levels

### Category 0: Minimal Risk
**Definition**: Changes that are easily reversible, affect no user data, and have no security implications.

**Examples**:
- Adding documentation or comments
- Updating non-critical configs (themes, display settings)
- Refactoring internal code (no API changes)
- Adding tests
- Updating dependency versions for security patches

**Required Approval**: Phase scope approval (standard)

**Required Verification**: Type and context appropriate

**Verification Evidence**: Tests pass, linting passes, code review

**Rollback Plan**: Simple (undo the changes, redeploy)

**Time to Recover**: <5 minutes

---

### Category 1: Low Risk
**Definition**: Changes with limited blast radius, reversible, no security/data concerns.

**Examples**:
- Adding new non-critical features (logging, monitoring)
- Updating internal tooling or CLI
- Adding configuration options (non-breaking)
- Modifying non-core workflows
- Database migration in non-critical table

**Required Approval**: Phase scope approval + operator spot-check

**Required Verification**: All tests pass, code review, smoke test

**Verification Evidence**: Test output, code review notes, smoke test results

**Rollback Plan**: Documented (e.g., "run migration rollback script X")

**Time to Recover**: <15 minutes

**Escalation Trigger**: If tests fail, escalate before continuing.

---

### Category 2: Medium Risk
**Definition**: Changes that could affect user experience, data integrity, or system stability. Recoverable but requires planning.

**Examples**:
- API changes (new endpoints, parameter changes)
- Database schema changes
- Authentication/authorization changes
- Core feature modifications
- Performance-critical refactors
- Dependency upgrades affecting public API
- Configuration changes to production systems

**Required Approval**: Explicit operator approval before execution

**Required Verification**:
- All tests pass (unit + integration)
- Code review + architecture review
- Staging environment test
- Backwards-compatibility check (if applicable)
- Performance impact assessment (if performance-relevant)

**Verification Evidence**:
- Test results
- Code review notes (specific)
- Staging test results
- Compatibility matrix
- Rollback plan (detailed)

**Rollback Plan**: Documented step-by-step (e.g., feature flag revert, schema downgrade)

**Time to Recover**: 15 minutes to 1 hour

**Communication**: Notify stakeholders before, notify of completion after

**Escalation Trigger**: Any test failure, any code review concern, any incompatibility

---

### Category 3: High Risk
**Definition**: Changes that could cause data loss, security breach, system outage, or significant user impact. Extreme care required.

**Examples**:
- Authentication systems (login, passwords, tokens)
- Authorization systems (permissions, role-based access)
- Billing or financial systems (charges, invoices, refunds)
- Infrastructure and deployment (servers, load balancers, DNS)
- Destructive operations (deletion, purging, truncation)
- Data migrations (moving data between systems)
- Security settings (encryption, TLS, headers)
- Legal-sensitive external claims (product promises, compliance statements)
- Secrets management (API keys, database passwords)

**Required Approval**: Explicit written approval from operator BEFORE beginning work

**Pre-Implementation Checklist**:
- [ ] Operator has reviewed and approved scope
- [ ] Risk assessment documented
- [ ] Rollback plan detailed and tested
- [ ] Communication plan established
- [ ] All stakeholders notified

**Required Verification**:
- All tests pass (unit + integration + end-to-end)
- Security review completed
- Code review + architecture review + security review
- Dry-run on staging (if applicable)
- Rollback plan tested
- Performance impact zero or documented
- No secrets exposed in code/logs
- All docs updated

**Verification Evidence**:
- Test results (all passing)
- Security review notes
- Code review (specific technical notes)
- Dry-run output (no errors)
- Tested rollback steps
- Security scan results (if applicable)

**Rollback Plan**: Detailed, tested, known to operator

**Time to Recover**: 1 hour to several hours (planned maintenance window)

**Communication**: Full stakeholder notification before, during, and after

**Incident Protocol**: If anything fails, stop immediately and escalate

**Escalation Required**: Any uncertainty, any test failure, any security concern

---

## Escalation Protocol

### Escalation Trigger Examples

**Category 0 → Escalate if**:
- Scope changes significantly
- Affects more files than expected (>5)
- Tests fail

**Category 1 → Escalate if**:
- Tests fail
- Code review raises concerns
- Smoke test fails
- Performance regresses

**Category 2 → Escalate if**:
- Any test fails
- Any integration issue found
- Backwards compatibility broken
- Code review raises architecture concerns
- Staging test reveals bugs
- Rollback plan is unclear

**Category 3 → Escalate if**:
- Any concern whatsoever (security, logic, testing)
- Dry-run shows unexpected behavior
- Rollback plan fails
- Stakeholder raises concerns

### How to Escalate

**Step 1: Stop**
- Do not continue with the work
- Do not claim partial completion

**Step 2: Report**
- State the issue exactly (not "something feels wrong" but "Test X failed with error Y")
- Include evidence (test output, error message, log snippet)
- State the category and trigger

**Step 3: Propose Options**
1. Debug and fix (requires understanding the issue)
2. Expand phase scope to include fix
3. Defer to next phase after resolution
4. Roll back and try different approach

**Step 4: Wait for Direction**
- Operator decides which option to pursue
- Continue only after direction received

---

## Risk Assessment Template

### For Any Medium or High-Risk Change

```markdown
## Risk Assessment: [Feature Name]

### Risk Category
- [ ] Low (Category 1)
- [ ] Medium (Category 2)
- [ ] High (Category 3)

### Why This Category?
[Explain the risk factors]

### Potential Failure Modes
1. [Failure mode 1]
2. [Failure mode 2]
3. [Failure mode 3]

### Mitigation Strategies
- [Mitigation 1]
- [Mitigation 2]
- [Mitigation 3]

### Rollback Plan
[Step-by-step rollback procedure]

### Testing Strategy
- [Test type 1]
- [Test type 2]
- [Test type 3]

### Stakeholder Notification
- [Who needs to know]
- [When to notify]
- [How to notify]

### Success Criteria
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]
```

---

## Authority by Risk Level

### Category 0
- **Authority**: Governor (standard phase approval)
- **Approval**: Implicit in phase scope
- **Escalation**: Automatic if tests fail

### Category 1
- **Authority**: Operator + Governor
- **Approval**: Phase scope approval
- **Escalation**: Any test failure or code review concern

### Category 2
- **Authority**: Operator (explicit approval required)
- **Approval**: Written approval before execution
- **Escalation**: Any concern whatsoever

### Category 3
- **Authority**: Operator (explicit approval required)
- **Approval**: Written approval + risk assessment signed off
- **Escalation**: Any issue; extreme escalation bar

---

## Common Escalations

### Escalation Example 1: False Completion Claim
**Situation**: Agent claims "done" but tests are actually failing

**Risk**: Category 2 violation (medium-risk work without proper verification)

**Response**:
1. Report: "Test [X] failed with error [Y]"
2. Do not claim done
3. Escalate to operator for direction

**Prevention**: Re-read VERIFICATION-STANDARD.md; never claim done without passing tests

---

### Escalation Example 2: Secrets Exposed
**Situation**: API key found in a config file about to be committed

**Risk**: Category 3 violation (security risk)

**Response**:
1. Stop immediately
2. Remove the key from file
3. Report the incident
4. Escalate for credential rotation

**Prevention**: Scan files for secrets before committing

---

### Escalation Example 3: Backwards Incompatibility
**Situation**: API endpoint parameter changed; existing clients will break

**Risk**: Category 2 violation (breaking change)

**Response**:
1. Stop before deploying
2. Report: "Change breaks X clients"
3. Propose: Deprecation period, versioning, or rollback
4. Escalate to operator for decision

**Prevention**: Always check for dependent code before breaking changes

---

### Escalation Example 4: High-Touch Refactor
**Situation**: Need to touch 8 files for a refactor

**Risk**: Category 1 or 2 (high touch + complexity)

**Response**:
1. Pause and summarize the scope
2. Escalate for operator approval before executing
3. Propose: Serial execution with checkpoints

**Prevention**: Always ask before high-touch changes

---

## Integration with Other Standards

- **ENGINEERING-EXECUTION.md**: Defines phase discipline; escalation is built into phases
- **VERIFICATION-STANDARD.md**: Defines what verification is required by risk level
- **TOOL-USE-POLICY.md**: High-risk tool use requires escalation
- **EXTERNAL-CLAIMS-AND-MESSAGING-STANDARD.md**: External claims are Category 3 risk

---

## Risk Checklist

For any work, before starting:

- [ ] Risk category identified (0, 1, 2, or 3)
- [ ] Triggers for escalation known
- [ ] Approval level understood
- [ ] Verification plan in place
- [ ] Rollback plan documented (if >Category 0)
- [ ] If Category 3: Risk assessment completed
- [ ] If Category 3: Stakeholders notified before starting
- [ ] Ready to escalate if needed

Non-negotiable for all production work and critical systems.

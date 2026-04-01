# EXTERNAL-CLAIMS-AND-MESSAGING-STANDARD.md

## Purpose
Define rules for any external-facing claim, positioning statement, product promise, legal-adjacent wording, competitor comparison, or launch copy. Distinguish verified fact, internal hypothesis, roadmap intent, opinion, and marketing language. Never make unsupported claims.

---

## Claim Categories

### Category 1: Verified Fact
**Definition**: Claim directly verified from authoritative source or test.

**Examples**:
```
✅ "Our API returns responses in <100ms (p99)"
   (Measured: 100+ requests, actual data shows this)

✅ "Compatible with Node.js 18+ and 20+"
   (Tested: CI passes for both versions)

✅ "GDPR compliant data deletion in <30 days"
   (Confirmed: Attorney review + implementation verified)
```

**Requirements**:
- [ ] Claim is directly verifiable
- [ ] Verification was performed
- [ ] Evidence is available (test results, measurement, attorney confirmation)
- [ ] Claim is specific, not vague

**External Use**: ✅ Safe to use
- Can be used in marketing, public statements, external docs
- Back-up with evidence if challenged
- Update if situation changes

---

### Category 2: Internal Hypothesis
**Definition**: Claim based on reasoning but not yet verified.

**Examples**:
```
❓ "This approach will likely improve performance by 30%"
   (Theory based on architecture; not yet measured)

❓ "Users probably prefer dark mode"
   (Reasonable guess; not surveyed or tested)

❓ "Scaling to 1M users should be feasible"
   (Based on similar systems; not proven)
```

**Requirements**:
- [ ] Claim is prefaced with "likely," "probably," "we expect"
- [ ] Reasoning is explained
- [ ] Hypothesis is testable
- [ ] Not presented as fact

**External Use**: ❌ NOT safe to use in marketing/public
- Can use internally for planning
- Can discuss in exploratory contexts
- Never claim as fact to customers
- Never put in product marketing without verification

**Example of WRONG use**:
```
❌ Product page: "30% performance improvement"
   (Internal hypothesis, not verified)

✅ Correct: "Initial testing suggests ~30% improvement;
   full benchmarks coming in Q2"
```

---

### Category 3: Roadmap Intent
**Definition**: Plan for future capability, not yet committed or delivered.

**Examples**:
```
🗺️ "We plan to support Python in Q3 2026"
   (Roadmap item; not yet built or committed)

🗺️ "Dark mode support is on our roadmap"
   (May change; depends on priorities)

🗺️ "Planned feature: Real-time collaboration"
   (Future; not yet guaranteed)
```

**Requirements**:
- [ ] Always prefaced with "plan," "roadmap," "coming soon"
- [ ] No fixed commitment date (unless absolutely certain)
- [ ] Include caveat: "subject to change"
- [ ] Realistic timeline (not "coming next week" for 6-month project)

**External Use**: ⚠️ Limited safe use
- Can share public roadmap
- Always include "subject to change"
- Never guarantee delivery date unless certain
- Never sell/charge based on roadmap items

**Example of WRONG use**:
```
❌ Pricing page: "Real-time collaboration included in Pro plan"
   (Not yet built; cannot charge for it)

✅ Correct: "Roadmap: Real-time collaboration coming Q3 2026
   (subject to change)"
```

---

### Category 4: Opinion
**Definition**: Subjective judgment, preference, or interpretation.

**Examples**:
```
💭 "Postgres is the best database for reliability"
   (Opinion; others prefer MySQL, SQLite, etc.)

💭 "Dark mode is easier on the eyes"
   (Subjective preference; not universal fact)

💭 "Our API is simpler than competitors"
   (Subjective; competitors may disagree)
```

**Requirements**:
- [ ] Clearly labeled as opinion ("we believe," "in our view," "we prefer")
- [ ] Not presented as objective fact
- [ ] Acknowledge other perspectives exist

**External Use**: ⚠️ Acceptable if labeled
- Can share opinions in marketing
- Must be clear it's opinion, not fact
- Can compare to competitors, but fairly
- Never claim opinion as objective truth

**Example**:
```
✅ "We prefer Postgres for its reliability and feature set"
   (Clear opinion, labeled)

❌ "Postgres is more reliable than MySQL"
   (Presented as fact; debatable)

✅ "In our testing, Postgres performed 20% better on writes"
   (Fact with evidence; not just opinion)
```

---

### Category 5: Marketing Language
**Definition**: Persuasive language designed to appeal, not describe.

**Examples**:
```
📣 "Blazingly fast API"
   (Marketing; not specific measurable claim)

📣 "The easiest way to build APIs"
   (Subjective superlative)

📣 "Enterprise-grade security"
   (Marketing term; vague, not specific)
```

**Requirements**:
- [ ] Marketing language must be supported by verifiable facts
- [ ] Don't use alone; pair with specific claims
- [ ] Know what claims you're implying

**External Use**: ⚠️ Acceptable with backing
- Can use marketing language
- Must be supported by specific facts
- Don't make unsupported implications

**Example**:
```
❌ "Enterprise-grade security"
   (Alone: marketing fluff, no substance)

✅ "Enterprise-grade security: SOC 2 Type II certified, end-to-end encryption,
   penetration-tested quarterly"
   (Marketing term backed by facts)
```

---

## Distinction Matrix

| Type | Verified? | External Safe? | Label Required? | Examples |
|------|-----------|---|---|---|
| Verified Fact | Yes | ✅ Yes | No | "API latency <100ms p99" |
| Internal Hypothesis | No | ❌ No | Yes | "Likely 30% faster" |
| Roadmap | No | ⚠️ Limited | Yes | "Coming Q3 (subject to change)" |
| Opinion | N/A | ⚠️ Limited | Yes | "We believe X is better" |
| Marketing | Varies | ⚠️ Limited | Yes | "Blazingly fast" (+ facts) |

---

## Competitor Comparison Rules

### ✅ Safe Comparisons
```
Verified fact vs. verified fact:
"Our API responds in <100ms; Competitor X responds in ~200ms"
(Both measured, both public)

Our feature vs. public feature:
"We support OAuth 2.0; Competitor X requires API keys only"
(Fact vs. public information)
```

### ❌ Unsafe Comparisons
```
❌ "We're better than all competitors"
   (Vague, unsupported superlative)

❌ "Competitor X is slow"
   (Not measured; depends on use case)

❌ "Our price is half of Competitor X"
   (Fair, but verify accuracy; can change)

❌ Claiming competitor lacks feature they actually have
   (False claim; potential legal issue)
```

### Protocol for Competitor Claims
1. **Verify competitor's claim** (check their docs, not gossip)
2. **Make specific comparison** (not vague superlative)
3. **Be prepared to back it up** (have evidence)
4. **Acknowledge nuance** (not "always better," "better for X use case")
5. **Update when situation changes** (competitors update too)

---

## Product Promise Rules

### ✅ Safe Promises
```
✅ "API responses in <100ms p99 (measured)"
✅ "99.9% uptime SLA (backed by contract)"
✅ "Supports Python 3.8, 3.9, 3.10, 3.11" (tested)
```

### ❌ Unsafe Promises
```
❌ "Guaranteed to solve your problem"
   (Too vague; outcome depends on use)

❌ "Never have data loss"
   (Too absolute; no system is perfect)

❌ "Best performance in the industry"
   (Superlative without evidence)

❌ "Coming next week"
   (Specific date not committed to)
```

### Promise Protocol
1. **Only promise what you can deliver** (test it)
2. **Define terms clearly** ("99.9% uptime" = what exactly?)
3. **Include appropriate disclaimers** (SLAs, exceptions, etc.)
4. **Have rollback/refund plan** (if promise broken)
5. **Document how it's measured** (so no disputes)

---

## Claim Verification Checklist

Before making ANY external claim:

- [ ] Is this a fact, hypothesis, roadmap, opinion, or marketing?
- [ ] If fact: Do I have verification evidence?
- [ ] If hypothesis: Is it labeled with "likely," "probably," "we expect"?
- [ ] If roadmap: Is it labeled "subject to change"?
- [ ] If opinion: Is it clear it's opinion?
- [ ] If marketing: Is it backed by facts?
- [ ] Could this be misunderstood? (Test with non-expert)
- [ ] Is this legally safe? (Verify against FTC Act, ToS, etc.)
- [ ] Would I stand behind this in court? (Serious question)

---

## Legal Considerations

### FTC Act Section 5: Unfair/Deceptive Practices

Claims that violate FTC Act:
- [ ] "Guaranteed" performance not actually guaranteed
- [ ] Competitor comparisons that are false
- [ ] Superlatives without proof ("best," "fastest," "most reliable")
- [ ] Omitting material limitations
- [ ] Endorsement/testimonial not actually used by person
- [ ] "Free" that requires payment or obligation

**Protection**: Only make claims you can prove.

### Consumer Protection Laws

Vary by state/country, but generally:
- [ ] Must not be deceptive
- [ ] Must clearly disclose terms
- [ ] Can't use dark patterns
- [ ] Must honor promises in ads

**Protection**: Keep legal team in loop for any public claims.

---

## Examples: GOOD vs. BAD

### Example 1: Performance Claim

**❌ BAD**:
```
"Lightning fast API"
(Vague, unmeasurable, no evidence)
```

**✅ GOOD**:
```
"API response time: <100ms p99
Measured: 1,000,000 requests over 24h at peak load
Latest benchmark: April 1, 2026"
(Specific, measured, recent)
```

---

### Example 2: Competitor Comparison

**❌ BAD**:
```
"We're better than all competitors"
(Vague, unsupported, false)
```

**✅ GOOD**:
```
"Performance comparison (measured April 1, 2026):
- Our API: 95ms p99
- Competitor X: 180ms p99
- Competitor Y: 240ms p99

Note: Performance varies by use case. See benchmarks for details."
(Specific, measured, honest)
```

---

### Example 3: Roadmap

**❌ BAD**:
```
"Dark mode coming in Q2 2026"
(Sounds like commitment; may not happen)
```

**✅ GOOD**:
```
"Roadmap: Dark mode support (planned Q2 2026, subject to change)

This item is on our roadmap but is not yet committed. 
Timeline may shift based on priorities."
(Clear it's not guaranteed)
```

---

### Example 4: Feature Claim

**❌ BAD**:
```
"Real-time collaboration"
(Feature works, but do we actually have it?)
```

**✅ GOOD**:
```
"Real-time collaboration:
✅ Live editing with multiple users
✅ Conflict resolution
❌ Offline mode (coming Q3)

Available now: Pro and above plans"
(Honest about what works and what doesn't)
```

---

## When to Escalate to Legal

- Any claim about compliance (GDPR, CCPA, etc.)
- Competitor comparisons (potential defamation risk)
- Warranty or guarantee claims
- Data privacy or security claims
- Health/safety claims (if applicable)
- Claims that could create liability

**Protocol**: Draft claim, show to legal, get approval before publishing.

---

## Integration with Other Standards

- **RESEARCH-AND-BROWSER-POLICY.md**: Must verify current facts before claiming
- **EVIDENCE-AND-CITATION-STANDARD.md**: External claims require evidence
- **LEGAL-GUIDANCE-ONLY-STANDARD.md**: Legal-adjacent claims need attorney review
- **OPERATOR-PREFERENCES.md**: No generic claims; be specific

---

## Key Principle

**No unsupported external claims. Ever.**

- Verified facts: Safe to claim
- Hypotheses: Label as such, don't claim as fact
- Roadmap: Subject to change
- Opinions: Clearly opinion
- Marketing: Back with facts
- Promises: Only promise what you can deliver

When in doubt: Consult legal before publishing.

Non-negotiable: External credibility is hard-won and easily lost.

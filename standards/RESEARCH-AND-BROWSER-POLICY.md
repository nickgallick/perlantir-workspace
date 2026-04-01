# RESEARCH-AND-BROWSER-POLICY.md

## Purpose
Define when web research and browser access (Brave, search, fetch) are mandatory, optional, or forbidden. Distinguish current-fact research from evergreen reasoning. Establish citation standards for unstable facts.

---

## Research Categories

### Category 1: Current Facts (Unstable, Time-Sensitive)
**Definition**: Information that changes frequently or requires present-day verification.

**Examples**:
- Current API documentation (versions, endpoints, parameters)
- Current pricing or feature availability
- Current event information (dates, times, locations)
- Current product status (beta, launch, deprecation)
- Current regulatory requirements or compliance status
- Current versions of open-source libraries
- Current competitor positioning or product features
- Stock prices, weather, breaking news
- Current availability of services or tools

**Mandatory Research**:
- [ ] Must consult authoritative current source (API docs, official site, live API test)
- [ ] Must cite the source with URL and date checked
- [ ] Must verify within the last 7 days (or note if older)
- [ ] Must flag if source is unofficial (Reddit, blog) vs. authoritative (official docs)

**Example Evidence**:
```
✅ Checked: https://api.example.com/docs (April 1, 2026)
   Current version: 3.2.0
   Endpoint: POST /v3/process

❌ Wrong: "The API supports X" (no source, could be outdated)
```

---

### Category 2: Evergreen Reasoning (Stable, Principle-Based)
**Definition**: Information that doesn't change, or changes rarely and predictably.

**Examples**:
- Programming language syntax (Python for loops, JavaScript promises)
- Algorithm complexity (Big-O, sorting algorithms)
- Design patterns (MVC, dependency injection, state machines)
- Mathematical principles
- Historical facts (past events, past decisions)
- Coding best practices (DRY, SOLID principles)
- Architectural patterns (microservices, event-driven)
- Established frameworks (React, Django, Express)

**Optional Research**:
- [ ] Can rely on training knowledge unless asking for specific implementation detail
- [ ] If unsure: Research to confirm
- [ ] If recommending specific approach: Consider citing a guide

**Example**:
```
✅ "Python list comprehensions are preferred over map() for readability"
   (No research needed; well-established principle)

✅ "To implement a cache-aside pattern, fetch from cache, then DB if miss"
   (No research needed; standard pattern)

❌ "TypeScript 5.2 added feature X" (Current fact — must verify)
```

---

### Category 3: Hybrid (Evergreen Principle + Current Details)
**Definition**: Stable concept with moving-target implementation details.

**Examples**:
- "How to write React components" (evergreen) vs. "React 19 hooks API" (current)
- "Microservices benefits" (evergreen) vs. "Current Kubernetes default values" (current)
- "What is OAuth 2.0" (evergreen) vs. "Google OAuth endpoints in 2026" (current)

**Protocol**:
1. Use training knowledge for evergreen concept
2. Research for current-implementation details
3. Cite the current-facts portion

**Example**:
```
OAuth 2.0 is a delegated authorization standard.
Current implementation guide: https://developers.google.com/identity/protocols/oauth2 (checked April 1, 2026)
For GitHub: https://docs.github.com/en/apps/oauth-apps (checked April 1, 2026)
```

---

## Browser Research Requirements

### Research Mandatory: Do Not Skip
1. **Current API documentation**: Must fetch actual endpoint specs
2. **Current library versions**: Must check npm registry or official repo
3. **Current product features**: Must fetch from official site/docs
4. **Current regulatory/legal status**: Must cite current authoritative source
5. **Current competitor offerings**: Must fetch from their site or verify from multiple sources
6. **Competitor claims or positioning**: Must verify directly (don't infer from secondary sources)
7. **Pricing information**: Must fetch from official site
8. **Breaking changes or deprecations**: Must cite the official announcement or changelog

**Action**: Use `oxylabs_web_search` or `oxylabs_web_fetch` (Brave) to verify before making claims.

### Research Recommended: Good Practice
1. **Specific library implementation details**: Fetch README or GitHub if unclear
2. **Best practices for a tool**: Search for recent guides or official tutorials
3. **Troubleshooting**: Search for the specific error or issue
4. **Performance benchmarks**: Fetch actual benchmark results (not claims)
5. **Integration examples**: Fetch official examples or working code samples

**Action**: Use research tools unless you have high confidence in training knowledge.

### Research Forbidden: Do Not Use Browser
1. **Training knowledge questions**: "What is React?" (use training only)
2. **Asking the operator**: Ask directly; don't research their preferences
3. **Private information**: Never search for or fetch private data
4. **Sensitive data**: Never browse for credentials, API keys, or secrets
5. **Non-factual opinions**: Don't use the web to find opinions or take sides

**Action**: Answer from training knowledge or escalate to operator.

---

## Citation Standards for Current Facts

### Required Information
Every current-fact claim must include:

1. **Source URL** (exact page consulted)
2. **Date checked** (when you accessed it)
3. **Specific finding** (not just "the docs say")
4. **Confidence level** (official docs, blog, third-party)

### Citation Formats

**Inline Citation (Short-Form)**:
```
Current stable version is 3.2.0 (https://api.example.com/docs, checked April 1, 2026)
```

**Block Citation (Detailed)**:
```
API Version Information:
- Source: https://api.example.com/docs
- Date checked: April 1, 2026, 12:00 UTC
- Current stable: 3.2.0
- Latest preview: 4.0.0-beta.1
- Deprecation: v2 EOL June 1, 2026
```

**Failed Research**:
```
Attempted to verify current GitHub API version (https://docs.github.com/en/rest) but access blocked.
Falling back to training knowledge: REST v3 (last verified in training data).
Recommend: Operator verify current endpoints before implementation.
```

### Never
- Make claims without sources for current facts
- Cite outdated sources ("As of 2023...")
- Cite secondary sources when authoritative source exists
- Guess at current information ("I think X is now Y")

---

## Distinguishing Facts from Hypotheses

### Clear Fact
```
✅ "Python 3.12 was released October 2, 2023"
   (Verifiable from official Python.org)

✅ "React 19 supports Server Components" (April 1, 2026)
   (Verifiable from official React docs)
```

### Clear Hypothesis
```
🤔 "AWS will likely deprecate EC2 Classic soon"
   (Opinion/prediction, not current fact)

🤔 "Express is probably faster than Django"
   (Comparative claim, needs benchmarks)
```

### Mixed (Fact + Hypothesis)
```
📌 "Current TypeScript version is 5.4.5 (fact) and it's a significant improvement over 5.3 (opinion)."

Better:
"Current TypeScript version is 5.4.5 (https://www.typescriptlang.org/download, checked April 1, 2026).
Key improvements: [cite release notes]."
```

---

## Research Protocol

### Before Making Any Current-Fact Claim
1. **Identify**: Is this a current fact or evergreen knowledge?
2. **If current fact**: Schedule web research before finalizing claim
3. **Execute research**: Use oxylabs_web_search or oxylabs_web_fetch
4. **Verify**: Cross-reference official source
5. **Cite**: Include URL and date
6. **Confirm**: Re-read source to catch my own hallucinations

### If Research Unavailable
- Report: "Unable to verify current status; no web access available"
- Fallback: Use training knowledge and label as such
- Recommend: Operator verify before acting on claim

### If Sources Conflict
- Report: "Source A says X, Source B says Y"
- Research further: Check official source vs. secondary sources
- Decision: Cite authoritative source; note conflict
- Escalate: If no clear winner, ask operator

---

## Fact-Checking Your Own Claims

**Self-Check Process**:
1. Did I cite a source for this current fact? (If no → research or remove)
2. Is the source authoritative? (Official > Blog > Reddit)
3. Is the source recent? (<30 days old for fast-moving areas)
4. Did I test it? (If recommending API endpoint → try it)
5. Did I re-read my source to avoid hallucinations? (Yes → cite; No → re-read)

**Red Flags**:
- "I think the current version is..." → Research first
- "According to..." (but no link) → Add link or remove claim
- "Recent changes to X" (no date) → Add date or verify recency
- "X is now deprecated" (no source) → Find the announcement

---

## Integration with EXTERNAL-CLAIMS-AND-MESSAGING-STANDARD.md

This standard covers **research discipline**. See EXTERNAL-CLAIMS-AND-MESSAGING-STANDARD.md for rules on how to present findings (fact vs. hypothesis, marketing language, etc.).

For external-facing claims, research standards are **more strict**.

---

## Checklist for Current-Fact Research

- [ ] Identified claim as current fact or evergreen knowledge
- [ ] If current fact: Researched authoritative source
- [ ] Source is official/authoritative (not secondary)
- [ ] Date checked is recent (<30 days for fast-moving topics)
- [ ] Citation includes URL and date
- [ ] Cross-checked source (not hallucinated)
- [ ] If sources conflict: Noted and escalated
- [ ] Never made unsupported current-fact claims

Non-negotiable for all external-facing claims and feature work.

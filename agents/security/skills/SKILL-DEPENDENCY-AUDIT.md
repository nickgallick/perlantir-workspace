# SKILL-DEPENDENCY-AUDIT

## Purpose

Audit npm dependencies for known vulnerabilities, license compliance, and supply chain risk. Focus on the critical-path dependencies that handle database access, HTTP routing, and API communication.

## When to Use

- Adding a new dependency to any package
- Before production deployment
- After npm advisory notification
- Periodic audit (monthly or at each major milestone)

## Inputs Required

- `packages/core/package.json` — runtime: `pg`
- `packages/server/package.json` — runtime: `@nexus-ai/core`, `hono`, `pg`, `ws`
- `packages/sdk/package.json` — runtime: `@nexus-ai/core`
- Root `package.json` — no runtime deps
- `pnpm-lock.yaml` — full dependency tree

## Execution Method

### Critical-Path Dependency Inventory

| Dependency | Package | Role | Risk if Compromised |
|-----------|---------|------|-------------------|
| `pg` (node-postgres) | core, server | All database queries | Full database access, data exfiltration |
| `hono` | server | HTTP routing, request handling | Request interception, response manipulation |
| `ws` | server | WebSocket (future real-time push) | Notification interception |
| `openai` | core (optional) | Embedding generation | API key exfiltration, billing abuse |

**Why these matter in Nexus specifically**: `pg` handles every decision, agent, and artifact query. A compromised `pg` could exfiltrate all project decisions — the core intellectual property Nexus protects. `hono` handles every HTTP request including auth middleware — a compromised version could bypass authentication.

### Audit Protocol

**Step 1 — Run `npm audit`:**
```bash
cd /data/.openclaw/workspace/nexus
pnpm audit 2>&1
```

Check for: critical, high, moderate vulnerabilities. Low/info are noise for v1.

**Step 2 — Check critical packages manually:**
```bash
# Verify pg version is recent and maintained
npm view pg version time.modified
# Verify hono version is recent
npm view hono version time.modified
```

**Step 3 — License check:**
```bash
# List all licenses in dependency tree
npx license-checker --summary 2>/dev/null || echo "Install license-checker for full audit"
```

Acceptable licenses for v1: MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0.
Review required: GPL (copyleft implications), AGPL (network copyleft), Unlicense (verify intent).
Reject: SSPL, BSL (non-open-source).

**Step 4 — Transitive dependency count:**
```bash
# Count total packages in lockfile
grep "resolution:" pnpm-lock.yaml | wc -l
```

The current tree is small (~50-70 packages). Monitor for bloat — each new dependency adds attack surface.

### Attack Scenario: Compromised `pg` Package

**Vector**: Attacker gains publish access to `pg` npm package (or a deep transitive dependency like `pg-protocol`). Publishes version with data exfiltration code.

**Where it hits**: `packages/core/src/db/client.ts` — `createPool()` creates the pg.Pool. Every `pool.query()` call goes through `pg`. A compromised version could intercept queries and send data to an external endpoint.

**Detection signals**:
- Unexpected outbound network connections from the Nexus container
- `pnpm-lock.yaml` diff shows version change you didn't request
- `npm audit` flags the version

**Mitigation for v1**:
- Pin exact versions in `pnpm-lock.yaml` (pnpm does this by default)
- Review lockfile diffs in PRs — any dependency version change should be intentional
- Use `pnpm audit` as a pre-deploy check
- Run Nexus in a container with network egress restricted to PostgreSQL and OpenAI endpoints only

### Dependency Addition Policy

Before adding any new dependency:

1. **Is it necessary?** Can the functionality be implemented in < 50 lines without it?
2. **Maintenance**: Is it actively maintained? When was the last release? How many maintainers?
3. **Size**: How many transitive dependencies does it bring? (`npm explain <pkg>`)
4. **License**: Is it MIT/ISC/BSD/Apache-2.0?
5. **Alternatives**: Is there a smaller, better-maintained alternative?

**Current state**: Nexus has 4 runtime dependencies (pg, hono, ws, and core↔sdk workspace refs). This is excellent — keep it small.

### Secure Enough for v1

**Must do before production:**
- Run `pnpm audit` and resolve any critical/high findings
- Verify `pg` and `hono` are on recent, maintained versions
- Review lockfile for unexpected packages

**Should do before production:**
- Pin Node.js version in Dockerfile (`FROM node:22-slim`, not `FROM node:latest`)
- Add `pnpm audit` to CI pipeline (non-blocking initially)

**Acceptable for v1:**
- No license-checker in CI (manual check sufficient)
- No Snyk/Socket.dev integration (overkill for self-hosted dev tool)
- No SRI hashes (pnpm integrity hashes in lockfile are sufficient)

**Not v1:**
- Automated dependency update bot (Renovate/Dependabot)
- SBOM generation
- Runtime dependency monitoring

### Do NOT Do This

- **Do not add dependencies for trivial functionality.** Left-pad lesson applies. If it's < 50 lines, write it.
- **Do not upgrade major versions of `pg` or `hono` without running the full test suite.** Breaking changes in these affect every query and every route.
- **Do not use `*` or `latest` in dependency versions.** Use `^` ranges in package.json, exact versions in lockfile.
- **Do not ignore `pnpm audit` high/critical findings.** Low/info can be deferred.
- **Do not add dependencies from single-maintainer packages for critical paths** without evaluating maintenance risk.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Known vulnerability in `pg` | Unpatched version | `pnpm audit` reports high/critical | Update to patched version |
| Compromised transitive dependency | Supply chain attack | Lockfile diff shows unexpected changes | Revert lockfile, investigate |
| License violation | GPL dependency in tree | License checker audit | Replace with permissively-licensed alternative |
| Dependency bloat | New dep brings 200 transitive packages | Package count spike in lockfile | Evaluate necessity, find lighter alternative |

## Exit Criteria

- `pnpm audit` reports 0 critical and 0 high vulnerabilities
- `pg` and `hono` are on actively maintained versions (release within last 6 months)
- All licenses in dependency tree are permissive (MIT/ISC/BSD/Apache-2.0)
- Total runtime dependency count documented and monitored
- No `*` or `latest` version specifiers in any package.json

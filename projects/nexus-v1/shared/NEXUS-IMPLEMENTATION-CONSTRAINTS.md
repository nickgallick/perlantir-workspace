# NEXUS-IMPLEMENTATION-CONSTRAINTS.md

Hard constraints from the runtime environment (TOOLS.md) and spec decisions. Applies to all agents.

---

## Runtime Constraints

| Constraint | Impact | Workaround |
|-----------|--------|-----------|
| **No global TypeScript** | `tsc` not available. Must `pnpm add -D typescript` in workspace root | First setup step after monorepo init |
| **No Docker CLI** (inside container) | Cannot run `docker compose up`, `docker build`, or test containers from inside this environment | Docker compose files are authored here, tested externally. Container validation is a deploy-time gate, not a dev-time gate |
| **No database client CLIs** | No `psql`, `redis-cli`, `sqlite3` | All DB interaction through Node.js drivers (`@supabase/supabase-js` or `pg` directly). Schema verification through test suites |
| **No ripgrep/ag** | `grep -r` only. Slower on large trees | Use precise file paths. Keep naming clear. Avoid relying on codebase-wide search during implementation |
| **No `tree` command** | Use `find . -type f` or `ls -R` for directory visualization |
| **No Bun** | Spec prefers Bun but it's not installed. Node.js 22.22.2 is the runtime | All code must work on Node.js. No Bun-specific APIs |
| **No pip** | Python 3.13.5 exists but no package manager | Irrelevant for Nexus (TypeScript project). Do not use Python for any Nexus tooling |
| **pnpm via corepack** | `corepack enable && corepack prepare pnpm@latest --activate` before first pnpm command | Documented in setup sequence |

## Spec-Locked Stack Decisions

These are NOT open for discussion. Chosen in Spec §2 with rationale.

| Decision | Locked Choice | Do Not Propose |
|----------|--------------|----------------|
| Language | TypeScript (strict mode) | JavaScript, Python, Go, Rust |
| Runtime | Node.js 20+ (we have 22.22.2) | Bun (not installed), Deno |
| Database | PostgreSQL 16 + pgvector | SQLite, MySQL, MongoDB, Supabase-hosted-only |
| API framework | Hono | Express, Fastify, Koa, tRPC |
| Embeddings | OpenAI text-embedding-3-small (1536 dims) | Local models, Cohere, other providers |
| LLM (distillery only, post-launch) | Anthropic Claude Sonnet 4.6 | GPT-4, local models |
| WebSocket | `ws` library | Socket.io |
| Testing | Vitest | Jest, Mocha |
| Monorepo | Turborepo + pnpm | Nx, Lerna, npm workspaces |
| Container | Docker + docker-compose | Podman, Kubernetes (v1) |

## Database Constraint

PostgreSQL must have pgvector extension. Standard Postgres images won't work. Required image: `pgvector/pgvector:pg16`. The `uuid-ossp` extension is also required. Both are created in the migration (Spec §4).

## Test Infrastructure Constraint

Tests that touch the database need a real PostgreSQL instance with pgvector. SQLite mocks will not catch vector query bugs or recursive CTE behavior. Options:
1. External Postgres (running on host or remote) — simplest
2. testcontainers-node in CI — works in GitHub Actions but NOT inside this container (no Docker-in-Docker)

## Embedding API Constraint

Every decision and artifact creation triggers an OpenAI API call for embedding. Rate limits and costs apply. Tests must either:
- Use a stub embedder that returns deterministic vectors (for unit tests)
- Use real embeddings sparingly (for integration/scenario tests)

---

## What this changes in execution

No agent wastes time proposing alternatives to locked decisions, debugging environment gaps that don't exist, or designing for tools that aren't available. Eliminates: "should we use Bun?", "can we run psql to check?", "let's use Jest instead", "we could try SQLite for dev." Every constraint is a closed question.

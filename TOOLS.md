# TOOLS.md — Runtime Environment Inventory

Last probed: 2026-04-01

## Host & Container

- **OS**: Debian GNU/Linux 13 (trixie), kernel 6.8.0-106-generic x86_64
- **Container**: Docker (overlay filesystem)
- **Hostname**: 1a6442a37ccd (Hostinger VPS)
- **CPU**: 8 cores (x86_64)
- **Memory**: 31 GiB total (~30 GiB available)
- **Disk**: 387 GiB total, ~378 GiB free (3% used)
- **Swap**: None

## Language Runtimes

| Runtime | Version | Notes |
|---------|---------|-------|
| Node.js | v22.22.2 | Primary runtime |
| npm | 10.9.7 | |
| Python | 3.13.5 | No pip installed |
| GCC | 14.2.0 (Debian) | C/C++ compilation available |
| Make | 4.4.1 | |

**Not installed**: Ruby, Go, Rust, Java, Bun, Deno, Python 2

## Global npm Packages

- `openclaw` (2026.3.28)
- `clawhub`
- `corepack`
- `npm`

**Not globally installed**: TypeScript (`tsc`), ESLint, Prettier — available via `npx` (ESLint 10.1.0, Prettier 3.8.1) but require project-local install for `tsc`.

## Package Managers

- **npm**: Available globally
- **Homebrew**: 5.1.3 installed, no packages currently installed via brew
- **pip**: Not installed
- **corepack**: Available (Yarn/pnpm enablement)

## Shell Tools

**Available**: grep, find, sed, awk, curl, jq, wc, sort, uniq, diff, patch, tar, gzip, make, gcc, ssh, openssl (3.5.5)

**Not available**: wget, ag (silver-searcher), rg (ripgrep), tree, zip, sqlite3

## Database Clients

**None installed**: No postgres, mysql, redis-cli, sqlite3, or mongosh clients.

Database access requires installing clients or using Node.js drivers.

## Infrastructure Tools

**None installed**: No Docker CLI (inside container, no nested Docker), kubectl, terraform, or ansible.

## Network

- **External HTTP**: Available (verified against httpbin.org)
- **DNS**: Docker-internal resolver (127.0.0.11)
- **SSH client**: Available
- **Listening ports**: None detected at time of probe

## Git

- **Version**: 2.47.3
- **Available**: Clone, commit, push, pull — standard operations

## Constraints & Gaps for Project Work

- **TypeScript**: Must `npm install typescript` per-project; no global `tsc`
- **Database**: No client CLIs; use Node.js drivers (pg, mysql2, ioredis, etc.) via npm
- **Docker-in-Docker**: Not available; cannot build/run containers from inside this container
- **Python ecosystem**: Runtime exists but no pip — install pip or use Node.js instead
- **Search tools**: No ripgrep/ag; use `grep -r` for workspace searches (slower on large trees)
- **No tree command**: Use `find` or `ls -R` for directory visualization

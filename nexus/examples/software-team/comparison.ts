#!/usr/bin/env npx tsx
// ============================================================
// NEXUS v1 — The Comparison Demo
//
// Proves: same project, different agents, different compiled context.
//
// Run:
//   docker compose up -d
//   npx tsx examples/software-team/comparison.ts
// ============================================================

import { NexusClient, NexusApiError } from '@nexus-ai/sdk';

const SERVER_URL = process.env.NEXUS_URL ?? 'http://localhost:3000';

// ---- ANSI helpers ----
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  bg: '\x1b[48;5;236m',
};

function banner() {
  console.log(`
${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   NEXUS — Role-Differentiated Context Compilation Demo       ║
║                                                              ║
║   This demo proves:                                          ║
║   • Same project, different agents → different context       ║
║   • Scores change based on role and task                     ║
║   • Superseded decisions get deprioritized automatically     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝${C.reset}
`);
}

function hr(title: string) {
  const line = '─'.repeat(62);
  console.log(`\n${C.bold}${C.cyan}${line}${C.reset}`);
  console.log(`${C.bold}  ${title}${C.reset}`);
  console.log(`${C.cyan}${line}${C.reset}`);
}

function scoreColor(score: number): string {
  if (score >= 0.8) return C.green;
  if (score >= 0.5) return C.yellow;
  return C.dim;
}

function roleColor(role: string): string {
  switch (role) {
    case 'builder': return C.green;
    case 'reviewer': return C.magenta;
    case 'launch': return C.yellow;
    default: return C.cyan;
  }
}

function printDecisions(role: string, decisions: Array<{ decision: { title: string }; combined_score: number }>) {
  const color = roleColor(role);
  for (const sd of decisions.slice(0, 5)) {
    const sc = scoreColor(sd.combined_score);
    console.log(`   ${color}${role.padEnd(10)}${C.reset} ${sc}${sd.combined_score.toFixed(3)}${C.reset} │ ${sd.decision.title}`);
  }
}

async function main() {
  const t0 = performance.now();
  banner();

  const nx = new NexusClient({ url: SERVER_URL });

  // ── Health check ──
  try {
    await nx.health();
    console.log(`${C.dim}   Connected to ${SERVER_URL}${C.reset}\n`);
  } catch {
    console.error(`${C.red}   Cannot reach server at ${SERVER_URL}. Is it running?${C.reset}`);
    process.exit(1);
  }

  // ── Seed ──
  console.log(`${C.dim}   Seeding: 6 agents, 10 decisions, 4 edges...${C.reset}`);
  const { project, agents, decisions } = await nx.seedSoftwareTeamDemo();
  console.log(`${C.dim}   Project: ${project.id}${C.reset}\n`);

  // ══════════════════════════════════════════════════════════
  // SECTION 1: Role-Differentiated Compilation
  // ══════════════════════════════════════════════════════════
  hr('1. SAME PROJECT, DIFFERENT AGENTS');

  const roles = [
    { name: 'builder',  task: 'Implement the auth middleware for API routes' },
    { name: 'reviewer', task: 'Review the auth implementation for security vulnerabilities' },
    { name: 'launch',   task: 'Write the launch announcement for the new auth system' },
  ];

  const compilations: Array<{
    role: string;
    decisions: Array<{ decision: { title: string; status: string }; combined_score: number }>;
    count: number;
    time: number;
  }> = [];

  for (const r of roles) {
    const ctx = await nx.compileForAgent(r.name, r.task, project.id);
    compilations.push({
      role: r.name,
      decisions: ctx.decisions,
      count: ctx.decisions_included,
      time: ctx.compilation_time_ms,
    });
  }

  // Print each role's top decisions
  for (const comp of compilations) {
    const color = roleColor(comp.role);
    console.log(`\n   ${color}${C.bold}${comp.role.toUpperCase()}${C.reset} ${C.dim}(${comp.count} decisions, ${comp.time}ms)${C.reset}`);
    printDecisions(comp.role, comp.decisions);
  }

  // ── Side-by-side: same decision, different scores ──
  console.log(`\n${C.bold}   Score comparison — same decision across roles:${C.reset}\n`);
  console.log(`   ${'Decision'.padEnd(42)} ${'Builder'.padEnd(10)} ${'Reviewer'.padEnd(10)} ${'Launch'.padEnd(10)}`);
  console.log(`   ${'─'.repeat(42)} ${'─'.repeat(10)} ${'─'.repeat(10)} ${'─'.repeat(10)}`);

  // Collect all unique decision titles from the first compilation
  const topTitles = compilations[0].decisions.slice(0, 5).map(d => d.decision.title);
  for (const title of topTitles) {
    const scores = compilations.map(comp => {
      const found = comp.decisions.find(d => d.decision.title === title);
      return found ? found.combined_score : 0;
    });
    const truncTitle = title.length > 40 ? title.slice(0, 38) + '…' : title;
    const scoreCells = scores.map(s => {
      const color = scoreColor(s);
      return `${color}${s > 0 ? s.toFixed(3) : '  —  '}${C.reset}`;
    });
    console.log(`   ${truncTitle.padEnd(42)} ${scoreCells.join('     ')}`);
  }

  // ── Ordering difference proof ──
  console.log(`\n${C.bold}   Each role's #1 decision:${C.reset}`);
  for (const comp of compilations) {
    const color = roleColor(comp.role);
    const top = comp.decisions[0];
    console.log(`   ${color}${comp.role.padEnd(10)}${C.reset} → ${top.decision.title} ${C.dim}(${top.combined_score.toFixed(3)})${C.reset}`);
  }

  // ══════════════════════════════════════════════════════════
  // SECTION 2: Change Propagation
  // ══════════════════════════════════════════════════════════
  hr('2. CHANGE PROPAGATION');

  const ssoDecision = decisions.find(d => d.title.includes('Delay SSO'));
  if (ssoDecision) {
    console.log(`\n   ${C.dim}Superseding: "${ssoDecision.title}"${C.reset}`);

    const newDecision = await nx.supersedeDecision({
      project_id: project.id,
      title: 'Include SSO for enterprise beta only',
      description: 'SAML SSO available as beta for enterprise accounts at launch',
      reasoning: 'Three enterprise prospects requested SSO as launch blocker',
      made_by: 'product',
      supersedes_id: ssoDecision.id,
      affects: ['builder', 'launch', 'docs', 'ops'],
      tags: ['scope', 'requirements', 'enterprise', 'breaking_change'],
    });

    console.log(`   ${C.green}New: "${newDecision.title}"${C.reset}\n`);

    // Show notifications per role
    console.log(`${C.bold}   Role-specific notifications:${C.reset}`);
    for (const role of ['builder', 'launch', 'docs'] as const) {
      const notifs = await nx.getNotifications(agents[role].id, true);
      if (notifs.length > 0) {
        const n = notifs[0];
        const color = roleColor(role);
        console.log(`\n   ${color}${C.bold}${role.toUpperCase()}${C.reset}`);
        console.log(`   ${C.dim}Message:${C.reset} ${n.message}`);
        if (n.role_context) {
          console.log(`   ${C.dim}Why it matters:${C.reset} ${n.role_context}`);
        }
      }
    }

    // Recompile to show superseded decision deprioritized
    console.log(`\n${C.bold}   After supersede — recompile for launch:${C.reset}`);
    const updated = await nx.compileForAgent('launch', 'Write launch announcement', project.id);
    for (const sd of updated.decisions.slice(0, 4)) {
      const sc = scoreColor(sd.combined_score);
      const status = sd.decision.status === 'superseded' ? ` ${C.red}[superseded]${C.reset}` : '';
      console.log(`   ${sc}${sd.combined_score.toFixed(3)}${C.reset} │ ${sd.decision.title}${status}`);
    }
  }

  // ══════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════
  const elapsed = ((performance.now() - t0) / 1000).toFixed(1);

  hr('WHY THE OUTPUTS DIFFERED');
  console.log(`
   ${C.bold}Builder${C.reset} scored security + implementation decisions highest
   because its role profile weights ${C.green}security${C.reset}, ${C.green}api${C.reset}, and ${C.green}architecture${C.reset} tags,
   and most decisions directly ${C.green}affect${C.reset} the builder role.

   ${C.bold}Reviewer${C.reset} scored hashing + token rotation highest because
   its profile weights ${C.magenta}security${C.reset} and ${C.magenta}implementation${C.reset} tags — the details
   a reviewer needs to audit, not build.

   ${C.bold}Launch${C.reset} scored scope + deprecation + feature flags highest
   because its profile weights ${C.yellow}scope${C.reset}, ${C.yellow}requirements${C.reset}, and ${C.yellow}breaking_change${C.reset}
   — what matters for an announcement, not implementation.

   ${C.bold}After supersede${C.reset}: the old SSO decision dropped to ${C.red}×0.1 penalty${C.reset}.
   The new decision appeared with full relevance. Affected agents
   got ${C.cyan}role-appropriate notifications${C.reset} explaining why it matters to them.

   ${C.dim}Same project. Same decisions. Different agents. Different context.
   Completed in ${elapsed}s.${C.reset}
`);
}

main().catch((e) => {
  if (e instanceof NexusApiError) {
    console.error(`\n${C.red}Nexus API Error (${e.status}/${e.code}): ${e.serverMessage}${C.reset}`);
  } else {
    console.error(`\n${C.red}Error:${C.reset}`, e);
  }
  process.exit(1);
});

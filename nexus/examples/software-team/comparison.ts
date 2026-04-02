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
};

function banner() {
  console.log(`
${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   NEXUS — Role-Differentiated Context Compilation            ║
║                                                              ║
║   Same project. Different agents. Different context.         ║
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

function sc(score: number): string {
  const color = score >= 0.8 ? C.green : score >= 0.5 ? C.yellow : C.dim;
  return `${color}${score.toFixed(3)}${C.reset}`;
}

function rc(role: string): string {
  const colors: Record<string, string> = { builder: C.green, reviewer: C.magenta, launch: C.yellow };
  return `${colors[role] ?? C.cyan}${C.bold}${role.toUpperCase()}${C.reset}`;
}

async function main() {
  const t0 = performance.now();
  banner();

  const nx = new NexusClient({ url: SERVER_URL });

  try {
    await nx.health();
    console.log(`${C.dim}   Connected to ${SERVER_URL}${C.reset}`);
  } catch {
    console.error(`${C.red}   Cannot reach ${SERVER_URL}. Is the server running?${C.reset}`);
    process.exit(1);
  }

  console.log(`${C.dim}   Seeding: 6 agents, 10 decisions, 4 edges...${C.reset}\n`);
  const { project, agents, decisions } = await nx.seedSoftwareTeamDemo();

  // ══════════════════════════════════════════════════════════
  // SECTION 1: Role-Differentiated Compilation
  // ══════════════════════════════════════════════════════════
  hr('1. SAME PROJECT — THREE AGENTS — THREE CONTEXTS');
  console.log(`\n   ${C.dim}10 decisions about auth. 3 agents compile context for their task.${C.reset}`);

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

  // ── Each role's #1 — the proof at a glance ──
  console.log(`\n${C.bold}   Each role's #1 decision:${C.reset}\n`);
  for (const comp of compilations) {
    const top = comp.decisions[0];
    console.log(`   ${rc(comp.role).padEnd(30)} → ${top.decision.title} (${sc(top.combined_score)})`);
  }
  console.log(`\n   ${C.dim}Three agents. Three different top decisions. That's the point.${C.reset}`);

  // ── Top decisions per role ──
  for (const comp of compilations) {
    console.log(`\n   ${rc(comp.role)} ${C.dim}(${comp.count} decisions, ${comp.time}ms)${C.reset}`);
    for (const sd of comp.decisions.slice(0, 5)) {
      console.log(`   ${sc(sd.combined_score)} │ ${sd.decision.title}`);
    }
  }

  // ── Side-by-side score comparison ──
  // Collect top titles from ALL roles (not just builder) for fair comparison
  const titleSet = new Set<string>();
  for (const comp of compilations) {
    for (const sd of comp.decisions.slice(0, 3)) {
      titleSet.add(sd.decision.title);
    }
  }
  const comparisonTitles = [...titleSet].slice(0, 6);

  console.log(`\n${C.bold}   Same decision, different scores:${C.reset}\n`);
  console.log(`   ${'Decision'.padEnd(42)} ${'Builder'.padEnd(10)} ${'Reviewer'.padEnd(10)} ${'Launch'.padEnd(10)}`);
  console.log(`   ${'─'.repeat(42)} ${'─'.repeat(10)} ${'─'.repeat(10)} ${'─'.repeat(10)}`);

  for (const title of comparisonTitles) {
    const scores = compilations.map(comp => {
      const found = comp.decisions.find(d => d.decision.title === title);
      return found ? found.combined_score : 0;
    });
    const truncTitle = title.length > 40 ? title.slice(0, 38) + '…' : title;
    const cells = scores.map(s => s > 0 ? sc(s) : `${C.dim}  —  ${C.reset}`);
    console.log(`   ${truncTitle.padEnd(42)} ${cells.join('     ')}`);
  }

  // ── Strongest differentiation ──
  let maxSpread = 0;
  let spreadTitle = '';
  for (const title of comparisonTitles) {
    const scores = compilations.map(comp => {
      const found = comp.decisions.find(d => d.decision.title === title);
      return found ? found.combined_score : 0;
    }).filter(s => s > 0);
    if (scores.length >= 2) {
      const spread = Math.max(...scores) - Math.min(...scores);
      if (spread > maxSpread) { maxSpread = spread; spreadTitle = title; }
    }
  }
  if (spreadTitle) {
    console.log(`\n   ${C.bold}Widest score spread:${C.reset} "${spreadTitle}" — ${C.green}${maxSpread.toFixed(3)} gap${C.reset} across roles`);
  }

  // ══════════════════════════════════════════════════════════
  // SECTION 2: Change Propagation
  // ══════════════════════════════════════════════════════════
  hr('2. DECISION SUPERSEDED — CONTEXT UPDATES AUTOMATICALLY');

  const ssoDecision = decisions.find(d => d.title.includes('Delay SSO'));
  if (ssoDecision) {
    // Capture pre-supersede score for launch
    const preLaunch = await nx.compileForAgent('launch', 'Write launch announcement', project.id);
    const preScore = preLaunch.decisions.find(d => d.decision.id === ssoDecision.id);

    console.log(`\n   ${C.dim}Before:${C.reset} "${ssoDecision.title}" scores ${preScore ? sc(preScore.combined_score) : C.dim + 'n/a' + C.reset} for launch`);

    // Supersede
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

    console.log(`   ${C.dim}Action:${C.reset} Superseded by "${C.green}${newDecision.title}${C.reset}"`);

    // Post-supersede compilation
    const postLaunch = await nx.compileForAgent('launch', 'Write launch announcement', project.id);
    const oldPost = postLaunch.decisions.find(d => d.decision.id === ssoDecision.id);
    const newPost = postLaunch.decisions.find(d => d.decision.id === newDecision.id);

    console.log(`\n   ${C.bold}After — launch context:${C.reset}`);
    if (newPost) {
      console.log(`   ${sc(newPost.combined_score)} │ ${newPost.decision.title} ${C.green}[new]${C.reset}`);
    }
    if (oldPost) {
      console.log(`   ${sc(oldPost.combined_score)} │ ${oldPost.decision.title} ${C.red}[superseded — ×0.1 penalty]${C.reset}`);
    }
    if (preScore && oldPost) {
      console.log(`\n   ${C.dim}Score drop:${C.reset} ${sc(preScore.combined_score)} → ${sc(oldPost.combined_score)} ${C.dim}(superseded penalty applied automatically)${C.reset}`);
    }

    // Role-specific notifications
    console.log(`\n${C.bold}   Notifications — each role hears WHY it matters to them:${C.reset}`);
    for (const role of ['builder', 'launch', 'docs'] as const) {
      const notifs = await nx.getNotifications(agents[role].id, true);
      if (notifs.length > 0) {
        const n = notifs[0];
        console.log(`\n   ${rc(role)}`);
        console.log(`   ${n.message}`);
        if (n.role_context) console.log(`   ${C.dim}${n.role_context}${C.reset}`);
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // RESULT
  // ══════════════════════════════════════════════════════════
  const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
  hr('RESULT');

  console.log(`
   ${C.bold}What just happened:${C.reset}

   10 decisions about auth. 3 agents compiled context.
   Each got a different package — different scores, different order,
   different included decisions — because their roles weight different signals.

   Then a decision was superseded. The old one dropped to ×0.1.
   The new one appeared at full relevance. Each affected agent got
   a notification framed for their role — not a generic broadcast.

   ${C.bold}${C.cyan}Same project. Same decisions. Different agents. Different context.${C.reset}
   ${C.dim}${elapsed}s total.${C.reset}
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

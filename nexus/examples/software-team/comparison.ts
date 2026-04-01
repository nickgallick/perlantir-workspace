#!/usr/bin/env npx tsx
// ============================================================
// NEXUS v1 — The Comparison Demo (Spec §17, Day 7 Polish)
//
// Developer execution path:
//   1. Start PostgreSQL + run migrations
//   2. Start the Nexus server: pnpm dev:server  (or any Hono adapter)
//   3. Run this demo: npx tsx examples/software-team/comparison.ts
//
// Demonstrates:
//   A. Baseline vector retrieval: identical output for every agent
//   B. Nexus compilation: role-differentiated context per agent
//   C. Change propagation: role-appropriate notifications on supersede
//   D. Full SDK ergonomics: typed methods, error handling, convenience helpers
// ============================================================

import { NexusClient, NexusApiError } from '@nexus-ai/sdk';

const SERVER_URL = process.env.NEXUS_URL ?? 'http://localhost:3000';

function hr(title?: string) {
  if (title) {
    console.log('\n' + '━'.repeat(70));
    console.log(`  ${title}`);
    console.log('━'.repeat(70));
  } else {
    console.log('━'.repeat(70));
  }
}

async function main() {
  const nx = new NexusClient({ url: SERVER_URL });

  // ── Step 0: Verify server health ──
  console.log('\n🏥 Checking server health...');
  try {
    const h = await nx.health();
    console.log(`   Server: ${h.status} | DB: ${h.dependencies.database} | v${h.version}\n`);
  } catch (e) {
    if (e instanceof NexusApiError) {
      console.error(`   Server error (${e.status}/${e.code}): ${e.serverMessage}`);
    } else {
      console.error(`   Cannot reach server at ${SERVER_URL}. Is it running?`);
    }
    process.exit(1);
  }

  // ── Step 1: Seed demo project ──
  console.log('🔧 Seeding demo project with 6 agents, 10 decisions, 4 edges...');
  const { project, agents, decisions } = await nx.seedSoftwareTeamDemo();
  console.log(`   ✅ Project "${project.name}" (${project.id})`);
  console.log(`   ✅ Agents: ${Object.keys(agents).join(', ')}`);
  console.log(`   ✅ Decisions: ${decisions.length}`);

  // Register an artifact to show in compilation
  await nx.registerArtifact({
    project_id: project.id,
    name: 'auth-middleware.ts',
    artifact_type: 'code',
    produced_by: 'builder',
    path: 'packages/server/src/middleware/auth.ts',
    description: 'JWT auth middleware implementation',
    related_decision_ids: [decisions[0].id],
  });
  console.log('   ✅ Artifact registered: auth-middleware.ts');

  const task = 'Implement the auth middleware for API routes';

  // ── SECTION A: Baseline (what vector retrieval gives you) ──
  hr('A. BASELINE: Naive Vector Retrieval');
  console.log(`   Query: "${task}"\n`);

  const allDecisions = await nx.listDecisions(project.id);
  console.log(`   Returns the same ${allDecisions.length} results for EVERY agent:\n`);
  for (const d of allDecisions.slice(0, 5)) {
    console.log(`     • ${d.title}`);
  }
  if (allDecisions.length > 5) {
    console.log(`     ... and ${allDecisions.length - 5} more\n`);
  }

  console.log('\n   Problems:');
  console.log('   ✗ Builder and reviewer get identical context');
  console.log('   ✗ No reasoning about WHY decisions were made');
  console.log('   ✗ No connected decisions pulled in via graph');
  console.log("   ✗ Docs agent gets implementation details it doesn't need");
  console.log('   ✗ Launch agent sees security internals that are irrelevant');

  // ── SECTION B: Nexus role-aware compilation ──
  const demos = [
    { name: 'builder', task: 'Implement the auth middleware for API routes' },
    { name: 'reviewer', task: 'Review the auth middleware for security and correctness' },
    { name: 'launch', task: 'Write launch announcement for the new auth system' },
  ];

  for (const demo of demos) {
    hr(`B. NEXUS: Context for ${demo.name.toUpperCase()}`);
    console.log(`   Task: "${demo.task}"\n`);

    const ctx = await nx.compileForAgent(demo.name, demo.task, project.id);

    // Show key stats
    console.log(`   Decisions: ${ctx.decisions_included}/${ctx.decisions_considered} included`);
    console.log(`   Tokens: ${ctx.token_count}`);
    console.log(`   Time: ${ctx.compilation_time_ms}ms\n`);

    // Show top decisions with scores
    console.log('   Top decisions (by relevance):');
    for (const sd of ctx.decisions.slice(0, 5)) {
      console.log(`     ${sd.combined_score.toFixed(3)} │ ${sd.decision.title}`);
    }

    // Show formatted markdown excerpt (first 15 lines)
    if (ctx.formatted_markdown) {
      console.log('\n   Formatted context (first 15 lines):');
      const lines = ctx.formatted_markdown.split('\n').slice(0, 15);
      for (const line of lines) {
        console.log(`   │ ${line}`);
      }
      if (ctx.formatted_markdown.split('\n').length > 15) {
        console.log('   │ ...');
      }
    }
  }

  // ── SECTION C: Change Propagation ──
  hr('C. CHANGE PROPAGATION: Supersede a decision');

  const ssoDecision = decisions.find((d) => d.title.includes('Delay SSO'));
  if (ssoDecision) {
    console.log(`\n   Superseding: "${ssoDecision.title}"`);

    const newDecision = await nx.supersedeDecision({
      project_id: project.id,
      title: 'Include SSO for enterprise beta only',
      description: 'SAML SSO available as beta for enterprise accounts at launch',
      reasoning:
        'Three enterprise prospects requested SSO as launch blocker. Scoping to enterprise beta reduces risk while capturing revenue.',
      made_by: 'product',
      supersedes_id: ssoDecision.id,
      affects: ['builder', 'launch', 'docs', 'ops'],
      tags: ['scope', 'requirements', 'enterprise', 'breaking_change'],
      alternatives_considered: [
        {
          option: 'Ship SSO for all tiers',
          rejected_reason: 'Too much scope — OIDC alone is 2 weeks',
        },
        {
          option: 'Keep SSO delayed',
          rejected_reason: 'Losing 3 enterprise deals worth $15K+ MRR',
        },
      ],
    });

    console.log(`   New decision: "${newDecision.title}" (${newDecision.status})\n`);

    // Show role-specific notifications
    console.log('   Notifications per role:');
    for (const role of ['builder', 'launch', 'docs'] as const) {
      const notifs = await nx.getNotifications(agents[role].id, true);
      if (notifs.length > 0) {
        const latest = notifs[0];
        console.log(`\n   ${role.toUpperCase()}:`);
        console.log(`     Message: ${latest.message}`);
        if (latest.role_context) {
          console.log(`     Why it matters: ${latest.role_context}`);
        }
      }
    }

    // Recompile to show updated context
    console.log('\n   Recompiling for launch after supersede...');
    const updated = await nx.compileForAgent('launch', 'Write launch announcement', project.id);
    const ssoInCtx = updated.decisions.find((sd) =>
      sd.decision.title.includes('SSO'),
    );
    if (ssoInCtx) {
      console.log(
        `   Context now includes: "${ssoInCtx.decision.title}" (${ssoInCtx.decision.status}, score: ${ssoInCtx.combined_score.toFixed(3)})`,
      );
    }

    // Show the superseded decision is deprioritized
    const oldSsoInCtx = updated.decisions.find(
      (sd) => sd.decision.id === ssoDecision.id,
    );
    if (oldSsoInCtx) {
      console.log(
        `   Old decision: "${oldSsoInCtx.decision.title}" (${oldSsoInCtx.decision.status}, score: ${oldSsoInCtx.combined_score.toFixed(3)}) — deprioritized`,
      );
    }
  }

  // ── SECTION D: SDK Ergonomics Showcase ──
  hr('D. SDK ERGONOMICS');

  console.log('\n   Edge CRUD:');
  const edges = await nx.listEdges(decisions[0].id);
  console.log(`     Edges from "${decisions[0].title}": ${edges.length}`);
  for (const edge of edges) {
    console.log(`       → ${edge.relationship} → ${edge.target_id}`);
  }

  console.log('\n   Artifact CRUD:');
  const artifacts = await nx.listArtifacts(project.id);
  console.log(`     Artifacts: ${artifacts.length}`);
  for (const a of artifacts) {
    console.log(`       ${a.name} (${a.artifact_type}) — ${a.description}`);
  }

  console.log('\n   Graph traversal:');
  const graph = await nx.getDecisionGraph(decisions[0].id, 2);
  console.log(`     Connected to "${decisions[0].title}": ${graph.length} decisions`);

  console.log('\n   Error handling (typed):');
  try {
    await nx.getProject('00000000-0000-0000-0000-000000000000');
  } catch (e) {
    if (e instanceof NexusApiError) {
      console.log(`     NexusApiError: status=${e.status}, code=${e.code}, message="${e.serverMessage}"`);
    }
  }

  // ── SUMMARY ──
  hr('RESULT');
  console.log(`
   Baseline: Same results for every agent. No reasoning. No graph. No role awareness.
   Nexus:    Different context per role. Full reasoning. Graph neighbors. Change propagation.

   Same project. Same decisions. Different agents. Different context.
   Zero handoff loss.
`);
}

main().catch((e) => {
  if (e instanceof NexusApiError) {
    console.error(`\n❌ Nexus API Error (${e.status}/${e.code}): ${e.serverMessage}`);
    if (e.details) console.error('   Details:', e.details);
  } else {
    console.error('\n❌ Error:', e);
  }
  process.exit(1);
});

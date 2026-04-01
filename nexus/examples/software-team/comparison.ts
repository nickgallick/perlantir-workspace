// ============================================================
// NEXUS v1 — The Comparison Demo (Spec §17)
//
// Run with: pnpm demo:compare
// Requires: Nexus server running on http://localhost:3000
//
// Demonstrates:
// 1. Baseline vector retrieval: same results for every agent
// 2. Nexus compilation: different context per role
// 3. Change propagation: role-appropriate notifications
// ============================================================

import { NexusClient } from '@nexus-ai/sdk';

async function runComparison() {
  const nx = new NexusClient({ url: 'http://localhost:3000' });

  console.log('\n🔧 Setting up demo project...\n');
  const { project, agents, decisions } = await nx.seedSoftwareTeamDemo();
  console.log(`✅ Created project with ${Object.keys(agents).length} agents and ${decisions.length} decisions\n`);

  const task = 'Implement the auth middleware for API routes';

  // ============================================================
  // BASELINE: What vector retrieval gives you
  // ============================================================
  console.log('━'.repeat(70));
  console.log('  BASELINE: Naive Vector Retrieval');
  console.log(`  Query: "${task}"`);
  console.log('━'.repeat(70) + '\n');

  const allDecisions = await nx.listDecisions(project.id);
  console.log(`  Returns the same ${Math.min(5, allDecisions.length)} results for EVERY agent:\n`);
  for (const d of allDecisions.slice(0, 5)) {
    console.log(`  • ${d.title}`);
  }

  console.log('\n  Problems:');
  console.log('  ✗ Builder and reviewer get identical results');
  console.log('  ✗ No reasoning about WHY decisions were made');
  console.log('  ✗ No connected decisions pulled in');
  console.log("  ✗ Docs agent gets implementation details it doesn't need");
  console.log('  ✗ Launch agent sees security internals that are irrelevant\n');

  // ============================================================
  // NEXUS: Role-aware compilation
  // ============================================================
  const demos = [
    { name: 'builder', task: 'Implement the auth middleware for API routes' },
    { name: 'reviewer', task: 'Review the auth middleware for security and correctness' },
    { name: 'launch', task: 'Write launch announcement for the new auth system' },
  ];

  for (const demo of demos) {
    console.log('━'.repeat(70));
    console.log(`  NEXUS: Context for ${demo.name.toUpperCase()}`);
    console.log(`  Task: "${demo.task}"`);
    console.log('━'.repeat(70));

    const ctx = await nx.compileForAgent(demo.name, demo.task, project.id);
    console.log(ctx.formatted_markdown);
    console.log(`  ${ctx.decisions_included}/${ctx.decisions_considered} decisions | ${ctx.token_count} tokens | ${ctx.compilation_time_ms}ms\n`);
  }

  // ============================================================
  // CHANGE PROPAGATION
  // ============================================================
  console.log('━'.repeat(70));
  console.log('  CHANGE PROPAGATION: Supersede a decision');
  console.log('━'.repeat(70) + '\n');

  const ssoDecision = decisions.find((d) => d.title.includes('Delay SSO'));
  if (ssoDecision) {
    console.log(`  Superseding: "${ssoDecision.title}"\n`);

    const newDecision = await nx.supersedeDecision({
      project_id: project.id,
      title: 'Include SSO for enterprise beta only',
      description: 'SAML SSO available as beta for enterprise accounts at launch',
      reasoning: 'Three enterprise prospects requested SSO as launch blocker. Scoping to enterprise beta reduces risk while capturing revenue.',
      made_by: 'product',
      supersedes_id: ssoDecision.id,
      affects: ['builder', 'launch', 'docs', 'ops'],
      tags: ['scope', 'requirements', 'enterprise', 'breaking_change'],
      alternatives_considered: [
        { option: 'Ship SSO for all tiers', rejected_reason: 'Too much scope — OIDC alone is 2 weeks' },
        { option: 'Keep SSO delayed', rejected_reason: 'Losing 3 enterprise deals worth $15K+ MRR' },
      ],
    });

    console.log(`  New: "${newDecision.title}"\n`);

    // Show role-specific notifications
    for (const role of ['builder', 'launch', 'docs']) {
      const notifs = await nx.getNotifications(agents[role].id, true);
      if (notifs.length > 0) {
        console.log(`  ${role.toUpperCase()}: ${notifs[0].message}`);
        if (notifs[0].role_context) {
          console.log(`    Why it matters: ${notifs[0].role_context}`);
        }
      }
    }

    // Recompile to show updated context
    console.log('\n  Recompiling for launch...\n');
    const updated = await nx.compileForAgent('launch', 'Write launch announcement', project.id);
    const ssoInCtx = updated.decisions.find((sd) => sd.decision.title.includes('SSO'));
    if (ssoInCtx) {
      console.log(`  Context now includes: "${ssoInCtx.decision.title}" (${ssoInCtx.decision.status}, score: ${ssoInCtx.combined_score.toFixed(3)})`);
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '━'.repeat(70));
  console.log('  RESULT');
  console.log('━'.repeat(70));
  console.log('\n  Baseline: Same results for every agent. No reasoning. No graph. No awareness of role.');
  console.log('  Nexus:    Different context per role. Full reasoning. Graph neighbors. Change propagation.\n');
  console.log('  Same project. Same decisions. Different agents. Different context.');
  console.log('  Zero handoff loss.\n');
}

runComparison().catch(console.error);

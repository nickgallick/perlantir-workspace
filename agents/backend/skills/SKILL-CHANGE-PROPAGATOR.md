# SKILL-CHANGE-PROPAGATOR

## Purpose

Extend and debug the change propagation system: event detection, subscription matching, role-appropriate notification generation, and WebSocket push. This is what makes Nexus a live system rather than a static context compiler.

## When to Use

- Any task involving notifications or real-time agent awareness
- Adding new event types (beyond create/supersede/revert)
- Modifying role_context messages or urgency levels
- Implementing the WebSocket endpoint
- Debugging missing or incorrect notifications
- Adding notification delivery channels

## Inputs Required

- `packages/core/src/change-propagator/propagator.ts` — `ChangePropagator` class
- `packages/core/src/change-propagator/subscriptions.ts` — subscription CRUD
- `packages/core/tests/change-propagator.test.ts` — 13 tests
- `packages/core/tests/scenario.test.ts` — 11 scenario tests including propagation verification
- `packages/server/src/app.ts` — notification routes + propagator integration in decision routes

## Execution Method

### Event Flow

```
Decision mutated (create/supersede/revert)
  ↓
Route handler detects mutation type
  ↓
Calls propagator.onDecisionXxx(decision, ...)
  ↓
propagator.propagate(event):
  1. For each agent name in event.affected_agents:
     a. Query DB: SELECT * FROM agents WHERE name = $1
     b. For each matching agent row:
        i.   generateRoleNotification(agent, event) → { message, role_context, urgency }
        ii.  INSERT INTO notifications (agent_id, decision_id, type, message, role_context)
        iii. If WebSocket client registered for agent.id → ws.send(JSON.stringify(notification))
  ↓
Returns RoleNotification[]
```

### Event Types

| Event | Trigger | Urgency | What Changes |
|-------|---------|---------|--------------|
| `decision_created` | New decision INSERT | `medium` | New context available |
| `decision_superseded` | Old decision marked superseded + new decision created | `high` | Old context invalidated, new context replaces it |
| `decision_reverted` | Decision status → reverted | `high` | Context withdrawn |

### Role Context Map

The propagator uses a static `ROLE_CONTEXT_MAP` keyed by role name:

```typescript
builder:    'Check if your implementation aligns with this change. Code changes may be needed.'
reviewer:   'Review criteria may have changed. Update your checklist before the next review.'
product:    'Scope or requirements may have shifted. Verify alignment with product goals.'
docs:       'Documentation may need updating. Check all published content for accuracy.'
launch:     'Public messaging may need updating. Check all content for accuracy.'
ops:        'Infrastructure or config may be affected. Check deployment alignment.'
```

Unknown roles get: `'This decision may affect your current work. Review for impact.'`

### Agent Resolution

The propagator resolves agent names (from `decision.affects`) to agent rows via `SELECT * FROM agents WHERE name = $1`. This is a **cross-project query** — if two projects have an agent named "builder", both get notified. This is intentional for v1 (single-tenant).

### Server Integration Pattern

In `app.ts`, propagation is called after successful mutation:

```typescript
// POST /api/projects/:id/decisions
if (body.supersedes_id) {
  await updateDecisionStatus(pool, body.supersedes_id, 'superseded');
  const decision = await createDecision(pool, { ... });
  const oldDecision = await getDecision(pool, body.supersedes_id);
  await propagator.onDecisionSuperseded(decision, oldDecision);  // After both DB ops succeed
} else {
  const decision = await createDecision(pool, { ... });
  await propagator.onDecisionCreated(decision);  // After DB op succeeds
}

// PATCH /api/decisions/:id  (status=reverted)
const updated = await updateDecisionStatus(pool, id, 'reverted');
await propagator.onDecisionReverted(updated, body.reverted_by);
```

### Adding a New Event Type

1. Add method to `ChangePropagator`: `async onDecisionXxx(decision, ...): Promise<RoleNotification[]>`
2. Construct a `ChangeEvent` with `type: 'decision_xxx'`
3. Add message template in `generateRoleNotification` switch statement
4. Call from the appropriate route handler after DB mutation succeeds
5. Add test in `change-propagator.test.ts`
6. Verify notification persisted in DB + available via `GET /api/agents/:id/notifications`

### WebSocket (Stubbed)

The propagator accepts a `wsClients` Map in its constructor and sends to connected clients:

```typescript
const ws = this.wsClients.get(agent.id);
if (ws && ws.readyState === 1) {  // 1 = OPEN
  ws.send(JSON.stringify({ type: 'notification', data: notification }));
}
```

The server does not expose a WebSocket endpoint yet. When implementing:
- Accept WS connections at `/ws` or `/api/ws`
- Authenticate via query param or first message
- Register client with `propagator.registerClient(agentId, ws)`
- Handle disconnect with `propagator.removeClient(agentId)`

### Do NOT Do This

- **Do not call propagator before the DB mutation is committed.** If the INSERT/UPDATE fails, you've sent a notification for a change that didn't happen.
- **Do not add notification types without updating the `notification_type` field expectations.** The notifications table has no CHECK constraint on type — but consumers may filter by it.
- **Do not assume `affected_agents` contains agent IDs.** They are agent **names**. The propagator resolves names to IDs via DB lookup.
- **Do not propagate inside a transaction.** The notification INSERT should be a separate operation so a notification failure doesn't roll back the decision mutation.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| No notifications generated | `decision.affects` is empty array | `propagate()` returns `[]` | Ensure decisions have `affects` populated |
| Notification for wrong agent | Agent name collision across projects | Agent in unrelated project gets notified | Expected for v1 (single-tenant). Multi-tenant fix: filter by project_id |
| WebSocket message not received | Client disconnected but not removed from map | `ws.readyState !== 1` | Check readyState before send; add disconnect handler |
| Duplicate notifications | Propagator called twice (e.g., route handler bug) | Multiple notifications for same decision+agent | Deduplicate in propagate() or add DB unique constraint |
| `role_context` is generic fallback | Agent role not in ROLE_CONTEXT_MAP | Notification has generic text | Add role to ROLE_CONTEXT_MAP |

## Nexus-Specific Examples

**Supersede flow from the demo script:**
```typescript
// 1. SDK calls supersedeDecision
const newDecision = await nx.supersedeDecision({
  project_id, title: 'Include SSO for enterprise beta',
  supersedes_id: ssoDecision.id,
  affects: ['builder', 'launch', 'docs', 'ops'],
  ...
});

// 2. Server route: marks old as superseded, creates new, propagates
//    → 4 agents × 1 notification each = 4 notifications

// 3. Each affected agent gets role-appropriate notification:
//    builder: "Decision updated: ..." + "Check if your implementation aligns..."
//    launch:  "Decision updated: ..." + "Public messaging may need updating..."
//    docs:    "Decision updated: ..." + "Documentation may need updating..."
//    ops:     "Decision updated: ..." + "Infrastructure or config may be affected..."
```

## Exit Criteria

- Propagator generates notifications for all agents in `decision.affects`
- `role_context` is role-specific, not generic
- Urgency levels match event type (high for supersede/revert, medium for create)
- Notifications persist to DB and are retrievable via `GET /api/agents/:id/notifications`
- WebSocket push works for registered clients (when endpoint exists)
- 13 `change-propagator.test.ts` tests pass
- 11 `scenario.test.ts` tests pass (includes propagation verification)
- No notifications generated before DB mutation commits

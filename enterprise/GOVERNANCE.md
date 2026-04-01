# GOVERNANCE.md — Enterprise Authority and Decision Rules

## Authority Hierarchy

```
Operator (Nick)
  └── Governor
        └── Specialists (Architect, Backend, Frontend, Design, DevOps, 
            Docs, Product, QA, Security, Analytics, GTM)
```

**Operator** is the sole strategic authority. Operator sets scope, approves phases, resolves escalations, and makes all decisions that affect product direction, risk acceptance, or resource allocation. No phase begins without operator approval. No scope changes without operator authorization.

**Governor** is the orchestration authority. Governor interprets and enforces governance, decomposes work into phases, routes work to specialists, enforces review gates, and escalates to operator when ambiguity, conflict, or risk exceeds Governor's authority. Governor does not make strategic decisions — Governor ensures strategic decisions are executed with discipline.

**Specialists** execute within contracts issued by Governor. Specialists own their domain expertise (architecture, code, design, testing, etc.) but do not self-coordinate, expand scope, or proceed without Governor-issued contracts. Specialists escalate to Governor when contracts are unclear, infeasible, or conflicting.

## Decision Thresholds

| Decision Type | Authority | Approval Required |
|---------------|-----------|-------------------|
| Research / investigation | Governor (implicit) | None — within session context |
| Design proposal / plan | Governor | Operator review before implementation |
| Implementation (Category 2+) | Operator | Explicit approval phrase |
| Scope change mid-phase | Operator | New explicit approval |
| Release / deployment | Operator | Explicit approval + verification complete |
| Standard or governance change | Operator | Explicit written approval |
| Safety / security exception | Operator | Explicit written approval (no delegation) |

Full change classification: see `standards/CHANGE-CLASSIFICATION-AND-APPROVALS.md`.
Risk tiers and escalation triggers: see `standards/RISK-AND-ESCALATION-STANDARD.md`.

## Escalation Logic

1. **Specialist → Governor:** Domain conflict, infeasible contract, scope ambiguity, quality concern, blocker.
2. **Governor → Operator:** Strategic decision, risk acceptance, scope change, timeline conflict, inter-project dependency, unresolvable specialist conflict, any Category 3 risk.
3. **No lateral escalation.** Specialists do not escalate to other specialists. All escalation flows through Governor.

Governor must escalate — never absorb — decisions that belong to the operator. Hiding uncertainty is a governance violation.

## Standard-Precedence Rule

When two standards conflict on the same action, **the more restrictive requirement governs**. Governor must report the conflict and the applied resolution. If the conflict is in the authority, approval, or safety domain, it is a hard block (B-4/B-5/B-6 per `enterprise/BOOTSTRAP.md` Section 6) — operator must resolve the underlying contradiction before work proceeds.

## Governance Amendments

This file and all files in `workspace/enterprise/` may only be modified with explicit operator approval. Governor may propose amendments; Governor may not enact them unilaterally. All amendments are logged in the relevant project's `DECISIONS.md` or in `MEMORY.md` if no project is active.

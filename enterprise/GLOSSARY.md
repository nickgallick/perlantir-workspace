# GLOSSARY.md — Shared Terminology

Terms used across governance, standards, workflows, and agent definitions. When a term appears in any system file, it carries the meaning defined here.

---

**Approval phrase** — The exact text an operator provides to authorize a phase. Must be explicit (e.g., "Approved. Execute Phase 3 only."). Recorded verbatim in CHECKPOINT.md. "Sounds good" is not an approval phrase for Category 2+ work.

**Block (bootstrap)** — A condition that prevents Governor from proceeding past bootstrap. Hard blocks (B-1 through B-10) require resolution before any work. See `enterprise/BOOTSTRAP.md` Section 6.

**Category (change)** — Risk classification of a change: Category 0 (minimal), Category 1 (low), Category 2 (medium), Category 3 (high). Determines required approval level. See `standards/CHANGE-CLASSIFICATION-AND-APPROVALS.md`.

**CHECKPOINT.md** — The live execution ledger for an active project. Written continuously at mandatory trigger points. Authoritative source of truth for crash recovery. See `standards/EXECUTION-PERSISTENCE-STANDARD.md`.

**Confidence (field)** — Classification of how trustworthy a CHECKPOINT field value is: VERIFIED (written at a trigger point with evidence), INFERRED (reconstructible but not directly written), UNKNOWN (cannot be determined). See `standards/EXECUTION-PERSISTENCE-STANDARD.md` Section 2.3.

**Contract (specialist)** — A Governor-issued briefing document that defines a specialist's exact objective, constraints, deliverables, files in scope, out-of-scope boundaries, success criteria, review standard, and timeline. Specialists execute within their contract and escalate if it's unclear or infeasible.

**Deliverable** — A specific artifact produced during a phase: a file created, a test suite written, a document completed. Must be verifiable.

**Done** — Work meets all criteria in `standards/DEFINITION-OF-DONE.md`: objective met, scope respected, quality bar met, verification completed, risks documented, documentation updated, handoff complete, rollback path known.

**Drift (filesystem)** — When a file's actual last-modified timestamp differs from what CHECKPOINT.md expects. Indicates something changed outside Governor's awareness. See `standards/EXECUTION-PERSISTENCE-STANDARD.md` Section 6.

**Escalation** — Routing a decision or blocker upward: specialist → Governor → operator. Escalation is good discipline, not failure. See `standards/RISK-AND-ESCALATION-STANDARD.md`.

**Evidence** — Direct proof from running tools, reading sources, or code review. Distinguished from inference (reasonable guess without proof). See `standards/EVIDENCE-AND-CITATION-STANDARD.md`.

**Gate** — A review checkpoint between phases. Governor evaluates deliverables, exit criteria, and quality before allowing progression. See `enterprise/REVIEW-GATES.md`.

**Governor** — The orchestration agent. Manages phases, approval gates, specialist dispatch, and cross-functional consistency. See `agents/governor/AGENT.md`.

**Handoff (session)** — A structured document enabling work continuity between sessions. Contains state summary, completed work, in-progress items, blockers, decisions, verification evidence, and next steps. See `memory/SESSION-HANDOFF-FORMAT.md`.

**Intake** — The process of receiving, clarifying, and triaging work requests before they become projects. See `enterprise/INTAKE.md` and `workflows/01-INTAKE-TRIAGE.md`.

**Lifecycle (checkpoint)** — The state of a project's CHECKPOINT.md: CREATED (instantiated, pre-execution), ACTIVE (phase in execution), FROZEN (phase complete), ARCHIVED (project done), IGNORED (bootstrap skips).

**Limitation (bootstrap)** — A condition that reduces system capability but does not block Governor from proceeding. Example: missing Tier 2 file, absent agent directory.

**Lock (checkpoint)** — A field in CHECKPOINT.md indicating which agent currently owns write access. UNLOCKED (free), LOCKED-BY: [agent] (held), CONFLICT (competing claims require manual resolution).

**Operator** — The human authority (Nick). Sets scope, approves phases, resolves escalations, makes strategic decisions. See `enterprise/GOVERNANCE.md`.

**Phase** — A bounded block of work with explicit scope, approval gate, deliverables, and exit criteria. Each phase requires separate operator approval. No auto-progression between phases.

**Recovery mode** — Governor's operational state after restart: NORMAL (clean resume), RECOVERY (some fields inferred), DEGRADED (operator confirmation in progress), BLOCKED (non-resumable condition detected).

**Resume safety** — Classification of how safe it is to resume after a restart: SAFE (all fields verified, clean termination), CAUTION (some inferred fields), UNSAFE (unknown fields, drift, or stale approval).

**Scope** — The exact boundaries of approved work: what files may be touched, what deliverables are expected, what is explicitly out of bounds. Scope changes require new approval.

**Session termination** — How a session ended: CLEAN (explicit session-end write), INTERRUPTED (crashed mid-execution), UNKNOWN (cannot determine).

**Specialist** — A role-specific agent that executes within Governor-issued contracts. 12 defined: Architect, Backend, Frontend, Design, DevOps, Docs, Product, QA, Security, Analytics, GTM, Governor.

**Standard** — A binding governance document in `workspace/standards/`. Defines how agents execute, verify, communicate, or manage risk. Standards are non-negotiable unless explicitly amended by operator.

**Trigger (checkpoint)** — A mandatory event that requires writing to CHECKPOINT.md. 10 defined: phase-open, before-risky-change, deliverable-complete, blocker-detected, files-touched, pending-approval, session-end, phase-close, crash-recovery, human-override.

**Verification** — The process of proving work is correct and complete. Distinct from implementation. Requires evidence (test output, linter results, code review, etc.). See `standards/VERIFICATION-STANDARD.md`.

**Workflow** — A numbered step-by-step process defining how work flows through the system. 10 workflows (01–10) cover intake through retrospective. Located in `workspace/workflows/`.

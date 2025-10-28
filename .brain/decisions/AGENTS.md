# Architecture Decision Records (ADRs)

> **Purpose**: Document significant architectural and design decisions with context and rationale.
> **Update When**: Major technical decisions are made that affect project direction.
> **Agent Instructions**: Read before making similar decisions. Create new ADR for significant choices.

## What is an ADR?

An Architecture Decision Record captures an important architectural decision along with its context and consequences. This helps future developers (and AI agents) understand:
- **Why** a decision was made
- **What** alternatives were considered
- **What** the tradeoffs are

## When to Create an ADR

Create an ADR when:
- Choosing a framework, library, or major dependency
- Deciding on architectural patterns or project structure
- Making decisions that are hard to reverse
- Establishing conventions that affect multiple parts of the codebase
- Resolving significant technical debates

## ADR Naming Convention

```
YYYY-MM-DD-sequential-number-short-title.md

Examples:
2024-01-15-001-use-postgresql-for-database.md
2024-01-20-002-implement-event-sourcing.md
2024-02-01-003-adopt-typescript.md
```

## ADR Status

- 🟢 **Accepted** - Decision is approved and being implemented
- ⏳ **Proposed** - Decision is under consideration
- ✅ **Implemented** - Decision is fully implemented
- 🔄 **Superseded** - Replaced by a newer decision (link to new ADR)
- ❌ **Rejected** - Decision was considered but not adopted
- ⚠️ **Deprecated** - No longer recommended but still in use

## Active Decisions

### [ADR-001] [Decision Title] ✅
**Date**: YYYY-MM-DD
**Status**: Implemented
**File**: `001-short-title.md`
**Impact**: High/Medium/Low

**Summary**: [One sentence summary]

---

### [ADR-002] [Decision Title] 🟢
**Date**: YYYY-MM-DD
**Status**: Accepted
**File**: `002-short-title.md`
**Impact**: High

**Summary**: [One sentence summary]

---

## Superseded Decisions

### [ADR-XXX] [Old Decision] 🔄
**Date**: YYYY-MM-DD
**Status**: Superseded by [ADR-YYY]
**File**: `XXX-old-decision.md`

**Summary**: [Why it was superseded]

---

## Template

See `TEMPLATE.md` in this directory for the ADR template.

---
*Last Updated: [Date] | Updated By: [Agent/Human name]*
*Total ADRs: [Count] | Active: [Count]*

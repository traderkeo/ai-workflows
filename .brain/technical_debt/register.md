# Technical Debt Register

> **Purpose**: Track known technical debt, shortcuts, and areas needing improvement.
> **Update When**: New tech debt identified, debt paid down, or priority changes.
> **Agent Instructions**: Check before making changes to identified areas. Add new debt when shortcuts are taken.

## Active Technical Debt

### [DEBT-001] [Brief Title]
**Priority**: 🔴 High / 🟡 Medium / 🟢 Low
**Added**: [Date]
**Category**: Architecture / Code Quality / Performance / Security / Documentation / Testing / Other
**Effort to Fix**: Small / Medium / Large / X-Large

**Location**: `path/to/file.ext` or [Component name]

**Description**:
[What the technical debt is]

**Why It Exists**:
[Why this shortcut was taken or why this debt accumulated]
- Time constraints
- Lack of information
- Deliberate tradeoff
- Legacy code
- Other: [Specify]

**Impact**:
**Current Impact**: [How it affects the project now]
- Performance: None / Low / Medium / High
- Maintainability: None / Low / Medium / High
- Security: None / Low / Medium / High
- User Experience: None / Low / Medium / High

**Future Risk**: [What could happen if not addressed]
-
-

**Proposed Solution**:
[How to address this debt]

**Estimated Effort**: [Time/complexity to fix]

**Blockers**: [What prevents fixing this now]
- None
- [Blocker description]

**Related**:
- Related to: [DEBT-XXX]
- Blocks: [TASK-XXX]
- Depends on: [ADR-XXX]

---

### [DEBT-002] [Brief Title]
**Priority**: 🟡 Medium
**Added**: [Date]
**Category**: Code Quality
**Effort to Fix**: Medium

**Location**: `path/to/file.ext:line`

**Description**:

**Why It Exists**:

**Impact**:

**Proposed Solution**:

---

## Debt by Category

### Architecture
- [DEBT-XXX] - [Title] (Priority: 🔴)
- [DEBT-YYY] - [Title] (Priority: 🟡)

### Code Quality
- [DEBT-XXX] - [Title] (Priority: 🟡)

### Performance
- [DEBT-XXX] - [Title] (Priority: 🟢)

### Security
- [DEBT-XXX] - [Title] (Priority: 🔴)

### Testing
- [DEBT-XXX] - [Title] (Priority: 🟡)

### Documentation
- [DEBT-XXX] - [Title] (Priority: 🟢)

---

## Paid Down Debt

### [DEBT-XXX] [Title] ✅
**Resolved**: [Date]
**Originally Added**: [Date]
**Time to Resolve**: [Duration]
**Priority Was**: High

**Issue**:
[What the debt was]

**Resolution**:
[How it was fixed]

**Lessons Learned**:
[What we learned from addressing this]

**Files Changed**:
- `path/to/file.ext`

---

## Debt Metrics

**Total Active Debt Items**: [Count]
- High Priority: [Count]
- Medium Priority: [Count]
- Low Priority: [Count]

**By Category**:
- Architecture: [Count]
- Code Quality: [Count]
- Performance: [Count]
- Security: [Count]
- Testing: [Count]
- Documentation: [Count]

**Debt Trend**: 📈 Increasing / 📊 Stable / 📉 Decreasing

**Average Age**: [Days/Weeks/Months]

**Oldest Item**: [DEBT-XXX] ([Days] old)

---

## Debt Paydown Plan

### This Sprint/Iteration
1. [DEBT-XXX] - [Title]
2. [DEBT-YYY] - [Title]

### Next Sprint/Iteration
1. [DEBT-ZZZ] - [Title]

### Backlog
- [DEBT-AAA] - [Title]
- [DEBT-BBB] - [Title]

---

## Acceptable vs Unacceptable Debt

### Acceptable (for now)
[Debt we're okay living with temporarily]
- [DEBT-XXX]: [Why it's acceptable]

### Unacceptable (must address)
[Debt that should be prioritized]
- [DEBT-YYY]: [Why it must be fixed]

---

## Prevention Strategies

### What Causes Debt in This Project
1. [Cause] - [How often this happens]
2. [Cause] - [Frequency]

### How to Prevent Future Debt
-
-

### When to Add Debt (Deliberately)
Acceptable reasons:
- Time-critical deadline with plan to fix
- Spike/proof-of-concept code
- Waiting on external dependency

Always document in this register when taking on debt deliberately.

---

## Code Smells to Watch For

- [ ] Duplicated code
- [ ] Long functions/methods (>50 lines)
- [ ] Large classes (>300 lines)
- [ ] Long parameter lists (>4 params)
- [ ] Magic numbers
- [ ] Dead code
- [ ] Inconsistent naming
- [ ] Missing error handling
- [ ] No tests
- [ ] Commented-out code
- [ ] TODO/FIXME comments left indefinitely

---

## Refactoring Opportunities

### Area: [Component/Module Name]
**Current Issues**:
-
-

**Potential Improvements**:
-
-

**Effort Required**: [Small/Medium/Large]

**Value/Benefit**:
-

**Risk**: [Low/Medium/High]

---

## Template
```markdown
### [DEBT-XXX] [Brief Title]
**Priority**: 🔴 High / 🟡 Medium / 🟢 Low
**Added**: YYYY-MM-DD
**Category**: [Category]
**Effort to Fix**: Small/Medium/Large/X-Large

**Location**: path/to/file.ext:line

**Description**:
[What the technical debt is]

**Why It Exists**:
[Reason for debt]

**Impact**:
**Current Impact**:
- Performance: None/Low/Medium/High
- Maintainability: None/Low/Medium/High
- Security: None/Low/Medium/High
- User Experience: None/Low/Medium/High

**Future Risk**:
[What could happen]

**Proposed Solution**:
[How to fix]

**Estimated Effort**:

**Blockers**:
- None

**Related**:
-
```

---
*Last Updated: [Date] | Updated By: [Agent/Human name]*
*Total Debt Items: [Count] | High Priority: [Count]*

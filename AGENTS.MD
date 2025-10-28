# .brain - AI Agent State Management System

## Overview

The `.brain` folder is a persistent state management system designed to help AI coding agents maintain context, track progress, and work efficiently across multiple sessions. Instead of requiring full codebase context every time, agents can reference these structured markdown files to quickly understand:

- What the project is and how it should be developed
- What tasks are being worked on and their current status
- What bugs exist and which have been resolved
- What blockers are preventing progress

## Design Philosophy

1. **Context Efficiency**: Minimize token usage by providing structured, scannable information
2. **Persistence**: Maintain critical information across sessions
3. **Single Source of Truth**: Each file has a clear, specific purpose
4. **Agent-Friendly**: Templates and formats optimized for AI parsing and updating
5. **Human-Readable**: Also useful for human developers to track project state

## Folder Structure

```
.brain/
├── README.md                           # This file - system overview
├── project_info/                       # Project-level information
│   ├── summary.md                      # High-level project overview
│   ├── style.md                        # Coding standards and conventions
│   └── testing_strategy.md             # Testing approach and coverage
├── bug_tracker/                        # Bug and issue tracking
│   ├── current.md                      # Active bugs
│   └── completed.md                    # Resolved bugs archive
├── task_tracker/                       # Task and subtask management
│   ├── active_subtask.md               # Current work focus
│   ├── subtask_list.md                 # All subtasks for current task
│   └── blockers.md                     # Issues preventing progress
├── knowledge_base/                     # Quick reference and patterns
│   ├── patterns.md                     # Common code patterns and solutions
│   ├── commands.md                     # Useful commands and scripts
│   └── api_reference.md                # Internal API and interface reference
├── decisions/                          # Architecture Decision Records
│   ├── README.md                       # ADR index and guidelines
│   └── TEMPLATE.md                     # Template for new ADRs
├── context/                            # Session and critical context
│   ├── session_handoff.md              # Session-to-session continuity
│   └── critical_info.md                # Always-relevant project context
└── technical_debt/                     # Technical debt tracking
    ├── register.md                     # Active technical debt items
    └── future_improvements.md          # Enhancement ideas and wishlist
```

## File Purposes

### project_info/

#### summary.md
- **When to Read**: At session start, when context is needed
- **When to Update**: Project scope changes, new features added, tech stack changes
- **Key Info**: Project purpose, tech stack, structure, goals, constraints

#### style.md
- **When to Read**: Before writing new code, during code review
- **When to Update**: Team adopts new conventions, discovers better practices
- **Key Info**: Code style, naming conventions, file organization, git conventions

### bug_tracker/

#### current.md
- **When to Read**: At session start, before implementing features
- **When to Update**: New bug discovered, bug status changes, bug resolved
- **Key Info**: Active bugs by priority, reproduction steps, proposed solutions
- **Agent Actions**: Add bugs as found, update status, move to completed.md when fixed

#### completed.md
- **When to Read**: When encountering similar bugs, for pattern analysis
- **When to Update**: When bugs are verified as resolved
- **Key Info**: Resolution history, root causes, lessons learned
- **Agent Actions**: Move resolved bugs from current.md with full resolution details

### task_tracker/

#### active_subtask.md
- **When to Read**: At every session start
- **When to Update**: Constantly - this is the live work log
- **Key Info**: Current focus, progress, next steps, decisions made
- **Agent Actions**:
  - Update progress frequently
  - Log decisions and observations
  - Mark complete when done and load next subtask

#### subtask_list.md
- **When to Read**: When planning work, checking overall progress
- **When to Update**: New subtasks identified, subtasks completed, priorities change
- **Key Info**: All subtasks, dependencies, progress metrics
- **Agent Actions**:
  - Break down large tasks into subtasks
  - Keep synchronized with active_subtask.md
  - Track completion and velocity

#### blockers.md
- **When to Read**: When work is stuck, at session start
- **When to Update**: New blocker discovered, blocker status changes, blocker resolved
- **Key Info**: Active blockers, attempted solutions, impact assessment
- **Agent Actions**:
  - Log blockers immediately
  - Document attempted solutions
  - Move to resolved section when unblocked
  - Escalate critical blockers

#### testing_strategy.md
- **When to Read**: Before writing tests, when adding new features
- **When to Update**: Test strategy changes, coverage goals updated, new test types added
- **Key Info**: Testing philosophy, test types, coverage goals, test commands
- **Agent Actions**:
  - Reference when writing tests
  - Update coverage metrics after adding tests
  - Follow established testing patterns

### knowledge_base/

#### patterns.md
- **When to Read**: Before implementing similar features, during code review
- **When to Update**: New pattern established, better solution found, pattern deprecated
- **Key Info**: Common code patterns, solutions, anti-patterns to avoid
- **Agent Actions**:
  - Reference before implementing features
  - Add new patterns as discovered
  - Link to examples in codebase

#### commands.md
- **When to Read**: When running build, test, deploy, or other operations
- **When to Update**: New commands added, scripts created, build process changes
- **Key Info**: Build commands, test commands, deployment workflows
- **Agent Actions**:
  - Reference before running operations
  - Update with new useful commands
  - Document custom scripts

#### api_reference.md
- **When to Read**: When calling internal APIs or using shared interfaces
- **When to Update**: New APIs added, signatures changed, interfaces modified
- **Key Info**: Function signatures, API endpoints, data models, utility functions
- **Agent Actions**:
  - Reference when using internal APIs
  - Update when creating new public interfaces
  - Document examples

### decisions/

#### README.md & ADR files
- **When to Read**: Before making major architectural decisions
- **When to Update**: Major technical decisions made
- **Key Info**: Architecture decisions, rationale, alternatives considered, consequences
- **Agent Actions**:
  - Read before similar decisions
  - Create new ADR for significant choices
  - Link to ADRs in code comments
  - Update status as decisions are implemented

### context/

#### session_handoff.md
- **When to Read**: FIRST at every session start
- **When to Update**: At end of every session, when context shifts
- **Key Info**: Current focus, last action, next action, critical context, open questions
- **Agent Actions**:
  - Read first thing at session start
  - Update frequently during work
  - Fill "Next Session Goals" before ending
  - Document discoveries and decisions

#### critical_info.md
- **When to Read**: At session start, when encountering unfamiliar areas
- **When to Update**: Critical information changes, new constraints discovered
- **Key Info**: Constraints, security requirements, conventions, dependencies, scale targets
- **Agent Actions**:
  - Scan at session start
  - Reference when making decisions
  - Update when discovering new critical info

### technical_debt/

#### register.md
- **When to Read**: Before making changes to identified areas
- **When to Update**: New tech debt identified, debt paid down, priority changes
- **Key Info**: Active technical debt, impact, proposed solutions, debt metrics
- **Agent Actions**:
  - Check before modifying debt-affected areas
  - Add new debt when shortcuts taken
  - Document why debt exists
  - Move to resolved when fixed

#### future_improvements.md
- **When to Read**: When planning future work, looking for ideas
- **When to Update**: New ideas emerge, improvements implemented
- **Key Info**: Enhancement ideas, long-term vision, quick wins, experimental ideas
- **Agent Actions**:
  - Reference for future work
  - Add ideas discovered during development
  - Evaluate using defined criteria
  - Move to implemented when done

## Agent Workflow

### 🚀 Session Start
1. Read `context/session_handoff.md` - **CRITICAL FIRST STEP** - Where did we leave off?
2. Read `task_tracker/active_subtask.md` - What am I working on?
3. Read `task_tracker/blockers.md` - Any blockers in my way?
4. Scan `bug_tracker/current.md` - Any bugs related to current work?
5. Scan `context/critical_info.md` - Any constraints or critical context?
6. Reference `project_info/summary.md` - Refresh on project context if needed

### 💻 During Work
1. Update `active_subtask.md` frequently with progress
2. Update `session_handoff.md` with discoveries and decisions
3. Reference `style.md` when writing code
4. Reference `knowledge_base/patterns.md` for established patterns
5. Reference `knowledge_base/api_reference.md` when using internal APIs
6. Reference `knowledge_base/commands.md` for build/test commands
7. Log bugs to `current.md` as discovered
8. Log blockers to `blockers.md` when stuck
9. Log technical debt to `technical_debt/register.md` when shortcuts taken
10. Document decisions in `active_subtask.md` and `session_handoff.md`
11. Check `technical_debt/register.md` before modifying areas with known debt

### ✅ Completing Work
1. Mark subtask complete in `active_subtask.md`
2. Update `subtask_list.md` progress
3. Move resolved bugs from `current.md` to `completed.md`
4. Move resolved blockers to resolved section
5. Load next subtask from `subtask_list.md` into `active_subtask.md`

### 🔄 Session End
1. Update `session_handoff.md` with comprehensive handoff info
2. Update "Context for Next Session" in `active_subtask.md`
3. Document any open questions or uncertainties
4. Ensure all progress is documented
5. Update timestamps and "Last Updated" fields
6. Set status indicators for next session

## Best Practices for Agents

### DO
✅ Update files frequently and atomically
✅ Keep language concise and scannable
✅ Use consistent formatting and status indicators
✅ Link related items (bugs, tasks, files)
✅ Document decisions and rationale
✅ Keep active files focused (archive old items)
✅ Update timestamps and authorship
✅ Use code references with line numbers (`file.ext:123`)

### DON'T
❌ Let files become stale or outdated
❌ Create duplicate information across files
❌ Write verbose explanations (be concise)
❌ Skip updating status indicators
❌ Leave completed items in active files
❌ Make assumptions without documenting them
❌ Ignore blockers or bugs

## Status Indicators Reference

### Task Status
- 🟢 On Track
- 🟡 Delayed / At Risk
- 🔴 Blocked / Critical
- 🟣 Investigating
- 🔵 Backlog
- ⏳ Pending
- 🔄 In Progress
- ✅ Completed
- ⏸️ Paused / Waiting

### Priority
- 🔺 High Priority
- 🔸 Medium Priority
- 🔹 Low Priority

## File Size Management

To keep context efficient:

- **current.md**: Max ~50 active bugs (archive older/low-priority)
- **completed.md**: Keep last 3-6 months, archive rest
- **subtask_list.md**: Focus on current task, archive previous tasks
- **active_subtask.md**: One subtask at a time, archive completed steps after 5-10 entries

## Integration with Development

### Git Workflow
- Commit messages can reference bug IDs from `current.md`
- PRs can reference subtask IDs from `subtask_list.md`
- Code comments can link to decisions in `active_subtask.md`

### IDE Integration
- Keep `.brain` files open in tabs during development
- Use IDE file watching to see changes
- Reference file paths with line numbers for easy navigation

### Automation Potential
- Scripts to generate progress reports from task_tracker
- Automated archiving of old entries
- Integration with issue trackers or project management tools
- CI/CD hooks to check for unresolved blockers

## Extending the System

### Adding New Files
If you need to track additional state:

1. Create new file in appropriate folder
2. Follow the template pattern:
   - Purpose statement at top
   - Clear update triggers
   - Agent instructions
   - Structured sections
   - Template at bottom
   - Metadata footer

3. Update this README with the new file's purpose

### Adding New Folders
For new categories of information:

1. Create folder with descriptive name
2. Add README.md inside explaining folder purpose
3. Create initial template files
4. Update main README

## Examples

### Example: Starting a New Feature

1. Create subtasks in `subtask_list.md`:
```markdown
#### [SUB-01] Design API endpoint ⏳
#### [SUB-02] Implement database schema ⏳
#### [SUB-03] Write API handlers ⏳
#### [SUB-04] Add tests ⏳
```

2. Copy first subtask to `active_subtask.md` and mark in progress
3. Work on subtask, updating progress
4. When bugs found, log to `current.md`
5. When blocked, log to `blockers.md`
6. When done, mark complete and load next

### Example: Debugging

1. Log bug to `current.md` with reproduction steps
2. If blocking work, create blocker in `blockers.md` referencing the bug
3. Document investigation in bug's "Potential Cause" section
4. Implement fix
5. Document solution and move to `completed.md`
6. Update or resolve blocker

## Troubleshooting

### Files getting too large?
- Archive old completed items
- Split by time period (monthly archives)
- Keep only relevant active information

### Information scattered?
- Use cross-references between files
- Link related bugs, tasks, and blockers
- Maintain single source of truth principle

### Agent not following templates?
- Include clear examples
- Add more specific agent instructions
- Simplify templates if too complex

## Enhancement Highlights

### 🧠 knowledge_base/ - Reduce Cognitive Load
**Problem Solved**: Agents repeatedly discovering the same patterns or looking up common commands.
**Benefit**: Instant access to established patterns, commands, and API references without code search.
**When to Use**: Before implementing features, when running operations, when using internal APIs.

### 📝 decisions/ - Preserve Architectural Context
**Problem Solved**: Lost context on why technical decisions were made.
**Benefit**: Clear decision history with rationale, alternatives, and tradeoffs documented.
**When to Use**: Before making major technical decisions, when questioning existing approaches.

### 🔄 context/ - Session Continuity
**Problem Solved**: Context loss between sessions, unclear what was being worked on.
**Benefit**: Seamless handoffs between sessions, critical info always available.
**When to Use**: **ALWAYS** - Read session_handoff.md FIRST at session start, update at session end.

### 🔧 technical_debt/ - Intentional Tradeoffs
**Problem Solved**: Unknown technical debt, shortcuts taken without documentation.
**Benefit**: Visible tech debt with impact assessment, improvement ideas captured.
**When to Use**: When taking shortcuts, planning refactoring, or prioritizing improvements.

### 🧪 testing_strategy.md - Test Consistency
**Problem Solved**: Inconsistent testing approaches, unclear coverage goals.
**Benefit**: Unified testing strategy, clear patterns to follow, coverage visibility.
**When to Use**: Before writing tests, when adding new features requiring tests.

## Version History

- **v1.0** - Initial template system with project_info, bug_tracker, task_tracker
- **v2.0** - Enhanced with knowledge_base, decisions, context, technical_debt, testing_strategy

---

## Quick Reference Card

**Starting Session?** → Read `session_handoff.md` + `active_subtask.md` + `blockers.md`
**Writing Code?** → Reference `style.md` + `patterns.md`
**Using Internal APIs?** → Reference `api_reference.md`
**Running Commands?** → Reference `commands.md`
**Making Architectural Decision?** → Create ADR in `decisions/`
**Found a Bug?** → Log to `current.md`
**Stuck?** → Log to `blockers.md`
**Taking Shortcut?** → Log to `technical_debt/register.md`
**Making Progress?** → Update `active_subtask.md` + `session_handoff.md`
**Finishing Subtask?** → Update `subtask_list.md`, load next to `active_subtask.md`
**Ending Session?** → Update `session_handoff.md` with handoff info

---

*Last Updated: [Date] | Maintained by: AI Agents & Humans*
*System Version: 2.0*

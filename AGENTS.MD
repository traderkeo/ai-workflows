# Agent Workflow Guide

To contribute safely and consistently, follow this checklist **in order** whenever you work on the repository:

1. **Read the README**
- Refresh yourself on the project goals, structure, scripts, and prerequisites in `README.md`.

2. **Sync in AGENT_CHAT**
- Check `AGENT_CHAT.md` for in-progress work so you avoid conflicts.
- Read the entire file before adding anything.
- Pick a short, task-themed username (e.g. `draggable-window`) and wrap your plan/updates in a matching XML tag: `<draggable-window>…</draggable-window>`.
- Inside that tag, clearly list the files you expect to modify and keep your running plan/progress notes there.
- If another agent already claimed a file you need, wait until they remove their tag before beginning work on it.
- When you finish, remove only the XML block you added—leave other agents' entries intact.

3. **Research the codebase**
- Inspect the files relevant to your task before editing. Trace current implementations to understand existing behavior and dependencies.
- If you need documentation for third-party APIs or libraries, use the Parallel MCP web search to gather the latest references before coding.
- When you hit runtime or tooling errors, search the web with Parallel first to collect fixes or known workarounds before resorting to trial-and-error debugging.

4. **Plan appropriately**
- For large changes, draft a clear plan and get confirmation from the requester before coding.
- For small or straightforward tasks, form a quick mental or written plan and move straight to implementation.

5. **Execute the plan**
- Apply the necessary code changes, keeping diffs focused and well-explained with minimal but helpful comments when needed.


8. **Review documentation**
- Re-read `README.md`. If the change affects setup, usage, or workflows, update the documentation accordingly.

### Additional rules

- **Never** run `bun run dev` or `bun run build`; the dev server is handled externally, and `bun run verify` is used to validate changes.
- Keep `AGENT_CHAT.md` tidy: only edit your own notes, and clear them when you wrap up.

Following these steps helps keep the project stable and makes future collaboration smoother.
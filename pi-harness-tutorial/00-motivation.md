# Module 0 — Motivation: "Building pi in a World of Slop"

## Source

- **Title:** Building pi in a World of Slop
- **Speaker:** Mario Zechner (`@badlogicgames`; creator of libGDX; creator of pi; Earendil Inc.)
- **Venue:** AI Engineer Europe 2026 keynote, London — April 10, 2026, 9:50–10:10am
- **Published:** YouTube, April 16, 2026, ~20 minutes
- **Abstract (channel):** Zechner "talks about why today's agents are still
  Merchants of Learned Complexity, and gives 3 specific ways that humans
  still add taste, value and judgment."

**Read this before Step 1:**
- Zechner, ["What I learned building an opinionated and minimal coding agent"](https://mariozechner.at) (2025-11-30) — the canonical companion essay.
- Zechner, ["What if you don't need MCP at all?"](https://mariozechner.at) (2025-11-02) — source of the MCP token-overhead measurements used in Step 5.

> **Caveat up front:** this is a keynote, not a tutorial — no code is built
> on screen. The chapter breakdown below is reconstructed from the AI
> Engineer summary and public recaps, cross-checked against Zechner's own
> essays. Treat timestamps as approximate.

## Chapter-by-chapter breakdown

### 1. Cold open — "world of slop"
Framing: modern AI-assisted development is in a "fuck around and find out"
phase — "token madness," tools shipping faster than anyone can evaluate them.

### 2. Act 1 — The rise and fall of the "magic" coding tool
Zechner started using Claude Code in April 2025 and loved it — until it
"grew faster than it improved." His specific grievances, each of which
becomes a design constraint for pi:

- **Context managed behind your back.** You can't see what's actually in
  the context window or why.
- **System prompt and tool definitions change every release**, silently
  breaking workflows built on the previous behavior.
- **"System reminders" injected mid-task** — text like *"this may or may
  not be relevant"* appended to your own messages without your control.
- **Zero observability.** No way to inspect, export, or replay a session.
- **Shallow, process-level extensibility** — hooks that shell out, rather
  than a real extension API with access to the agent's internals.
- **Flicker** — naive full-repaint terminal rendering.

He also read OpenCode's internals and found comparable issues: context
pruning you don't control, LSP errors injected into the context after every
edit, and a local server exposed to any browser tab on the machine.

**Design consequence → pi:** every one of these becomes a stated
requirement: a stable, tiny, user-visible system prompt; sessions you can
inspect and fork; a real TypeScript extension API; differential rendering.
See `01-architecture-reference.md`.

### 3. The thesis — less is more
Four packages (`pi-ai`, `pi-agent-core`, `pi-tui`, `pi-coding-agent`); four
tools (`read`/`write`/`edit`/`bash`); a system+tools prompt under 1000
tokens; permission-free ("YOLO") by default; explicitly **no** MCP,
sub-agents, plan mode, todos, or background bash in the core.

Evidence cited: a Terminal-Bench 2.0 run with Claude Opus 4.5, and the
strong showing of **Terminus 2** — the benchmark's reference agent, which
has *no file-specific tools at all*, just raw `tmux` access — as proof that
tool proliferation is not what makes agents capable. See
`02-external-sources.md` for the CodeAct/SWE-agent literature this echoes.

### 4. Introducing pi — the agent that evolves
The extension system is TypeScript, not YAML/JSON config: an extension is a
function with access to `pi.registerTool()`, lifecycle hooks, and the TUI.
Zechner's framing: ask pi to **write its own extensions**, hot-reload them,
and treat the harness itself as something the agent helps you maintain.
Sessions are tree-structured (branch, fork, rewind), not a single linear
transcript. Providers can be swapped mid-session.

### 5. Act 2 — OSS in the age of "clankers"
Autonomous agents are flooding GitHub with low-effort PRs and issues
("clankers," "slop"). Zechner's countermeasures on his own repos: auto-close
obviously agent-generated PRs, a "human voice" heuristic filter, and
requiring contributors to write issues in their own words.

### 6. Act 3 — "Slow the f*** down"
The core argument, worth stating precisely because Module 4 builds an
exercise around it:

> Agents don't feel friction. A human reviewing code has a roughly fixed
> throughput; an agent generating code does not. If error rate per unit of
> output is constant, then **total errors scale with how much you let the
> agent parallelize**, while your capacity to *catch* those errors does
> not. The gap compounds.

Zechner calls the resulting defects "booo" errors — small, individually
plausible mistakes that pass a shallow review and accumulate into
architectural damage no review agent catches, because review agents have
the same blind spots as generation agents.

Practical rules he draws from this:
- "A sufficiently detailed spec is a program" — most of the value is in the
  spec, and a vague spec cannot be rescued by a smarter agent.
- Use agents for what they're good at: repro cases, boilerplate, research —
  **not** core business logic, security-sensitive code, or architecture.
- Scope tightly, modularize, and **read the critical lines yourself.**

### 7. Close
*"Friction is the thing that builds understanding of the system in your
head."* Keep your hands in the code, even when — especially when — you
don't have to.

## Why this matters for the build track

Every "no" in pi's design (no MCP by default, no sub-agents, no plan mode,
no background bash) is a direct, traceable consequence of Act 1's
grievances plus Act 3's discipline argument: each of those features either
(a) hides information from you the way Claude Code's context management did,
or (b) increases the rate at which an agent can generate output beyond what
you can review. Keep that dual test — *does this hide information from me?
does this let the agent outrun my review capacity?* — in mind through every
step of `03-build-track/`; it's the actual design rubric, not "MCP is bad."

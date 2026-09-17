# Module 1 — Architecture Reference: What "pi harness" Actually Is

This is a map of the real system (`github.com/earendil-works/pi`, npm scope
`@earendil-works/*`, site `pi.dev`), current as of September 2026 at roughly
version 0.84.x. Pin any tutorial run to a specific tag — the repo publishes
every few days. See `05-outdated-vs-current.md` for what's changed since
the talk.

Install: `curl -fsSL https://pi.dev/install.sh | sh`, or
`npm install -g --ignore-scripts @earendil-works/pi-coding-agent`
(Node ≥ 22.19). Core is MIT-licensed (RFC 0015, 2026-03-30): MIT core,
optional Fair Source/proprietary layers on top.

## The four packages

| Package | Directory | Role |
|---|---|---|
| **pi-ai** | `ai` | Unified LLM API over four wire protocols (OpenAI Completions, OpenAI Responses, Anthropic Messages, Google Generative AI); 25+ providers; streaming; TypeBox tool schemas validated by AJV |
| **pi-agent-core** | `agent` | The agent loop and `Agent`/`AgentHarness`; sessions, compaction, tool lifecycle hooks |
| **pi-tui** | `tui` | Retained-mode terminal UI with differential rendering |
| **pi-coding-agent** | `coding-agent` | The `pi` CLI/SDK: the four built-in tools, the system prompt, slash commands, run modes |

Newer additions not in the talk-era repo: `protocol`, `client`, `server`
(RPC/multi-agent orchestration), `session-backends/sqlite-node`, `evals`,
`telemetry`, `chord`.

### pi-ai — the provider layer
- Normalizes OpenAI Completions, OpenAI Responses, Anthropic Messages, and
  Google Generative AI into one streaming interface.
- Tool-calling parameters are TypeBox schemas, validated with AJV before
  they ever reach the model or the tool implementation.
- **Cross-provider context handoff**: Anthropic's `thinking` blocks are
  converted to `<thinking>` tags for providers that don't have a native
  reasoning channel; provider-signed blobs (e.g. Anthropic's signature on a
  thinking block) are replayed verbatim rather than re-derived.
- Abort propagates through the whole pipeline — cancelling a request yields
  whatever partial result had streamed so far, not nothing.
- **Split tool results**: a tool's output has separate content for the LLM
  (what goes back into context) and for the UI (what a human sees) — these
  are allowed to differ.
- A generated model registry (`models.generated.ts`) built from OpenRouter
  + models.dev metadata, so cost/context-window numbers aren't hand-maintained.

→ Build this in **Step 1**.

### pi-agent-core — the loop
- The loop operates on an internal `AgentMessage` representation throughout
  and converts to the LLM-native wire format only at the provider boundary
  (`convertToLlm`). This is what makes multi-provider mid-session switching
  possible: the session's true representation is provider-agnostic.
- Pipeline per turn: `transformContext` (pruning/compaction hooks run here)
  → `convertToLlm` (also strips UI-only messages) → send to provider.
- Tool call lifecycle: `tool_execution_start` → `beforeToolCall` hook →
  execute → `afterToolCall` hook → `tool_execution_end`. Tools can run in
  parallel or sequentially.
- **There is no max-steps knob.** The loop runs until the model stops
  emitting tool calls. This is deliberate — an artificial step limit is
  another form of the context/behavior hiding Zechner objects to in
  Act 1.
- A `PendingMessageQueue` distinguishes *steering* (interrupt the current
  turn, e.g. pressing Enter with new input) from *follow-up* (queue a
  message for after the current turn, e.g. Alt+Enter).
- The event stream (`agent_start`, `turn_start`, `tool_execution_start`,
  ...) is what a reactive UI (or your own logger) subscribes to.
- `AgentHarness` layers durable sessions, skill/prompt-template resolution,
  turn snapshots, compaction, and branch summarization on top of the bare
  `Agent`.

→ Build this in **Step 2** (loop) and **Step 4** (sessions/compaction).

### pi-tui — the terminal UI
- Retained-mode: a `Component` implements `render(width) → string[]`.
- **Differential rendering**: redraws start from the first line that
  actually changed, wrapped in the terminal's synchronized-output escape
  sequences (`CSI ?2026h` / `CSI ?2026l`) so a redraw is atomic from the
  terminal's perspective — this is what eliminates the flicker Zechner
  called out in Claude Code.
- Deliberately keeps native scrollback and terminal search working, which a
  full-screen "alternate buffer" TUI (like many `ncurses`-style tools)
  gives up.

→ Out of scope for the build track's core exercises (a CLI harness doesn't
need a fancy TUI to be correct), but read the source once you've finished
Step 2 if you want to add one.

### pi-coding-agent — the CLI/SDK
- **The system prompt (verbatim core):**
  > "You are an expert coding assistant. You help users with coding tasks
  > by reading files, executing commands, editing code, and writing new
  > files."

  ...followed by the four-tool list and ~7 guidelines. `AGENTS.md` (project
  context) is appended at the bottom; the whole prompt is overridable via
  `SYSTEM.md`. Total system+tools prompt is **under 1000 tokens**.
- **The four tools:**
  - `read(path, offset, limit)` — defaults to the first 2000 lines; images
    come back as attachments, not text.
  - `write(path, content)`
  - `edit(path, oldText, newText)` — **exact string match**, not a diff/patch
    format or fuzzy matching.
  - `bash(command, timeout)` — synchronous; no background-process primitive
    in the core.
  - Optional, off by default: `grep`, `find`, `ls` (the philosophy is that
    `bash` already gives you these).
- **`createAgentSession()`** is the SDK entry point — this is what
  third-party projects (e.g. OpenClaw) embed to get a pi-powered agent
  inside their own product.
- Four run modes: interactive TUI, print/JSON (`pi --print`, scriptable),
  RPC, and SDK.

→ Build this in **Step 3**.

## The "no" list — and the rationale for each

| Feature pi omits from the core | Stated rationale | Where to get it instead |
|---|---|---|
| **Permission gates** | "Mostly security theater" once an agent can read data + run code + reach the network — see Simon Willison's *lethal trifecta* / *dual-LLM* writing. Real mitigation is containment, not an in-loop prompt. | Sandbox the whole process: Gondolin micro-VM, plain Docker, or an OpenShell-style pattern. |
| **Todos** | An in-context todo list is state hidden inside the model's own output, not under your control. | A `TODO.md` file — visible, diffable, editable by you *and* the agent. |
| **Plan mode** | Same objection as todos: a hidden mode with its own state. | A `PLAN.md` file you co-edit with the agent, with full observability. |
| **MCP** | Every MCP server's full tool schema list is dumped into context on every session start — see Step 5 for Zechner's measured numbers. | CLI-tool-with-README (progressive disclosure via `bash`), **mcporter** (wraps an MCP server as a CLI/TS binding), or a native `pi.registerTool()` extension. |
| **Background bash** | An unobservable, undebuggable side channel. | `tmux` — you can attach, detach, and inspect it exactly like the agent can. |
| **Sub-agents** | A sub-agent call is a black box: you see the summary, not the transcript. | Spawn `pi --print` via `bash` for fully observable output, or run a separate session that produces a reviewable artifact. |

## The extension API — the actual extensibility mechanism

An extension is a default-exported TypeScript function receiving
`pi: ExtensionAPI`:

```ts
export default function myExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    promptSnippet: "web_search(query) — search the web",
    parameters: WebSearchParamsSchema, // TypeBox
    promptGuidelines: ["Prefer this over guessing URLs."],
    async execute(params, { onUpdate }) {
      onUpdate({ status: "searching..." });
      const results = await search(params.query);
      return {
        content: summarizeForModel(results), // what the LLM sees
        details: results,                    // what the UI/human sees
      };
    },
  });

  pi.on("tool_call", (event) => {
    // intercept/block a tool call before it executes
  });

  pi.on("context", (messages) => {
    // rewrite messages before the model sees them
    return messages;
  });

  pi.on("session_before_compact", async (entries) => {
    // fully override the default compaction summarizer
  });
}
```

Other registration points: `pi.registerCommand()` (slash commands),
`pi.registerShortcut()`, `pi.registerFlag()`, `pi.registerMessageRenderer()`,
`pi.registerProvider()`, `pi.setActiveTools()`, `pi.sendUserMessage()`.

Lifecycle/interception events beyond the three above:
`tool_result` (modify a result after execution), `input` (intercept raw
user text), `before_provider_request` (touch the outgoing HTTP call),
`agent_start` / `session_start` / `turn_start` / `turn_end`.

Extensions can also persist their own custom message types into the
session JSONL — the session format isn't closed to the core message types.

→ Build a minimal version of this registration API in **Step 5**.

## Sessions and compaction

- Stored as append-only JSONL at
  `~/.pi/agent/sessions/--<working-directory-path>--/<timestamp>_<session-id>.jsonl`
  (note: **per-working-directory**, not a flat `sessions/<id>/` layout).
- Entries form a tree via `id`/`parentId` — a session is not a single
  linear array, it's a DAG you can branch and rewind within.
- Format is versioned (`v3` as of this writing) with auto-migration on load.
- Commands: `/resume`, `/tree` (in-place branch/rewind), `/fork` and
  `/clone` (branch into a *new* file), `/compact`, `/export`, `/share`.
  Flags: `-c`, `-r`, `--session`, `--fork`, `--no-session`, `--name`.
- **Compaction** — manual (`/compact [instructions]`) or automatic
  (`/autocompact`, on by default), triggered on context overflow or when
  approaching the limit, and checked **after a turn ends** specifically to
  avoid busting the provider's prompt cache mid-turn.

  The `compact()` pipeline:
  1. Walk backward from the most recent entry, accumulating tokens, until
     `keepRecentTokens` (~20k) worth of history is set aside untouched.
  2. Take everything from the last compaction point up to that cut line.
  3. Summarize it with a dedicated `SUMMARIZATION_SYSTEM_PROMPT` (tool
     results get truncated to ~2000 chars before summarization).
  4. Append a `CompactionEntry` recording `firstKeptEntryId`.
  5. On reload, the effective context is
     `[system][summary-as-a-user-message + <read-files>/<modified-files> tracking][recent, uncompacted turns]`.
  - `reserveTokens` defaults to ~16384 (headroom kept free for the next
    response).
  - File-touch tracking (`<read-files>`/`<modified-files>`) is cumulative
    **across** compactions, so the agent doesn't lose track of what it's
    already seen even after several rounds of summarization.
  - Compaction is lossy for the *active* context, but the full JSONL
    history is never deleted — `/tree` can always take you back to the
    pre-compaction entries.
  - Extensions can override the entire pipeline via `session_before_compact`.

→ Build a simplified version in **Step 4**.

## Reading order

1. This file, once, end to end.
2. `packages/agent/src/agent-loop.ts` and `agent.ts` in the real repo
   before Step 2.
3. `packages/coding-agent`'s tool definitions before Step 3.
4. `packages/coding-agent/src/core/compaction/*` before Step 4.
5. `packages/coding-agent/docs/extensions.md` before Step 5.

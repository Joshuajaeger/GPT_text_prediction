# Module 2 — External Sources, Mapped to Concepts

Every design decision in pi has a lineage in the agents literature or in
Anthropic's own engineering writing. This module is the reading list; each
entry says which build-track step to read it beside.

## Agent-loop & reasoning/acting foundations

- **ReAct: Synergizing Reasoning and Acting in Language Models** — Yao et
  al., ICLR 2023, arXiv:2210.03629. The interleaved thought/action/observation
  loop pi's `agentLoop()` descends from. *Read beside Step 2.*
- **Reflexion: Language Agents with Verbal Reinforcement Learning** — Shinn
  et al., arXiv:2303.11366. Self-reflection / verbal RL as an alternative to
  weight updates. *Read beside Step 6 and the `/review` sub-session pattern.*
- **Toolformer: Language Models Can Teach Themselves to Use Tools** —
  Schick et al., arXiv:2302.04761. Foundational tool-use paper. *Read
  beside Step 2/3.*
- **Executable Code Actions Elicit Better LLM Agents (CodeAct)** — Wang et
  al., ICML 2024, arXiv:2402.01030. Argues code (especially bash/Python) is
  a better unified action space than bespoke JSON tool schemas — up to 20%
  higher success on M3ToolEval. This is the theoretical backbone of pi's
  "bash is (almost) all you need." *Read beside Step 3.*

## Agent-computer interface & harness design

- **SWE-agent: Agent-Computer Interfaces Enable Automated Software
  Engineering** — Yang et al., NeurIPS 2024, arXiv:2405.15793. The ACI
  concept: tools are an interface *designed for the agent*, not a thin
  wrapper over a human CLI. pi's `read/write/edit/bash` is a minimal ACI.
  *Read beside Step 3.*
- **mini-SWE-agent** (SWE-agent team, Princeton/Stanford). From its own
  README: *"Minimal: just some 100 lines of python for the agent class...
  Performant: scores >74% on SWE-bench Verified; starts much faster than
  Claude Code."* Bash-only, no bespoke tools at all — the closest existing
  analog to pi's minimalism thesis, and worth reading end to end as a
  reference implementation. *Read beside Steps 1–3.*
- **Anthropic — Building Effective AI Agents.** Workflows vs. agents;
  "find the simplest solution that works"; an agent is "an LLM using tools
  based on environmental feedback, in a loop." *Read beside Steps 1–2.*
- **Anthropic — Effective context engineering for AI agents** (2025-09-29).
  Context as a finite, degrading resource — the exact framing pi
  operationalizes with its ~1000-token prompt and file-based state. *Read
  beside Step 4.*
- **Anthropic — Effective harnesses for long-running agents**
  (2025-11-26). `claude-progress.txt`-style patterns, initializer prompts,
  cross-context-window continuity. Compare/contrast with pi's
  `PLAN.md`/`TODO.md` + compaction approach — same problem, different
  mechanism. *Read beside Step 4.*
- **Anthropic — Writing effective tools for AI agents** (2025-09-11). Tool
  description quality, strict schemas, unambiguous parameter naming (e.g.
  `user_id` not `user`). Directly informs how you write `promptSnippet` and
  `promptGuidelines` in Step 5.

## Protocols & tool integration

- **Model Context Protocol** spec + docs (`modelcontextprotocol.io`). Read
  this precisely so you understand the tradeoff pi is declining, not just
  Zechner's summary of it. *Read beside Step 5.*
- **mcporter** (`github.com/openclaw/mcporter`; v0.13.x, Node ≥ 24). Wraps
  an MCP server as a generated CLI/TS binding — the sanctioned
  "MCP if you must" route in the pi ecosystem. *Read beside Step 5.*
- **Exa MCP** — `exa.ai/docs/reference/exa-mcp`,
  `github.com/exa-labs/exa-mcp-server`, endpoint `https://mcp.exa.ai/mcp`.
  Default tools: `web_search_exa`, `web_fetch_exa`. Optional (pass
  explicitly, which replaces the default set):
  `web_search_advanced_exa`, `agent_run` (the latter requires OAuth or an
  API key). *Read beside Step 5's Exa exercise.*

## Evaluation

- **SWE-bench** — Jimenez et al., ICLR 2024, arXiv:2310.06770. 2,294 real
  GitHub issues across 12 Python repos. At publication: *"the
  best-performing model, Claude 2, is able to solve a mere 1.96% of the
  issues"* (4.8% with an oracle retriever) — a figure now vastly exceeded,
  useful as a "how far we've come" anchor rather than a current baseline.
  *Read beside Step 6.*
- **Terminal-Bench** (Stanford + Laude Institute). Per the Terminal-Bench
  2.0 paper (arXiv:2601.11868, Merrill et al., 2026): *"a carefully curated
  hard benchmark composed of 89 tasks in computer terminal
  environments... frontier models and agents score less than 65%."*
  Distributed via the **Harbor** harness with **Terminus 2** — raw `tmux`
  access, no file-specific tools — as the model-agnostic reference agent.
  TB 2.1 keeps the same 89 tasks with environment fixes. This is the
  benchmark Zechner cites in the talk. *Read beside Step 6.*

## Primary pi writing

- Zechner, ["What I learned building an opinionated and minimal coding
  agent"](https://mariozechner.at) (2025-11-30) — the canonical companion
  essay to the talk.
- Zechner, ["What if you don't need MCP at all?"](https://mariozechner.at)
  (2025-11-02) — source of the specific token-overhead numbers used in
  Step 5 (*"Playwright MCP has 21 tools using 13.7k tokens (6.8% of
  Claude's context). Chrome DevTools MCP has 26 tools using 18.0k tokens
  (9.0%)."*).
- Armin Ronacher, "Pi: The Minimal Agent Within OpenClaw"
  (lucumr.pocoo.org, 2026-01-31) — extension patterns (`/answer`,
  `/todos`, `/review`, `/control`, `/files`), sessions-as-trees, "software
  building software."
- `pi.dev/docs/latest/{sessions,compaction,extensions}`, the
  `earendil-works/pi` README, `packages/coding-agent/docs/*.md`.

## Comparable open harnesses worth reading for contrast

Claude Code, OpenCode, Aider, Amp, Codex, mini-SWE-agent, and **oh-my-pi**
(a pi fork that bakes LSP/DAP/sub-agents back in — a useful "what happens
if you undo the minimalism" case study once you've finished the build
track).

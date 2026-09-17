# Building Your Own Pi Harness — Interactive Tutorial

An academic-level, hands-on tutorial for building a minimal coding-agent
harness in the spirit of Mario Zechner's **pi** (`github.com/earendil-works/pi`,
site `pi.dev`), the subject of his AI Engineer Europe 2026 keynote
*"Building pi in a World of Slop."*

This tutorial is deliberately **not** a transcript of the talk. The talk is a
20-minute keynote about *why* pi exists and *how* to use agents responsibly —
it does not build anything on screen. Everything you implement here is
derived from pi's public source, its docs, and Mario Zechner's companion
essays, cross-referenced against the academic and industry literature that
underpins each design decision.

## How this tutorial is organized

| Module | What it covers | Read this if... |
|---|---|---|
| [`00-motivation.md`](./00-motivation.md) | The talk itself: chapter-by-chapter breakdown, why Zechner left Claude Code, the minimalism thesis | You want the "why" before the "how" |
| [`01-architecture-reference.md`](./01-architecture-reference.md) | pi's actual architecture: packages, tools, system prompt, extension API, sessions | You want a map of the real system before building a toy version |
| [`02-external-sources.md`](./02-external-sources.md) | Every design decision mapped to a paper or essay (ReAct, CodeAct, SWE-agent/ACI, Reflexion, Toolformer, SWE-bench, Terminal-Bench, Anthropic's agent essays, the MCP spec) | You want the academic grounding, not just "because Mario said so" |
| [`03-build-track/`](./03-build-track/README.md) | Six-stage hands-on build: provider abstraction → agent loop → core tools → sessions/compaction → extensions+MCP → evaluation | You want to write code |
| [`04-responsible-use-capstone.md`](./04-responsible-use-capstone.md) | The "slow down" argument, compounding-error math, a hands-on friction exercise | You've built the harness and want to close the loop on *how* to use it |
| [`05-outdated-vs-current.md`](./05-outdated-vs-current.md) | Where the talk (and older docs) diverge from the September 2026 `earendil-works/pi` repo | You're cross-checking a specific claim or command |
| [`06-recommendations-and-caveats.md`](./06-recommendations-and-caveats.md) | Sequencing advice, thresholds for "done," and honest caveats about source reliability | You're adapting this into a course or workshop |

## Prerequisites

- Comfortable reading/writing TypeScript (the build track mirrors pi's own
  implementation language) or Python (a parity track is noted per step for
  `mini-SWE-agent` fans).
- Node.js ≥ 22 (for `node --experimental-strip-types`, used so the exercises
  run with **zero external dependencies** — no `npm install` required to get
  started). A real project would use `tsx` or `ts-node`; the exercises avoid
  that dependency so they run anywhere.
- An API key for at least one LLM provider (OpenAI- or Anthropic-compatible)
  if you want to run Steps 1–2 against a live model. Every exercise also
  ships a mock-provider mode so you can do the structural work offline.
- Fifteen minutes with pi itself is worth more than any of this prose:
  `curl -fsSL https://pi.dev/install.sh | sh` and poke around before you
  start Step 1.

## The core thesis, in one paragraph

Frontier models are RL-trained to be coding agents. A harness's job is to
get out of the way: a system+tool prompt under 1000 tokens, four tools
(`read`, `write`, `edit`, `bash`), no permission theater, no hidden context
management, and every extra capability (sub-agents, plan mode, MCP,
background processes) pushed into an opt-in extension rather than baked into
the core. This tutorial builds that thesis up from first principles, one
subsystem at a time, so that by Step 6 "minimal" is something you've
verified empirically rather than taken on faith.

## Suggested pace

Each build-track step is scoped to 1–3 hours for an experienced engineer.
Treat the six steps as a single afternoon-to-two-day project, not a
semester course — that itself is a demonstration of the tutorial's thesis:
a good harness is small enough to build from scratch in a weekend.

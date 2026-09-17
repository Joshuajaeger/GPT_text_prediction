# Module 5 — Where the Talk (and Older Docs) Diverge From the Current Repo

The talk and Zechner's November 2025 essay describe an earlier snapshot of
pi than the `earendil-works/pi` repo as it stands in September 2026
(~v0.84.x). If you're cross-checking a specific claim, command, or package
name against the live repo, check this list first.

| Area | Talk-era / older docs | September 2026 (`earendil-works/pi`, ~v0.84.x) |
|---|---|---|
| **Repository** | `badlogic/pi-mono` | `earendil-works/pi` |
| **npm scope** | `@mariozechner/*` | `@earendil-works/*` (old scope deprecated with a redirect message: *"please use @earendil-works/pi-coding-agent instead going forward"*) |
| **Version** | ≈ 0.4x–0.5x | ≈ 0.84.x, publishing every few days |
| **Compaction** | Per the 2025-11-30 essay: not yet implemented, along with tool-result streaming | Shipped: manual + automatic compaction, `/autocompact`, branch summarization |
| **Package set** | `pi-web-ui`, `pi-mom` (Slack integration), `pi-pods` (vLLM) present in-monorepo | Those three are gone from the monorepo (Slack moved to a separate `pi-chat` repo); new `protocol`, `client`, `server` (RPC/multi-agent orchestration), `session-backends/sqlite-node`, `evals`, `telemetry`, `chord` packages added |
| **Licensing** | Informal | Formalized under RFC 0015 (2026-03-30): MIT core, optional Fair Source/proprietary layers on top, via Earendil |
| **Ecosystem** | pi itself, early | OpenClaw (built on `createAgentSession()`), the `oh-my-pi` fork (LSP/DAP/sub-agents baked back in), several third-party MCP-bridge extensions, `mcporter` at v0.13.x |

## Practical implications for this tutorial

- **Pin a commit or tag** before running any exercise against the real
  repo, and re-verify package names/paths against `pi.dev/docs/latest`
  before treating this tutorial's Module 1 architecture reference as
  ground truth — it moves fast.
- Any older third-party explainer describing a "seven-package" pi layout
  is describing the pre-`server`/`client`/`protocol` era; don't assume it's
  wrong, assume it's a snapshot.
- The compaction mechanics in `01-architecture-reference.md` and the Step 4
  build-track exercise describe the **current, shipped** design — this is
  one of the areas where building from source beats building from the talk,
  since the talk predates the feature entirely.

## Video-specific caveats

- The talk is a keynote, not a tutorial: no code is built on screen. The
  chapter breakdown in `00-motivation.md` is reconstructed from the AI
  Engineer summary and public recaps (mlnotes, startuphub, tldrecap,
  daily.dev), cross-checked against Zechner's own essays — not from a
  verified transcript. On-screen timestamps were not recoverable; treat the
  section order as approximate and verify against the video directly before
  locking specific timestamps into any derived material (e.g. a slide deck
  or a clipped-video companion track).
- Benchmark figures cited in the talk (the Terminal-Bench placement, any
  case-study numbers circulating in secondary sources) are point-in-time
  and should be presented as claims attributed to their source, not as
  verified constants — see `06-recommendations-and-caveats.md`.

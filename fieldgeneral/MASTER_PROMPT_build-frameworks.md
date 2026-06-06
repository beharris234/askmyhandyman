# Master Prompt addition — Build Method Frameworks

> Paste this into your Master Prompt under **Section 16 (Tools & Accounts)** as a new
> subsection, and back it up to github.com/beharris234/ai-brain per Section 34.
> Captured 2026-06-06 while building FieldGeneral.

---

### 16b. BUILD-METHOD FRAMEWORKS (how Claude builds — not app code)

These are **Claude Code workflow frameworks**, not libraries that ship inside an app.
They change *how* code gets built (planning, testing, multi-agent), and install on a
local Claude Code setup via the plugin marketplace — they do **not** auto-apply in a
hosted Claude Code web session. Adopt only when the payoff is clear (KISS + free-first).

| Framework | What it is | Verdict / When to use |
|---|---|---|
| **obra/superpowers** | Claude Code plugin: forces brainstorm → spec → TDD → review instead of rushing to code. Composable "skills." | **Anchor. Adopt when hardening security-sensitive phases** (e.g. minors' data, auth). Test-first discipline pays off there. |
| **dsifry/metaswarm** | Heavy multi-agent orchestration (18 agents, enforced TDD, autonomous PR lifecycle, cross-model). | **Adopt for the app factory** — when running several RUGGEDFIELD apps in parallel (maps to Section 23 multi-agent vision). Overkill for a single MVP. |
| **aiagentskit/claude-agents-library** | 34 copy-paste expert agent personas (security reviewer, tester, marketer, designer, etc.). | **Cherry-pick.** Grab 1–2 (security reviewer, test writer). No need for all 34. |
| **gsd-build/get-shit-done** | Spec-driven / meta-prompting system for Claude Code. | **Skip.** Overlaps superpowers, and the repo has **moved** ("Open GSD") — original link is stale. |

**Rule:** Don't bolt all four on at once — that's the complexity KISS warns against. Default
to **superpowers** as the one with real payoff; add **metaswarm** only when the factory is
running multiple apps simultaneously.

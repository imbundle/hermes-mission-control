# mcui-adapters

Tracking note for Phase 5 (Controlled Mission Control Transition — Pilot). Lists every
`@mcui/react` adapter created and every call site replaced in this repository. Scope is
deliberately narrow: **one pilot**, not a migration.

## Adapters created

| Adapter | Wraps (`@mcui/react`) | File |
|---|---|---|
| `BadgeAdapter` | `StatusBadge` | `src/components/mcui-adapters/BadgeAdapter.tsx` |

`BadgeAdapter` is a thin wrapper: its `variant` prop is a 1:1 identity map onto
`StatusBadge`'s `StatusBadgeVariant` union (`default` \| `positive` \| `warning` \| `negative`),
passed straight through with no additional logic. No new state, no styling overrides.

## Call sites replaced

| File | Before | After |
|---|---|---|
| `src/components/overview/AgentStatusBar.tsx` | MC's own `Badge` (`src/components/ui/Badge.tsx`) | `BadgeAdapter` → `@mcui/react`'s `StatusBadge` |

This is the **only** call site touched. `Badge` has 16 importing files total in this repo;
the other 15 (`GroupRoomView.tsx`, `AgentsPanel.tsx`, `AttentionNeeded.tsx`,
`OverviewDashboard.tsx`, `SystemHealthPanel.tsx`, `HonchoSettingsPanel.tsx`,
`ToolsRoute.tsx`, `AgentsRoute.tsx`, `CronRoute.tsx`, `SessionsRoute.tsx`, `SkillsRoute.tsx`,
`KnowledgeRoute.tsx`, `LogsRoute.tsx`, `ConfigRoute.tsx`, `BotsRoute.tsx`, plus `Badge.tsx`
itself) are untouched and remain on MC's original `Badge` component — confirmed byte-identical
to `fork/main` as part of this phase's scope-containment verification.

## What did NOT change

- MC's own `Badge` component (`src/components/ui/Badge.tsx`) still exists, unmodified, and is
  still used everywhere except `AgentStatusBar.tsx`.
- No Tailwind config, no design tokens, no global CSS beyond the one-time
  `@mcui/react/styles.css` import in `src/main.tsx`.
- No routing, state management, or build-tooling changes outside what's listed below.

## Supporting changes (also in scope for this phase)

- `package.json` / `pnpm-lock.yaml` — added `@mcui/react` as a `file:` dependency pointing at
  the vendored tarball.
- `vendor/mcui-react-0.1.0-db81930.tgz` — vendored tarball, built from mcui `main` @ `db81930`
  (post issue #77's `react/jsx-runtime` externalization fix). Committed to this branch so the
  branch is clonable and buildable standalone.
- `scripts/vendor-mcui.sh` — re-vendoring script; regenerates the tarball above from a given
  mcui commit.
- `scripts/check-css-collisions.mjs` — CSS collision gate script (Phase 5, Scope item 2); diffs
  mcui's and MC's built CSS selector sets for exact-string collisions with differing values.
- `src/main.tsx` — one line added: `import '@mcui/react/styles.css';`.

## Verification evidence

Full regression, CSS-collision, and visual-verification evidence for this pilot lives outside
this repo, at `~/Developer/TMP/mission-control-ui-library/evidence/phase-5/run-1/` (screenshots
for all 4 `StatusBadge` variants × 2 themes, CSS collision reports, regression command logs,
independent review verdicts for issues #72–#75, #77).

## Rollback

Delete branch `phase-5/pilot-badge-adapter` (local + `git push fork --delete
phase-5/pilot-badge-adapter`). No feature flag exists or is needed: `fork/main` has never had
this branch merged into it, so deleting the branch fully and cleanly reverts the pilot with zero
residual state.

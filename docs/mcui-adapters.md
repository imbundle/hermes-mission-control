# mcui-adapters

Tracking note for Phase 5 (Controlled Mission Control Transition — Pilot). Lists every
`@mcui/react` adapter created and every call site replaced in this repository. Scope is
deliberately narrow: **one pilot**, not a migration.

## Adapters created

| Adapter | Wraps (`@mcui/react`) | File |
|---|---|---|
| `BadgeAdapter` | `StatusBadge` | `src/components/mcui-adapters/BadgeAdapter.tsx` |
| `ButtonAdapter` | `Button` | `src/components/mcui-adapters/ButtonAdapter.tsx` |
| `ToggleSwitchAdapter` | `Switch` | `src/components/mcui-adapters/ToggleSwitchAdapter.tsx` |
| `CardAdapter` | `Card` | `src/components/mcui-adapters/CardAdapter.tsx` |

`BadgeAdapter` is a thin wrapper: its `variant` prop is a 1:1 identity map onto
`StatusBadge`'s `StatusBadgeVariant` union (`default` \| `positive` \| `warning` \| `negative`),
passed straight through with no additional logic. No new state, no styling overrides.

`ButtonAdapter` is likewise a thin wrapper, with one real behavioral guard: MC's own `Button`
defaults `variant` to `'secondary'` while mcui's `Button` defaults to `'primary'` — the adapter
hard-codes `'secondary'` as its own default so call sites that omit `variant` keep their current
rendered appearance. Forwards `ref` (mcui's `Button` is `forwardRef`-wrapped; at least one call
site, `MissionControlShell.tsx`, depends on this — caught by `tsc`, not assumed). Every other
prop (`size`, `loading`, `icon`, `iconPosition`, `iconOnly`, native passthrough) is a 1:1 match.

`ToggleSwitchAdapter` is a thin wrapper over mcui's `Switch` (same native `<input
type="checkbox">` pattern as MC's own `ToggleSwitch`). mcui's version additionally sets
`role="switch"` with a live-tracked `aria-checked` and accepts a `data-testid` prop MC's
original lacks — neither is behaviorally required by either of the 2 call sites, so no
extra mapping logic was needed. Forwards `ref` for API parity with MC's original (which is
`forwardRef`-wrapped), though neither call site currently passes one.

`CardAdapter` is a thin wrapper over mcui's `Card`: `variant` (`'default' | 'raised' |
'sunken'`) and `padding` (`'none' | 'sm' | 'md' | 'lg'`) are identical unions on both sides,
passed straight through. mcui's `Card` additionally accepts `title`/`header`/`titleLevel`
(additive, unused by every call site — verified before writing the adapter). MC also exports
`CardHeader`/`CardTitle` as separate subcomponents with no mcui equivalent; confirmed zero
real call sites reference them (self-referenced only in `Card.tsx`'s own definition), so the
adapter doesn't need to reproduce them. Forwards `ref` for API parity with MC's original
(`forwardRef`-wrapped).

## Call sites replaced

| File | Before | After |
|---|---|---|
| `src/components/overview/AgentStatusBar.tsx` | MC's own `Badge` (`src/components/ui/Badge.tsx`) | `BadgeAdapter` → `@mcui/react`'s `StatusBadge` |

This is the only `Badge` call site touched. `Badge` has 16 importing files total in this repo;
the other 15 (`GroupRoomView.tsx`, `AgentsPanel.tsx`, `AttentionNeeded.tsx`,
`OverviewDashboard.tsx`, `SystemHealthPanel.tsx`, `HonchoSettingsPanel.tsx`,
`ToolsRoute.tsx`, `AgentsRoute.tsx`, `CronRoute.tsx`, `SessionsRoute.tsx`, `SkillsRoute.tsx`,
`KnowledgeRoute.tsx`, `LogsRoute.tsx`, `ConfigRoute.tsx`, `BotsRoute.tsx`, plus `Badge.tsx`
itself) are untouched and remain on MC's original `Badge` component — confirmed byte-identical
to `fork/main` as part of Phase 5's scope-containment verification.

`Button` was fully migrated in Phase 6.2 (issue #79): all 13 call sites now use `ButtonAdapter`.
Files: `ChatDrawer.tsx`, `MissionControlShell.tsx`, `HonchoSettingsPanel.tsx`,
`overview/{QuickActions,DashboardGrid}.tsx`, `routes/{Kanban,Cron,Sessions,Usage,Skills,Logs,Config,Bots}Route.tsx`.
MC's own `Button` component (`src/components/ui/Button.tsx`) is left in place, unused by any
call site as of this migration — not deleted, since deletion wasn't in issue #79's scope
(removing dead code is a separate decision, not part of a migration issue).

`ToggleSwitch` was fully migrated in Phase 6.3 (issue #80): both call sites now use
`ToggleSwitchAdapter`. Files: `routes/{Skills,Bots}Route.tsx`. MC's own `ToggleSwitch` component
(`src/components/ui/ToggleSwitch.tsx`) is left in place, unused, same rationale as `Button.tsx`.

`Card` was fully migrated in Phase 6.4 (issue #81): all 21 files, all 39 `<Card>` JSX
occurrences, now use `CardAdapter`. Files: `overview/{AgentsPanel,UsagePanel,AttentionNeeded,
OverviewDashboard,SystemHealthPanel,QuickActions,ProviderUsagePanel,AgentStatusBar,
ActivityFeed}.tsx`, `HonchoSettingsPanel.tsx`, `routes/{Tools,Kanban,Agents,Cron,Sessions,Usage,
Skills,Knowledge,Logs,Config,Bots}Route.tsx`. MC's own `Card`/`CardHeader`/`CardTitle`
(`src/components/ui/Card.tsx`) is left in place, `Card` unused, same rationale as `Button.tsx`;
`CardHeader`/`CardTitle` were already unused before this migration (0 real call sites, verified
in the Phase 6.1 audit).

**Known pre-existing dead imports, not introduced by this migration**: `AgentStatusBar.tsx` and
`KanbanRoute.tsx` imported `Card` but never used it in JSX even before Phase 6.4 — the migration
mechanically renamed both dead imports to `CardAdapter`, which is still unused in both files.
Confirmed harmless (`noUnusedLocals` is off in this project's `tsconfig.json`, so this doesn't
surface as a build/type error) but flagged here for a future cleanup pass, out of scope for a
migration issue.

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

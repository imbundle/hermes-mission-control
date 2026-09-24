import { forwardRef, type InputHTMLAttributes } from 'react';
import { Switch as MCUISwitch } from '@mcui/react';

/**
 * Phase 6.3 adapter (issue #80).
 *
 * Wraps `@mcui/react`'s `Switch`, exposing an API compatible with MC's own
 * `ToggleSwitch` component (`src/components/ui/ToggleSwitch.tsx`) as used at
 * both remaining call sites (`SkillsRoute.tsx`, `BotsRoute.tsx`).
 *
 * Per the Phase 6.1 audit (`docs/mc-adoption-audit.md` in the mcui repo),
 * this is a close parity pair — both are native `<input type="checkbox">`
 * with `label`/`checked`/`onChange`/`disabled` passthrough. mcui's `Switch`
 * additionally sets `role="switch"` with a live-tracked `aria-checked` (an
 * accessibility improvement, not a behavioral change) and accepts a
 * `data-testid` MC's original lacks; neither is read by either call site.
 *
 * `forwardRef`: MC's original `ToggleSwitch` is `forwardRef`-wrapped, but
 * neither call site passes a `ref` (verified by grep before writing this
 * adapter — see #80). Forwarded anyway for API parity with the original,
 * matching the precedent set by `ButtonAdapter` (#79), where an unforwarded
 * ref was a real `tsc` failure caught mid-migration.
 */

export type ToggleSwitchAdapterProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  label?: string;
};

export const ToggleSwitchAdapter = forwardRef<HTMLInputElement, ToggleSwitchAdapterProps>(
  function ToggleSwitchAdapter({ label, ...props }, ref) {
    return <MCUISwitch ref={ref} label={label} {...props} />;
  },
);

ToggleSwitchAdapter.displayName = 'ToggleSwitchAdapter';

import { forwardRef, type HTMLAttributes } from 'react';
import { Card as MCUICard } from '@mcui/react';

/**
 * Phase 6.4 adapter (issue #81).
 *
 * Wraps `@mcui/react`'s `Card`, exposing an API compatible with MC's own
 * `Card` component (`src/components/ui/Card.tsx`) as used at all 21 call
 * sites (39 `<Card>` JSX occurrences across those files).
 *
 * Per the Phase 6.1 audit (`docs/mc-adoption-audit.md` in the mcui repo):
 * `variant` (`'default' | 'raised' | 'sunken'`) and `padding`
 * (`'none' | 'sm' | 'md' | 'lg'`) are identical unions on both sides —
 * plain passthrough, no remapping needed. mcui's `Card` additionally
 * accepts `title`/`header`/`titleLevel`, which are additive and unused by
 * every current call site (verified: no call site passes `title` to
 * `<Card>` before writing this adapter — see #81).
 *
 * MC also exports `CardHeader`/`CardTitle` as separate subcomponents with
 * no mcui equivalent — confirmed zero real call sites reference them
 * (self-referenced only in `Card.tsx`'s own definition), so this adapter
 * does not need to reproduce them.
 *
 * `forwardRef`: MC's original `Card` is `forwardRef`-wrapped; forwarded
 * here for API parity, following the precedent set by `ButtonAdapter`
 * (#79), where an unforwarded ref was a real `tsc` failure caught
 * mid-migration.
 */

export type CardAdapterProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'raised' | 'sunken';
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

export const CardAdapter = forwardRef<HTMLDivElement, CardAdapterProps>(
  function CardAdapter({ variant, padding, children, ...props }, ref) {
    return (
      <MCUICard ref={ref} variant={variant} padding={padding} {...props}>
        {children}
      </MCUICard>
    );
  },
);

CardAdapter.displayName = 'CardAdapter';

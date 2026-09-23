import type { HTMLAttributes, ReactNode } from 'react';
import { StatusBadge, type StatusBadgeVariant } from '@mcui/react';

/**
 * Phase 5 pilot adapter (issue #74).
 *
 * Wraps `@mcui/react`'s `StatusBadge`, exposing an API compatible with MC's
 * own `Badge` component as actually used by its single pilot call site
 * (`src/components/overview/AgentStatusBar.tsx`): `variant` restricted to
 * the four values that call site uses (`default | positive | warning |
 * negative`), plus `dot` and `children`.
 *
 * `StatusBadge`'s own variant set (`neutral | positive | warning | negative
 * | accent | default`) already covers all four values verified in the
 * subplan's claims review — no mcui gap was found for this call site.
 *
 * This is the only adapter for this pilot; every other one of MC's Badge
 * call sites (15 of them) is left completely untouched, importing the
 * original `../ui/Badge` unchanged.
 */

export type BadgeAdapterVariant = 'default' | 'positive' | 'warning' | 'negative';

export type BadgeAdapterProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeAdapterVariant;
  dot?: boolean;
  children?: ReactNode;
};

const VARIANT_MAP: Record<BadgeAdapterVariant, StatusBadgeVariant> = {
  default: 'default',
  positive: 'positive',
  warning: 'warning',
  negative: 'negative',
};

export function BadgeAdapter({ variant = 'default', dot = false, children, ...props }: BadgeAdapterProps) {
  return (
    <StatusBadge variant={VARIANT_MAP[variant]} dot={dot} {...props}>
      {children}
    </StatusBadge>
  );
}

BadgeAdapter.displayName = 'BadgeAdapter';

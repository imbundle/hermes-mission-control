import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Button as MCUIButton } from '@mcui/react';

/**
 * Phase 6.2 adapter (issue #79).
 *
 * Wraps `@mcui/react`'s `Button`, exposing an API compatible with MC's own
 * `Button` component (`src/components/ui/Button.tsx`) as used at all 13
 * remaining call sites.
 *
 * The one real behavioral trap (documented in the Phase 6.1 audit,
 * `docs/mc-adoption-audit.md` in the mcui repo): MC's `Button` defaults
 * `variant` to `'secondary'`; mcui's `Button` defaults `variant` to
 * `'primary'`. This adapter defaults to `'secondary'` explicitly so a call
 * site that omits `variant` (relying on MC's default) keeps its current
 * rendered variant instead of silently switching to mcui's `'primary'`.
 *
 * Every other prop (`size`, `loading`, `icon`, `iconPosition`, `iconOnly`,
 * plus native `ButtonHTMLAttributes` passthrough) is a 1:1 identity match
 * between the two components — no mapping needed.
 *
 * `forwardRef`: MC's original `Button` is `forwardRef`-wrapped and at least
 * one call site (`MissionControlShell.tsx`) relies on the ref (caught by
 * `tsc` during this migration, not assumed) — this adapter forwards the ref
 * straight through to mcui's `Button`, which is itself `forwardRef`-wrapped.
 */

export type ButtonAdapterVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonAdapterSize = 'sm' | 'md' | 'lg';

export type ButtonAdapterProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonAdapterVariant;
  size?: ButtonAdapterSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
};

const VARIANT_MAP: Record<ButtonAdapterVariant, ButtonAdapterVariant> = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
};

export const ButtonAdapter = forwardRef<HTMLButtonElement, ButtonAdapterProps>(
  function ButtonAdapter(
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      iconOnly = false,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <MCUIButton
        ref={ref}
        variant={VARIANT_MAP[variant]}
        size={size}
        loading={loading}
        icon={icon}
        iconPosition={iconPosition}
        iconOnly={iconOnly}
        {...props}
      >
        {children}
      </MCUIButton>
    );
  },
);

ButtonAdapter.displayName = 'ButtonAdapter';

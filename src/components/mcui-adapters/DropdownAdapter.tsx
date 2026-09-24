import { useMemo, type ChangeEvent } from 'react';
import { Select as MCUISelect, type SelectOption } from '@mcui/react';

/**
 * Phase 6.5 adapter (issue #82).
 *
 * Wraps `@mcui/react`'s `Select`, exposing an API compatible with MC's own
 * `Dropdown` component (`src/components/ui/Dropdown.tsx`) as used at 8
 * `<Dropdown>` JSX occurrences across `KanbanRoute.tsx` and `BotsRoute.tsx`.
 *
 * Per the Phase 6.1 audit (`docs/mc-adoption-audit.md` in the mcui repo),
 * this is NOT a thin passthrough like `ButtonAdapter`/`CardAdapter`/
 * `ToggleSwitchAdapter` — it bridges 4 real functional deltas:
 *
 * 1. `onChange` shape: MC calls `(value: string) => void`; mcui synthesizes
 *    a `{ target: { value }, currentTarget: { value } }` change event.
 *    This adapter unwraps `event.target.value` before calling MC's callback.
 *
 * 2. Positioning: MC portals its menu to `document.body` with manual
 *    viewport-clamped `position: fixed`. mcui's `Select` renders its menu
 *    `position: absolute` relative to its own wrapper, with no portal.
 *    Verified live in browser (see #82) that every call site's scroll
 *    container does not clip the menu in practice.
 *
 * 3. `placeholder`: MC displays placeholder text when `value` doesn't match
 *    any option. mcui has no `placeholder` prop and falls back to
 *    displaying the raw unmatched value. None of the 8 real call sites
 *    currently exercise this path (every call site that passes
 *    `placeholder` also includes a matching `{ value: '', label: <text> }`
 *    in its own `options`), but this adapter still implements the
 *    documented defensive strategy: when `value` doesn't match any
 *    supplied option, a synthetic disabled option carrying the placeholder
 *    text is prepended so mcui's `Select` displays it instead of the raw
 *    unmatched value.
 *
 * 4. `dropUp`: MC lets the caller force upward placement explicitly. mcui's
 *    `Select` only auto-flips based on real measured space at open-time —
 *    there is no prop to force a direction, AND (verified against mcui's
 *    shipped bundle, `Select.tsx` compiled source) it never clamps the
 *    computed position to the viewport or nearest scrollable ancestor the
 *    way mcui's own `Popover`/`Tooltip` do. **Live-tested in browser (#82)
 *    against a clean pre-migration baseline**: in `KanbanRoute.tsx`'s task
 *    detail drawer (a modal with `overflow-y: auto`, `max-h-[88dvh]`), the
 *    4 call sites that pass `dropUp` (lines 381/908/932/958) render the
 *    menu with a **negative `top` offset — clipped and partially
 *    unreachable** at realistic small-viewport heights, whereas MC's
 *    original portal-to-`document.body` `Dropdown` always clamps to
 *    `top: 8px` minimum. This is a real mcui defect, not a wiring bug.
 *
 *    **Resolution: partial migration.** The 4 `dropUp` call sites in
 *    `KanbanRoute.tsx` were left on MC's own `Dropdown` component
 *    (still imported there) rather than risk shipping a regression. Only
 *    the 5 call sites that never pass `dropUp` (2 in `KanbanRoute.tsx`:
 *    tenant/assignee filters; 3 in `BotsRoute.tsx`) use this adapter.
 *    `dropUp` remains in this adapter's prop type for API-compatibility
 *    documentation purposes, but no live call site passes it — do not
 *    add a new `dropUp` call site here without re-verifying this defect
 *    is fixed upstream in `@mcui/react`.
 */

export type DropdownAdapterOption = { value: string; label: string };

export type DropdownAdapterProps = {
  value: string;
  options: DropdownAdapterOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  /** Accepted for API compatibility with MC's Dropdown; not used — see
   * delta 4 above. mcui's Select auto-flips based on real measured space. */
  dropUp?: boolean;
  disabled?: boolean;
};

export function DropdownAdapter({
  value,
  options,
  onChange,
  placeholder,
  ariaLabel,
  disabled = false,
}: DropdownAdapterProps) {
  const hasMatch = options.some((option) => option.value === value);

  const resolvedOptions: SelectOption[] = useMemo(() => {
    if (hasMatch || !placeholder) return options;
    // Delta 3: synthesize a disabled placeholder option so mcui's Select
    // displays the placeholder text instead of the raw unmatched value.
    return [{ value, label: placeholder, disabled: true }, ...options];
  }, [hasMatch, options, placeholder, value]);

  const handleChange = (event: ChangeEvent<HTMLSelectElement> | { target: { value: string } }) => {
    onChange(event.target.value);
  };

  return (
    <MCUISelect
      value={value}
      options={resolvedOptions}
      onChange={handleChange}
      aria-label={ariaLabel}
      disabled={disabled}
    />
  );
}

DropdownAdapter.displayName = 'DropdownAdapter';

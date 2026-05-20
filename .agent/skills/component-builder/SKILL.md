# Component Builder Skill

Load this skill whenever you are creating or modifying a React component in Securegate. It tells you where the component goes, how it should be structured, and how to wire it up to the design system without reinventing anything.

## Before You Start

Read `.agent/rules/design-system.md` first. Components that do not follow the design system get rejected at review. This skill assumes you already know the tokens from `tokens/design-tokens.css` (import from project root via a relative path like `../../tokens/design-tokens.css`), the spacing scale, and the component primitives.

Then ask: does this component already exist? Search `components/` before adding a new one. Two slightly different `Button` components is how codebases rot.

## Where Components Live

```
components/
├── ui/                  primitives: Button, Input, Card, Badge, Avatar, etc.
├── forms/               form-level components: LoginForm, SignUpForm, ResetPasswordForm, etc.
└── shared/              composites used across more than one domain: Logo, PageWrapper, EmptyState, etc.
```

If a component is used exactly once and it is complex, it can live next to the page that uses it in `app/.../_components/` (Next.js private folder, excluded from routing). Promote it to `components/` when a second caller shows up.

## Component File Template

```tsx
// components/<folder>/<ComponentName>.tsx
// components/<folder>/<ComponentName>.module.css

import styles from './ComponentName.module.css';
import type { ComponentNameProps } from './ComponentName.types';

export function ComponentName({ children, className }: ComponentNameProps) {
  return (
    <div className={`${styles.root} ${className ?? ''}`}>
      {children}
    </div>
  );
}
```

```
/* ComponentName.module.css */
.root {
  /* base styles using design tokens */
}
```

Notes:
- Named export, not default export. Default exports make renaming harder and break auto-imports.
- Each component has a co-located `.module.css` file for its styles.
- `className` prop is always accepted on components that render a single root element, merged with template literal so callers can extend styling without forking.
- Props type goes in a separate `.types.ts` file, named `<ComponentName>Props`.
- Required props come before optional ones in the type definition.

## Server vs. Client Components

Default to server components. A component becomes a client component only when it needs one of these:
- React state (`useState`, `useReducer`)
- Effects (`useEffect`, `useLayoutEffect`)
- Browser-only APIs (`window`, `document`, `localStorage`)
- Event handlers that are more than a simple link (`onClick`, `onChange`)
- Context consumption for interactivity

If you add `"use client"`, put it on the first line of the file. Do not add it defensively.

Keep the client boundary as low in the tree as possible. A page that is mostly static but has one interactive button should not be a client component; the button should be.

## Styling

All styles go in co-located `.module.css` files. Write standard CSS using
`var(--*)` design tokens — never hardcode raw color, typography, or spacing values.

```css
/* ✅ Correct — uses tokens */
.button {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-radius: var(--radius-md);
  padding: 12px 24px;
}

/* ❌ Wrong — hardcoded values */
.button {
  background: #6750a4;
  color: #ffffff;
  border-radius: 8px;
  padding: 12px 24px;
}
```

## Variants

For components with variants (Button, Badge), define variant classes in CSS and
switch between them with a simple map or ternary — no complex `if/else` chains.

```tsx
// Button.tsx
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  danger: styles.danger,
};

const sizeClass: Record<ButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  const classes = [
    styles.base,
    variantClass[variant],
    sizeClass[size],
    className ?? '',
  ].join(' ');

  return <button className={classes} {...props} />;
}
```

```css
/* Button.module.css */
.base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-family: var(--typo-label-large-font-family);
  font-size: var(--typo-label-large-font-size);
  font-weight: var(--typo-label-large-font-weight);
  transition: background 0.2s, opacity 0.2s;
  cursor: pointer;
}

.primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.primary:hover {
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
}

.secondary {
  background: var(--color-surface);
  color: var(--color-on-surface);
  border: 1px solid var(--color-outline);
}

.ghost {
  background: transparent;
  color: var(--color-on-surface);
}

.danger {
  background: var(--color-error);
  color: var(--color-on-error);
}

.sm {
  padding: 8px 12px;
}
.md {
  padding: 12px 16px;
}
.lg {
  padding: 14px 24px;
}
```

## Accessibility

Every interactive element needs a visible keyboard focus state. Use `:focus-visible` with a prominent outline or ring style referencing a design token.

Buttons without visible text need `aria-label`. Icon-only buttons are the most common offender. Do not let them ship without a label.

Form inputs need associated labels via `htmlFor`/`id`. Error messages are linked via `aria-describedby`.

Images need `alt`. Decorative images use `alt=""`. Do not omit the attribute.

## Props to Avoid

- Do not expose raw color props (`color="red"`). Use variants.
- Do not expose raw size values in pixels. Use the size variants.
- Do not accept arbitrary inline styles via a `style` prop unless there is a specific reason (like a dynamic value that cannot be expressed in CSS, such as a progress bar width).

## Testing a New Component

If the component is a primitive (lives in `ui/`), write a simple Storybook-style manual-check by importing it into `app/_dev/page.tsx` (a Next.js private folder — the underscore excludes it from production routing; gate access with `NODE_ENV === 'development'`). Verify:
- Default appearance
- Every variant
- Every size
- Disabled state (if applicable)
- Focus state (tab into it)
- Hover state
- On mobile viewport (Chrome DevTools at 360px wide)

Domain components (forms, shared) can be reviewed in place on the relevant page.

## Common Mistakes

- Creating a new primitive when an existing one would work with a new variant. Extend, do not duplicate.
- Forgetting `className` prop on a component that might need to be laid out differently in different places.
- Making a component a client component because it was easier, when a server component would have worked.
- Using arbitrary pixel values instead of the spacing scale (4px grid). Use `12px` not `13px`.
- Hardcoding colors instead of using design tokens.
- Adding complex logic inside the JSX. Extract to a named constant or helper above the return.

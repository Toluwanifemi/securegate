# Rule: Design System

## Token File Is the Source of Truth

The project has one design token file. Never modify it:

- `tokens/design-tokens.css` — all color values, typography (font sizes, weights, line heights, font families)

The token file exports CSS custom properties (CSS variables) available globally.
Import it into your app's root layout from `securegate-temp/`:

```css
/* securegate-temp/app/globals.css */
@import "../../../tokens/design-tokens.css";
```

The `tokens/` directory also contains:
- `design-tokens.tokens.json` — Figma-compatible source (used by `convert-tokens.js`)
- `colour-token.json` — raw colour palette with light/dark role mappings
- `convert-tokens.js` — script that compiles source JSON into `design-tokens.css`

Edit the `.json` sources and re-run `convert-tokens.js`; never edit `design-tokens.css` directly.

## Mandatory: Use CSS Variables, Never Raw Values

Never write hardcoded color values or typography values anywhere in this codebase.

**Wrong:**
```css
color: #1a1a1a;
font-size: 16px;
font-family: 'Inter', sans-serif;
background: #f5f5f5;
```

**Correct:**
```css
color: var(--color-on-surface);
font-size: var(--typo-body-large-font-size);
font-family: var(--typo-body-large-font-family);
background: var(--color-surface);
```

Before writing any style value, check the token file. If a variable exists for what you need, use it. If it does not exist, ask before inventing a new value.

## Available Color Tokens

Use these patterns for colors:
- `--color-primary` / `--color-on-primary` — main brand color
- `--color-surface` — card/background surfaces
- `--color-background` — page background
- `--color-error` — error states
- `--color-outline` — borders
- `--color-on-surface` / `--color-on-background` — text on surfaces

For dark theme support, wrap dark overrides in a `[data-theme="dark"]` rule:

```css
.card {
  background: var(--color-surface);
  color: var(--color-on-surface);
}

[data-theme="dark"] .card {
  background: var(--color-surface-dim);
  /* most tokens switch automatically via the theme block in design-tokens.css */
}
```

## Available Typography Tokens

Use these patterns for typography:
- `--typo-display-large-*` — hero text
- `--typo-headline-large-*` — section headers
- `--typo-title-large-*` — card titles
- `--typo-body-large-*` — main body text
- `--typo-body-medium-*` — secondary body text
- `--typo-label-large-*` — buttons, links

Each includes: `font-size`, `font-family`, `font-weight`, `letter-spacing`, `line-height`.

## Spacing Scale

Use multiples of 4px for all spacing (margin, padding, gap). Do not use arbitrary values.

Allowed: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`

## Border Radius

Use these values consistently. They are defined as CSS variables in `tokens/design-tokens.css`
so they remain a single source of truth:
- Small elements (badges, tags): `var(--radius-sm)` → `4px`
- Buttons and inputs: `var(--radius-md)` → `8px`
- Cards and modals: `var(--radius-lg)` → `12px`

These variables are declared in the token file. If you need a new radius, add it to
`tokens/design-tokens.css` (and `design-tokens.tokens.json` if the file is auto-generated).

## Styling Method

- All component styles use CSS Modules (`.module.css` files).
- No inline `style={{}}` props except for truly dynamic values that cannot be expressed in CSS (e.g., a progress bar width driven by a number).
- No Tailwind. No styled-components. CSS Modules only.

## Mobile-First

Every component must be built mobile-first:

- Default styles target mobile (small screens).
- Use `@media (min-width: 768px)` to layer in desktop styles.
- Touch targets must be a minimum of 44px tall.
- Every page must be fully functional on a 375px viewport — test all forms and navigation at that width.
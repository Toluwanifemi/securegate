# Design System Rules

## Purpose

These rules define how every UI component in SecureGate looks and behaves.
The design language is **flat** — clean layouts, solid colours, precise spacing,
no shadows, no gradients, no skeuomorphic elements.

---

## Design Principles

| Principle       | Description                                                             |
|-----------------|-------------------------------------------------------------------------|
| Flat            | No box shadows, no gradients, no blurs on UI surfaces                   |
| Purposeful      | Every element earns its place — no decorative noise                     |
| Readable        | High contrast text, adequate font sizes, generous line height            |
| Accessible      | WCAG AA as a minimum target on all interactive elements                  |
| Consistent      | Use design tokens — never hardcode colour hex values in components       |

---

## Colour Tokens

Define these in `globals.css` using CSS custom properties.
Reference them in Tailwind config via `extend.colors`.

```css
:root {
  /* Brand */
  --color-primary:        #1a1a2e;  /* Deep navy — primary actions */
  --color-primary-hover:  #16213e;  /* Darker navy on hover */
  --color-accent:         #0f3460;  /* Mid navy — links, focus rings */

  /* Surface */
  --color-bg:             #ffffff;  /* Page background */
  --color-surface:        #f5f5f5;  /* Card / input background */
  --color-border:         #e0e0e0;  /* Borders and dividers */

  /* Text */
  --color-text-primary:   #111111;  /* Body text */
  --color-text-secondary: #555555;  /* Supporting text, labels */
  --color-text-muted:     #999999;  /* Placeholder, disabled */

  /* Feedback */
  --color-success:        #16a34a;  /* Green — verified, success states */
  --color-warning:        #d97706;  /* Amber — warnings */
  --color-error:          #dc2626;  /* Red — errors, destructive actions */
  --color-info:           #2563eb;  /* Blue — informational messages */
}
```

---

## Typography

- **Font family:** System font stack — no web font imports (performance first)
- **Base size:** 16px
- **Scale:** Use Tailwind's default scale (`text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`)

| Role             | Class                          |
|------------------|--------------------------------|
| Page heading     | `text-2xl font-semibold`       |
| Section heading  | `text-lg font-medium`          |
| Body text        | `text-base font-normal`        |
| Supporting text  | `text-sm text-[--color-text-secondary]` |
| Error text       | `text-sm text-[--color-error]` |
| Label            | `text-sm font-medium`          |

---

## Spacing

Use Tailwind spacing utilities. Do not use arbitrary values unless unavoidable.

| Use               | Value     |
|-------------------|-----------|
| Between sections  | `gap-8`   |
| Between elements  | `gap-4`   |
| Inside components | `gap-2`   |
| Page padding      | `p-6`     |
| Form padding      | `p-8`     |

---

## Component Patterns

### Input Fields

```tsx
<div className="flex flex-col gap-1.5">
  <label htmlFor="email" className="text-sm font-medium">
    Email address
  </label>
  <input
    id="email"
    type="email"
    placeholder="you@example.com"
    className="w-full rounded border border-[--color-border] bg-[--color-surface]
               px-3 py-2 text-base text-[--color-text-primary]
               placeholder:text-[--color-text-muted]
               focus:border-[--color-accent] focus:outline-none focus:ring-2
               focus:ring-[--color-accent]/20"
  />
  {error && (
    <p className="text-sm text-[--color-error]">{error}</p>
  )}
</div>
```

### Primary Button

```tsx
<button
  type="submit"
  className="w-full rounded bg-[--color-primary] px-4 py-2.5
             text-base font-medium text-white
             hover:bg-[--color-primary-hover]
             focus:outline-none focus:ring-2 focus:ring-[--color-accent]/40
             disabled:cursor-not-allowed disabled:opacity-50
             transition-colors duration-150"
>
  Continue
</button>
```

### Auth Page Card

All auth pages use a centred card layout:

```tsx
<main className="flex min-h-screen items-center justify-center bg-[--color-bg] p-4">
  <div className="w-full max-w-md rounded border border-[--color-border]
                  bg-[--color-bg] p-8">
    {/* Page heading, form, links */}
  </div>
</main>
```

### Inline Feedback (Error / Success)

```tsx
/* Error */
<div className="rounded border border-[--color-error]/30
                bg-[--color-error]/5 px-4 py-3">
  <p className="text-sm text-[--color-error]">{message}</p>
</div>

/* Success */
<div className="rounded border border-[--color-success]/30
                bg-[--color-success]/5 px-4 py-3">
  <p className="text-sm text-[--color-success]">{message}</p>
</div>
```

### Password Strength Indicator

Displayed below the password field during sign up.

```tsx
<div className="flex gap-1 mt-1.5">
  {[1, 2, 3, 4].map((level) => (
    <div
      key={level}
      className={cn(
        "h-1 flex-1 rounded-full transition-colors duration-200",
        strength >= level ? strengthColour(strength) : "bg-[--color-border]"
      )}
    />
  ))}
</div>
<p className="text-xs text-[--color-text-secondary] mt-1">{strengthLabel}</p>
```

Strength colours: `bg-[--color-error]` (1) → `bg-[--color-warning]` (2-3) → `bg-[--color-success]` (4)

---

## Accessibility Rules

- Every `<input>` must have an associated `<label>` via `htmlFor` / `id`
- Every interactive element must have a visible focus ring
- Colour alone must never be the only way to communicate state (pair colour with text or icon)
- Error messages must be linked to their field via `aria-describedby`
- Buttons must never be disabled without an explanation visible to the user

---

## What Agents Must Never Do

- Add `box-shadow` or `drop-shadow` to cards, inputs, or buttons
- Use gradients on UI surfaces (decorative gradients on illustration-only elements are acceptable)
- Hardcode hex values in component files — always reference a token
- Build components without accessibility attributes
- Override the spacing scale with arbitrary Tailwind values unless there is no other option

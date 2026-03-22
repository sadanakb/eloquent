# ELOQUENT Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete visual redesign of all 10 pages + shared components using the new token system and design spec.

**Architecture:** Phase 1 (Tasks 1–10) builds the foundation sequentially — token migration first, then parallel component rebuilds. Phase 2 (Tasks 11–20) redesigns all 10 pages in parallel once the foundation is committed. Task 1 must complete before anything else.

**Tech Stack:** React 18 + Vite + JSX + CSS Modules + CSS Custom Properties. No new libraries.

**Spec:** `docs/superpowers/specs/2026-03-22-eloquent-design-overhaul.md`

---

## PHASE 1 — Foundation

### Task 1: Token Migration + theme.css + Dark Mode Init
**MUST complete before any other task. Touches every CSS file.**

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/styles/index.css`
- Modify: `src/main.jsx`

- [ ] **Step 1: Extend theme.css — add new tokens as aliases over existing ones**

Replace the entire content of `src/styles/theme.css` with:

```css
:root {
  /* ── NEW: Parchment backgrounds ── */
  --bg-parchment:       #F5F0E8;
  --bg-parchment-light: #FAF7F2;
  --bg-parchment-dark:  #EDE7DB;

  /* ── Aliases: old names → new (keeps existing code working) ── */
  --bg-page:       var(--bg-parchment);
  --bg-card:       var(--bg-parchment-light);
  --bg-card-hover: var(--gold-50);
  --bg-elevated:   var(--bg-parchment-light);
  --bg-inset:      var(--bg-parchment-dark);
  --bg-deep:       var(--bg-parchment-dark);

  /* ── NEW: Gold scale ── */
  --gold-50:  #FDF8ED;
  --gold-100: #F9EDCC;
  --gold-300: #E5C458;
  --gold-500: #C5960C;
  --gold-600: #A67C0B;
  --gold-700: #8A6609;
  --gold-800: #6B4F07;

  /* ── Aliases: old gold names ── */
  --accent-gold:       var(--gold-500);
  --accent-gold-light: var(--gold-300);
  --accent-copper:     var(--gold-300);
  --accent-warm:       var(--gold-100);
  --gold:              var(--gold-500);
  --gold-bright:       var(--gold-300);
  --gold-dark:         var(--gold-700);
  --gold-dim:          var(--gold-100);
  --warning:           var(--gold-500);

  /* ── NEW: Ink scale ── */
  --ink-900: #1A1612;
  --ink-800: #2D2822;
  --ink-600: #5C554B;
  --ink-400: #8C8478;
  --ink-200: #C7C0B5;

  /* ── Aliases: old text names ── */
  --text-primary:   var(--ink-900);
  --text-secondary: var(--ink-600);
  --text-muted:     var(--ink-400);
  --text-dim:       var(--ink-400);
  --text:           var(--ink-900);
  --border:         var(--ink-200);
  --border-light:   var(--ink-200);
  --border-gold:    var(--gold-300);

  /* ── NEW: Semantic ── */
  --accent-success: #4A7C59;
  --accent-error:   #9C4040;
  --accent-info:    #4A6B8A;

  /* ── Aliases: old semantic ── */
  --success:     var(--accent-success);
  --error:       var(--accent-error);
  --green:       var(--accent-success);
  --green-dim:   var(--accent-success);
  --red:         var(--accent-error);
  --red-dim:     var(--accent-error);
  --accent-blue: var(--accent-info);

  /* ── UNCHANGED: Spacing, radius, shadow, transitions, fonts ── */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  --shadow-card:     0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03);
  --shadow-elevated: 0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
  --shadow-inset:    inset 0 1px 2px rgba(0,0,0,0.04);

  --font-display: 'Cormorant Garamond', 'Georgia', serif;
  --font-body:    'Inter', -apple-system, 'Segoe UI', sans-serif;
  --font-logo:    'Old Standard TT', 'Georgia', serif;
  --font-mono:    'JetBrains Mono', monospace;

  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;

  /* ── Typography scale ── */
  --text-hero:     clamp(3.5rem, 8vw, 6rem);
  --text-h1:       clamp(2rem, 4vw, 3rem);
  --text-h2:       clamp(1.5rem, 2.5vw, 2rem);
  --text-h3:       clamp(1.125rem, 1.5vw, 1.5rem);
  --text-body:     1rem;
  --text-small:    0.875rem;
  --text-caption:  0.75rem;
  --text-overline: 0.6875rem;
}

/* ── Dark Mode ── */
[data-theme="dark"] {
  --bg-parchment:       #141210;
  --bg-parchment-light: #1E1B17;
  --bg-parchment-dark:  #282420;
  --gold-300: #D4A844;
  --gold-500: #E5BC4A;
  --ink-900:  #F0EBE2;
  --ink-800:  #D4CFC8;
  --ink-600:  #B5AFA5;
  --ink-400:  #8C8478;
  --ink-200:  #3A3530;
}
```

- [ ] **Step 2: Update src/styles/index.css — remove ornaments.css import**

```css
@import './fonts.css';
@import './theme.css';
@import './base.css';
@import './animations.css';
@import './textures.css';
```
(Remove the `@import './ornaments.css';` line)

- [ ] **Step 3: Add dark mode init to src/main.jsx**

Add these lines before the `ReactDOM.createRoot(...)` call:

```js
// Dark mode initialization
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  document.documentElement.dataset.theme = 'dark';
}
```

- [ ] **Step 4: Verify build passes**

```bash
cd /Users/sadanakb/eloquent && npm run build
```
Expected: Build completes with 0 errors. Warnings about unused variables are OK.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css src/styles/index.css src/main.jsx
git commit -m "feat: token system migration + dark mode foundation"
```

---

### Task 2: Extend animations.css
**Can run in parallel with Tasks 3–10 after Task 1 is committed.**

**Files:**
- Modify: `src/styles/animations.css`

- [ ] **Step 1: Append new keyframes to end of animations.css**

```css
/* ── ELOQUENT Design Overhaul — neue Animationen ── */

@keyframes scaleXIn {
  from { transform: scaleX(0); opacity: 0; }
  to   { transform: scaleX(1); opacity: 1; }
}

@keyframes progressFill {
  from { width: 0%; }
}

@keyframes goldPulse {
  0%   { box-shadow: 0 0 0 0 rgba(197, 150, 12, 0.5); }
  50%  { box-shadow: 0 0 20px 8px rgba(197, 150, 12, 0.2); }
  100% { box-shadow: 0 0 0 0 rgba(197, 150, 12, 0); }
}

@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}

@keyframes searchPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(197, 150, 12, 0.4); }
  50%      { box-shadow: 0 0 0 8px rgba(197, 150, 12, 0); }
}

/* Utility classes */
.animate-scale-x-in {
  animation: scaleXIn 400ms ease-out forwards;
}
.animate-gold-pulse {
  animation: goldPulse 600ms ease-out 1;
}
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-parchment-dark) 25%,
    var(--bg-parchment-light) 50%,
    var(--bg-parchment-dark) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 2: Build check**
```bash
cd /Users/sadanakb/eloquent && npm run build
```

- [ ] **Step 3: Commit**
```bash
git add src/styles/animations.css
git commit -m "feat: add goldPulse, shimmer, scaleXIn, progressFill, searchPulse animations"
```

---

### Task 3: Create Icons.jsx
**Can run in parallel with Tasks 2, 4–10 after Task 1 is committed.**

**Files:**
- Create: `src/components/icons/Icons.jsx`

- [ ] **Step 1: Create the directory and file**

Create `src/components/icons/Icons.jsx` with all 17 icon components. Each accepts `size` (default 24) and `color` (default `currentColor`):

```jsx
// src/components/icons/Icons.jsx

const iconProps = (size, color) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export function CrossedFeathers({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M3 21 L10 14 M14 10 L21 3 M8 3 C8 3 12 3 15 6 C18 9 17 13 14 14 L10 14 M16 21 C16 21 16 17 13 14" />
    </svg>
  );
}

export function GlobeNetwork({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 C9 7 9 17 12 21 M12 3 C15 7 15 17 12 21 M3 12 L21 12" />
      <circle cx="5" cy="7" r="1.5" fill={color} stroke="none" />
      <circle cx="19" cy="7" r="1.5" fill={color} stroke="none" />
      <circle cx="12" cy="20" r="1.5" fill={color} stroke="none" />
    </svg>
  );
}

export function Bullseye({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function OpenBook({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M2 6 C2 6 7 5 12 8 C17 5 22 6 22 6 L22 19 C22 19 17 18 12 21 C7 18 2 19 2 19 Z" />
      <path d="M12 8 L12 21" />
    </svg>
  );
}

export function StarIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" />
    </svg>
  );
}

export function BoltIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M13 2 L4 14 L11 14 L11 22 L20 10 L13 10 Z" />
    </svg>
  );
}

export function ScrollIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M6 4 C6 4 4 4 4 6 C4 8 6 8 6 8 L18 8 C18 8 20 8 20 10 C20 12 18 12 18 12 L6 12 C6 12 4 12 4 14 C4 16 6 16 6 16 L18 16" />
      <path d="M8 4 L18 4 C18 4 20 4 20 6 L20 14" />
    </svg>
  );
}

export function ShieldIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M12 2 L20 6 L20 12 C20 16.4 16.5 20.2 12 22 C7.5 20.2 4 16.4 4 12 L4 6 Z" />
    </svg>
  );
}

export function TrophyIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M8 21 L16 21 M12 17 L12 21 M5 3 L19 3 L19 10 C19 13.9 15.9 17 12 17 C8.1 17 5 13.9 5 10 Z" />
      <path d="M5 5 L2 5 L2 8 C2 10.2 3.8 12 6 12" />
      <path d="M19 5 L22 5 L22 8 C22 10.2 20.2 12 18 12" />
    </svg>
  );
}

export function BookmarkBook({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M4 4 C4 3 5 2 6 2 L18 2 C19 2 20 3 20 4 L20 22 L14 18 L8 22 L4 22 Z" />
      <path d="M8 2 L8 14 L11 12 L14 14 L14 2" />
    </svg>
  );
}

export function SwordIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M14.5 17.5 L3 6 L3 3 L6 3 L17.5 14.5" />
      <path d="M13 19 L19 13" />
      <path d="M16 16 L21 21" />
      <path d="M14.5 17.5 L18 21 L21 18 L17.5 14.5" />
    </svg>
  );
}

export function CrownIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M2 19 L22 19 L19 9 L14 14 L12 7 L10 14 L5 9 Z" />
    </svg>
  );
}

export function FeatherIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

export function SearchIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21 L16.65 16.65" />
    </svg>
  );
}

export function LockIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11 L7 7 C7 4.8 9.2 3 12 3 C14.8 3 17 4.8 17 7 L17 11" />
    </svg>
  );
}

export function SunIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function MoonIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
```

- [ ] **Step 2: Build check**
```bash
cd /Users/sadanakb/eloquent && npm run build
```

- [ ] **Step 3: Commit**
```bash
git add src/components/icons/
git commit -m "feat: add custom SVG icon library (17 icons)"
```

---

### Task 4: Button Component Redesign
**Can run in parallel with Tasks 2, 3, 5–10 after Task 1 is committed.**

**Files:**
- Modify: `src/components/Button.jsx`
- Modify: `src/components/Button.module.css`

- [ ] **Step 1: Update Button.jsx — add `size` prop, keep eventBus sound**

```jsx
// src/components/Button.jsx
import eventBus from '../engine/event-bus.js';
import styles from './Button.module.css';

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style: s,
  className = '',
  type = 'button',
}) {
  const cls = [
    styles.btn,
    styles[variant] || styles.primary,
    styles[`size-${size}`],
    disabled ? styles.disabled : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={disabled ? undefined : (e) => {
        eventBus.emit('sound:play', { sound: 'click' });
        onClick?.(e);
      }}
      className={cls}
      style={s}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Replace Button.module.css**

```css
/* Button.module.css */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.9375rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: transform var(--transition-fast),
              box-shadow var(--transition-fast),
              background-color var(--transition-fast),
              border-color var(--transition-fast),
              color var(--transition-fast);
  white-space: nowrap;
  min-height: 44px;
}

/* Sizes */
.size-sm { padding: 8px 16px; font-size: var(--text-small); min-height: 36px; }
.size-md { padding: 12px 24px; }
.size-lg { padding: 16px 32px; font-size: 1rem; }

/* Primary */
.primary {
  background: var(--gold-500);
  color: #fff;
  box-shadow: 0 2px 8px rgba(197, 150, 12, 0.2);
}
.primary:hover:not(.disabled) {
  background: var(--gold-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(197, 150, 12, 0.3);
}
.primary:active:not(.disabled) {
  background: var(--gold-700);
  transform: translateY(0);
}

/* Secondary */
.secondary {
  background: transparent;
  color: var(--ink-800);
  border: 1.5px solid var(--ink-200);
}
.secondary:hover:not(.disabled) {
  border-color: var(--gold-300);
  color: var(--gold-700);
  background: var(--gold-50);
}

/* Tertiary */
.tertiary {
  background: transparent;
  color: var(--gold-700);
  border: none;
  padding-left: 4px;
  padding-right: 4px;
  text-decoration-line: underline;
  text-underline-offset: 4px;
  text-decoration-color: transparent;
}
.tertiary:hover:not(.disabled) {
  color: var(--gold-800);
  text-decoration-color: var(--gold-700);
}

/* Ghost (legacy alias for tertiary) */
.ghost { composes: tertiary; }

/* Disabled */
.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* Legacy variant aliases */
.default { composes: primary; }
.gold    { composes: primary; }
.accent  { composes: primary; }
.danger {
  background: var(--accent-error);
  color: #fff;
}
.danger:hover:not(.disabled) {
  background: #7a3030;
  transform: translateY(-1px);
}
```

- [ ] **Step 3: Build check**
```bash
cd /Users/sadanakb/eloquent && npm run build
```

- [ ] **Step 4: Commit**
```bash
git add src/components/Button.jsx src/components/Button.module.css
git commit -m "feat: redesign Button — primary/secondary/tertiary variants"
```

---

### Task 5: Card Component Redesign
**Can run in parallel with Tasks 2, 3, 4, 6–10 after Task 1.**

**Files:**
- Modify: `src/components/Card.jsx`
- Modify: `src/components/Card.module.css`

- [ ] **Step 1: Update Card.jsx**

```jsx
// src/components/Card.jsx
import styles from './Card.module.css';

export function Card({
  children,
  featured = false,
  clickable = false,
  onClick,
  className = '',
  style: s,
}) {
  const cls = [
    styles.card,
    featured ? styles.featured : '',
    clickable || onClick ? styles.clickable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} style={s} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Replace Card.module.css**

```css
/* Card.module.css */
.card {
  background: var(--bg-parchment-light);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: var(--space-lg);
  box-shadow: var(--shadow-card);
}

.featured {
  background: linear-gradient(135deg, var(--gold-50), var(--gold-100));
  border: 1px solid rgba(197, 150, 12, 0.2);
  border-left: 3px solid var(--gold-500);
}

.clickable {
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.clickable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-elevated);
}
.clickable:active {
  transform: translateY(0);
}
```

- [ ] **Step 3: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/components/Card.jsx src/components/Card.module.css
git commit -m "feat: redesign Card — standard + featured variants"
```

---

### Task 6: Create Input Component
**Can run in parallel with Tasks 2–5, 7–10 after Task 1.**

**Files:**
- Create: `src/components/Input.jsx`
- Create: `src/components/Input.module.css`

- [ ] **Step 1: Create Input.jsx**

```jsx
// src/components/Input.jsx
import styles from './Input.module.css';

export function Input({ label, placeholder, value, onChange, type = 'text', disabled = false, className = '' }) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${styles.input} ${disabled ? styles.disabled : ''}`}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create Input.module.css**

```css
/* Input.module.css */
.wrapper { display: flex; flex-direction: column; gap: 6px; }

.label {
  font-family: var(--font-body);
  font-size: var(--text-overline);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gold-700);
}

.input {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  color: var(--ink-900);
  background: var(--bg-parchment-light);
  border: 1.5px solid var(--ink-200);
  border-radius: 8px;
  padding: 12px 16px;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  min-height: 44px;
}
.input::placeholder { color: var(--ink-400); font-style: italic; }
.input:focus {
  border-color: var(--gold-500);
  box-shadow: 0 0 0 3px rgba(197, 150, 12, 0.15);
}

.disabled { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 3: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/components/Input.jsx src/components/Input.module.css
git commit -m "feat: add Input component"
```

---

### Task 7: Badge Component Redesign
**Can run in parallel with Tasks 2–6, 8–10 after Task 1.**

**Files:**
- Modify: `src/components/Badge.jsx`
- Modify: `src/components/Badge.module.css` (or create if it doesn't exist)

- [ ] **Step 1: Update Badge.jsx**

```jsx
// src/components/Badge.jsx
import styles from './Badge.module.css';

export function Badge({ children, type = 'category', active = false, className = '' }) {
  const cls = [styles.badge, styles[type], active ? styles.active : '', className]
    .filter(Boolean).join(' ');
  return <span className={cls}>{children}</span>;
}
```

- [ ] **Step 2: Replace/create Badge.module.css**

```css
/* Badge.module.css */
.badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--text-overline);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 4px;
  padding: 3px 8px;
  white-space: nowrap;
}

/* Rang badge */
.rank {
  border: 1.5px solid var(--gold-300);
  color: var(--gold-700);
  background: transparent;
  letter-spacing: 0.1em;
}

/* Kategorie badge (filterable) */
.category {
  border: 1px solid var(--ink-200);
  color: var(--ink-600);
  background: transparent;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: var(--text-caption);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.category:hover { border-color: var(--gold-300); color: var(--gold-700); }
.category.active { background: var(--gold-500); color: #fff; border-color: var(--gold-500); }

/* Wortart badge */
.wordtype {
  background: var(--bg-parchment-dark);
  color: var(--ink-600);
  border-radius: 4px;
  font-size: 0.6875rem;
}
```

- [ ] **Step 3: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/components/Badge.jsx src/components/Badge.module.css
git commit -m "feat: redesign Badge — rank/category/wordtype variants"
```

---

### Task 8: Ornament Component + Delete ornaments.css
**Can run in parallel with Tasks 2–7, 9–10 after Task 1.**

**Files:**
- Modify: `src/components/Ornament.jsx`
- Create: `src/components/Ornament.module.css`
- Delete: `src/styles/ornaments.css`

- [ ] **Step 1: Read current Ornament.jsx to understand existing API**
```bash
cat /Users/sadanakb/eloquent/src/components/Ornament.jsx
```

- [ ] **Step 2: Replace Ornament.jsx**

```jsx
// src/components/Ornament.jsx
import styles from './Ornament.module.css';

// Double-line divider (thick + thin, gold)
export function OrnamentDivider({ className = '' }) {
  return (
    <div className={`${styles.divider} ${className}`} aria-hidden="true">
      <div className={styles.lines}>
        <div className={styles.thick} />
        <div className={styles.thin} />
      </div>
      <div className={styles.diamond} />
      <div className={`${styles.lines} ${styles.linesRight}`}>
        <div className={styles.thick} />
        <div className={styles.thin} />
      </div>
    </div>
  );
}

// Single horizontal rule in gold
export function OrnamentRule({ className = '' }) {
  return <hr className={`${styles.rule} ${className}`} aria-hidden="true" />;
}

// Legacy export for backward compat
export function Ornament({ type = 'divider', className = '' }) {
  if (type === 'rule') return <OrnamentRule className={className} />;
  return <OrnamentDivider className={className} />;
}

export default Ornament;
```

- [ ] **Step 3: Create Ornament.module.css**

```css
/* Ornament.module.css */
.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 100%;
  padding: var(--space-sm) 0;
}

.lines {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 80px;
}
.linesRight { align-items: flex-start; }

.thick {
  height: 2px;
  width: 100%;
  background: linear-gradient(90deg, transparent, var(--gold-500));
}
.linesRight .thick {
  background: linear-gradient(90deg, var(--gold-500), transparent);
}

.thin {
  height: 1px;
  width: 100%;
  margin-top: 3px;
  background: linear-gradient(90deg, transparent, rgba(197, 150, 12, 0.4));
}
.linesRight .thin {
  background: linear-gradient(90deg, rgba(197, 150, 12, 0.4), transparent);
}

.diamond {
  width: 8px;
  height: 8px;
  background: var(--gold-500);
  transform: rotate(45deg);
  margin: 0 12px;
  flex-shrink: 0;
}

.rule {
  border: none;
  border-top: 1px solid var(--ink-200);
  margin: var(--space-md) 0;
}
```

- [ ] **Step 4: Delete ornaments.css**
```bash
rm /Users/sadanakb/eloquent/src/styles/ornaments.css
```

- [ ] **Step 5: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/components/Ornament.jsx src/components/Ornament.module.css
git add -u src/styles/ornaments.css
git commit -m "feat: redesign Ornament component, remove ornaments.css"
```

---

### Task 9: Navbar + BottomNav Redesign
**Can run in parallel with Tasks 2–8, 10 after Task 1.**

**Files:**
- Modify: `src/components/NavBar.jsx`
- Modify: `src/components/NavBar.module.css`
- Modify: `src/components/BottomNav.jsx`
- Modify: `src/components/BottomNav.module.css`

- [ ] **Step 1: Read current NavBar.module.css and BottomNav.module.css**
```bash
cat /Users/sadanakb/eloquent/src/components/NavBar.module.css
cat /Users/sadanakb/eloquent/src/components/BottomNav.module.css
```

- [ ] **Step 2: Replace NavBar.module.css**

```css
/* NavBar.module.css */
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-xl);
  gap: var(--space-xl);
  background: rgba(245, 240, 232, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.logo {
  display: flex;
  align-items: baseline;
  gap: 8px;
  text-decoration: none;
  cursor: pointer;
  flex-shrink: 0;
}
.logoMain {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--ink-900);
}
.logoSub {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.8125rem;
  color: var(--ink-400);
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.navLink {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink-600);
  padding: 6px 16px;
  border-radius: 20px;
  text-decoration: none;
  cursor: pointer;
  background: transparent;
  border: none;
  transition: color var(--transition-fast), background var(--transition-fast);
}
.navLink:hover { color: var(--ink-900); }
.navLinkActive {
  color: var(--gold-700);
  background: var(--gold-50);
}

.right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.avatarBtn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gold-500);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  transition: background var(--transition-fast);
}
.avatarBtn:hover { background: var(--gold-600); }

.iconBtn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-400);
  transition: color var(--transition-fast), background var(--transition-fast);
}
.iconBtn:hover { color: var(--ink-800); background: var(--bg-parchment-dark); }

.aiBadge {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--gold-700);
  background: var(--gold-50);
  border: 1px solid var(--gold-300);
  border-radius: 4px;
  padding: 2px 6px;
}

/* Dark mode */
[data-theme="dark"] .navbar {
  background: rgba(20, 18, 16, 0.92);
  border-bottom-color: rgba(255, 255, 255, 0.06);
}
[data-theme="dark"] .navLinkActive { background: rgba(229, 188, 74, 0.1); }
```

- [ ] **Step 3: Replace BottomNav.module.css**

```css
/* BottomNav.module.css */
.bottomNav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--bg-parchment-light);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: 0 var(--space-sm);
  padding-bottom: env(safe-area-inset-bottom);
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
  padding: 6px 4px;
  cursor: pointer;
  background: none;
  border: none;
  min-height: 44px;
  justify-content: center;
}
.tabIcon { font-size: 1.25rem; color: var(--ink-400); transition: color var(--transition-fast); }
.tabLabel { font-family: var(--font-body); font-size: 0.5rem; color: var(--ink-400); font-weight: 500; transition: color var(--transition-fast); }

.tabActive .tabIcon  { color: var(--gold-500); }
.tabActive .tabLabel { color: var(--gold-700); }

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 48;
  animation: fadeIn 200ms ease-out;
}

.drawer {
  position: fixed;
  bottom: 56px;
  left: var(--space-md);
  right: var(--space-md);
  background: var(--bg-parchment-light);
  border: 1px solid var(--ink-200);
  border-radius: 12px 12px 0 0;
  z-index: 49;
  overflow: hidden;
  animation: slideInFromBottom 250ms ease-out;
}

.drawerItem {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  font-family: var(--font-body);
  font-size: 0.9375rem;
  color: var(--ink-800);
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  min-height: 48px;
  transition: background var(--transition-fast);
}
.drawerItem:hover { background: var(--gold-50); color: var(--gold-700); }
.drawerItem:last-child { border-bottom: none; }

[data-theme="dark"] .bottomNav { background: var(--bg-parchment-light); border-top-color: rgba(255,255,255,0.06); }
[data-theme="dark"] .drawer { background: var(--bg-parchment-light); border-color: rgba(255,255,255,0.1); }
```

- [ ] **Step 4: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/components/NavBar.module.css src/components/BottomNav.module.css
git commit -m "feat: redesign Navbar + BottomNav styles"
```

---

### Task 10: Dark Mode Toggle in EinstellungenModal
**Can run in parallel with Tasks 2–9 after Task 1.**

**Files:**
- Modify: `src/components/EinstellungenModal.jsx`
- Modify: `src/components/EinstellungenModal.module.css`

- [ ] **Step 1: Read current EinstellungenModal.jsx**
```bash
cat /Users/sadanakb/eloquent/src/components/EinstellungenModal.jsx
```

- [ ] **Step 2: Add dark mode state + toggle UI to EinstellungenModal.jsx**

Add at the top of the component function body:
```jsx
const [theme, setTheme] = React.useState(
  document.documentElement.dataset.theme || 'light'
);

const toggleTheme = () => {
  const next = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
  setTheme(next);
};
```

Add this UI block near the top of the modal content (before API key settings):
```jsx
<div className={styles.settingRow}>
  <div className={styles.settingLabel}>
    <span className={styles.settingTitle}>Erscheinungsbild</span>
    <span className={styles.settingDesc}>Hell oder dunkel</span>
  </div>
  <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Erscheinungsbild wechseln">
    {theme === 'dark' ? '☀' : '☾'}
    <span>{theme === 'dark' ? 'Hell' : 'Dunkel'}</span>
  </button>
</div>
```

- [ ] **Step 3: Add CSS for the new toggle (append to EinstellungenModal.module.css)**
```css
.settingRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--ink-200);
}
.settingLabel { display: flex; flex-direction: column; gap: 2px; }
.settingTitle { font-family: var(--font-body); font-size: 0.9375rem; color: var(--ink-900); font-weight: 500; }
.settingDesc { font-size: var(--text-small); color: var(--ink-400); }
.themeToggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1.5px solid var(--ink-200);
  background: transparent;
  color: var(--ink-800);
  font-size: var(--text-small);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.themeToggle:hover { border-color: var(--gold-300); color: var(--gold-700); background: var(--gold-50); }
```

- [ ] **Step 4: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/components/EinstellungenModal.jsx src/components/EinstellungenModal.module.css
git commit -m "feat: add dark mode toggle to EinstellungenModal"
```

---

## PHASE 2 — Pages (all parallel after Phase 1 committed)

> Tasks 11–20 are independent. Run them simultaneously via subagent-driven-development.
> Each page agent must read the current page file first, then apply the design spec.
> Spec reference: `docs/superpowers/specs/2026-03-22-eloquent-design-overhaul.md` Section 10.

---

### Task 11: HeroPage (`/`)

**Files:**
- Modify: `src/pages/HeroPage.jsx`
- Modify: `src/pages/HeroPage.module.css`

**Design spec:** Section 10.1 of spec. Key elements:
- Letter-reveal animation on "ELOQUENT" (split into `<span>` per character)
- OrnamentDivider above + below hero title
- 2 main action cards (CrossedFeathers + GlobeNetwork icons)
- 3 secondary mode cards (Bullseye, OpenBook, StarIcon)
- Featured Card for Tages-Challenge with Wort des Tages inside
- Quick-links footer row

- [ ] **Step 1: Read current HeroPage.jsx and HeroPage.module.css**
```bash
cat /Users/sadanakb/eloquent/src/pages/HeroPage.jsx
cat /Users/sadanakb/eloquent/src/pages/HeroPage.module.css
```

- [ ] **Step 2: Rewrite HeroPage.jsx** — preserve all existing onClick handlers/navigation, replace visual structure.

Key structural changes:
```jsx
// Letter-reveal hero
<h1 className={styles.heroTitle}>
  {"ELOQUENT".split("").map((char, i) => (
    <span key={i} className={styles.letter} style={{ animationDelay: `${i * 0.06}s` }}>
      {char === " " ? "\u00A0" : char}
    </span>
  ))}
</h1>
```

- [ ] **Step 3: Rewrite HeroPage.module.css** with new design tokens

- [ ] **Step 4: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/pages/HeroPage.jsx src/pages/HeroPage.module.css
git commit -m "feat: redesign HeroPage — letter reveal, action cards, daily challenge"
```

---

### Task 12: DuellPage (`/duell`)

**Files:**
- Modify: `src/pages/DuellPage.jsx`
- Modify: `src/pages/DuellPage.module.css`

**Design spec:** Section 10.2. Key elements:
- Two name inputs side by side + BoltIcon VS indicator
- "Weiter" button disabled until both fields filled
- Mobile: inputs stacked vertically

- [ ] **Step 1: Read current files**
```bash
cat /Users/sadanakb/eloquent/src/pages/DuellPage.jsx
cat /Users/sadanakb/eloquent/src/pages/DuellPage.module.css
```
- [ ] **Step 2: Rewrite JSX + CSS** — preserve all game logic/state, replace visual layer
- [ ] **Step 3: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/pages/DuellPage.jsx src/pages/DuellPage.module.css
git commit -m "feat: redesign DuellPage — side-by-side inputs, disabled state"
```

---

### Task 13: OnlineDuellPage (`/online`)

**Files:**
- Modify: `src/pages/OnlineDuellPage.jsx`
- Modify: `src/pages/OnlineDuellPage.module.css`

**Design spec:** Section 10.3. Key elements:
- Quick Match card: primary button → on click: searchPulse animation, text → "Suche läuft..."
- Friend challenge card: secondary "Code erstellen" + tertiary "Code eingeben" in one card with "oder" divider

- [ ] **Step 1: Read current files**
```bash
cat /Users/sadanakb/eloquent/src/pages/OnlineDuellPage.jsx
cat /Users/sadanakb/eloquent/src/pages/OnlineDuellPage.module.css
```
- [ ] **Step 2: Rewrite JSX + CSS** — preserve Supabase logic
- [ ] **Step 3: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/pages/OnlineDuellPage.jsx src/pages/OnlineDuellPage.module.css
git commit -m "feat: redesign OnlineDuellPage — quick match pulse, friend challenge card"
```

---

### Task 14: WoerterbuchPage (`/woerterbuch`)

**Files:**
- Modify: `src/pages/WoerterbuchPage.jsx`
- Modify: `src/pages/WoerterbuchPage.module.css`

**Design spec:** Section 10.4. Key elements:
- Featured card for Wort des Tages (goldPulse on load)
- SearchIcon in search bar, gold focus ring
- Category chips: `overflow-x: auto`, active = gold filled
- Word entries: stagger fadeIn, hover → left gold border

- [ ] **Step 1: Read current files**
```bash
cat /Users/sadanakb/eloquent/src/pages/WoerterbuchPage.jsx
cat /Users/sadanakb/eloquent/src/pages/WoerterbuchPage.module.css
```
- [ ] **Step 2: Rewrite JSX + CSS** — preserve filter/search logic
- [ ] **Step 3: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/pages/WoerterbuchPage.jsx src/pages/WoerterbuchPage.module.css
git commit -m "feat: redesign WoerterbuchPage — featured word, chip filters, stagger"
```

---

### Task 15: ProfilePage (`/profil`)

**Files:**
- Modify: `src/pages/ProfilePage.jsx`
- Modify: `src/pages/ProfilePage.module.css`

**Design spec:** Section 10.5. Key elements:
- ShieldIcon avatar, Cormorant username, rank badge + Elo in mono
- Stats: 4-col desktop / 2×2 mobile grid, large Cormorant numbers
- XP bar: progressFill animation on mount
- Match history: color-coded left border

- [ ] **Step 1: Read current files**
```bash
cat /Users/sadanakb/eloquent/src/pages/ProfilePage.jsx
cat /Users/sadanakb/eloquent/src/pages/ProfilePage.module.css
```
- [ ] **Step 2: Rewrite JSX + CSS** — preserve Supabase data fetching
- [ ] **Step 3: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/pages/ProfilePage.jsx src/pages/ProfilePage.module.css
git commit -m "feat: redesign ProfilePage — stats grid, XP animation, match history"
```

---

### Task 16: UebungPage (`/uebung`)

**Files:**
- Modify: `src/pages/UebungPage.jsx`
- Modify: `src/pages/UebungPage.module.css`

**Design spec:** Section 10.6. Key elements:
- Streak strip (7 day pills)
- Desktop 2-col: task card (1fr) + skill sidebar (200px)
- Task card: chips + ONE question + textarea + button
- Mobile: skill sidebar as collapsible `<details>` strip

- [ ] **Step 1: Read current files**
```bash
cat /Users/sadanakb/eloquent/src/pages/UebungPage.jsx
cat /Users/sadanakb/eloquent/src/pages/UebungPage.module.css
```
- [ ] **Step 2: Rewrite JSX + CSS** — preserve scoring/submission logic
- [ ] **Step 3: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/pages/UebungPage.jsx src/pages/UebungPage.module.css
git commit -m "feat: redesign UebungPage — streak strip, task+skill layout"
```

---

### Task 17: StoryPage + Story Subcomponents (`/story`)

**Files:**
- Modify: `src/pages/StoryPage.jsx` + `StoryPage.module.css`
- Modify: `src/components/story/BossFight.jsx` + `.module.css`
- Modify: `src/components/story/CharacterSelect.jsx` + `.module.css`
- Modify: `src/components/story/FillBlankChallenge.jsx` + `.module.css`
- Modify: `src/components/story/FreeTextChallenge.jsx` + `.module.css`
- Modify: `src/components/story/MultipleChoiceChallenge.jsx` + `.module.css`
- Modify: `src/components/story/StoryDecision.jsx` + `.module.css`
- Modify: `src/components/story/WordOrderChallenge.jsx` + `.module.css`

**Design spec:** Section 10.7. Key elements:
- Chapter header: atmospheric gradient + chapter dots
- Scene card: setting label + blockquote dialog + task box
- Choice buttons: letter pill + full sentence text
- Reputation progress bar

- [ ] **Step 1: Read StoryPage.jsx and all 7 subcomponent files**
- [ ] **Step 2: Rewrite StoryPage.jsx + StoryPage.module.css** — preserve all game logic
- [ ] **Step 3: Update all 7 story subcomponents** — apply design tokens, new Card/Button/Badge components
- [ ] **Step 4: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/pages/StoryPage.jsx src/pages/StoryPage.module.css src/components/story/
git commit -m "feat: redesign StoryPage + all story subcomponents"
```

---

### Task 18: RanglistePage (`/rangliste`)

**Files:**
- Modify: `src/pages/RanglistePage.jsx`
- Modify: `src/pages/RanglistePage.module.css`

**Design spec:** Section 10.8. Key elements:
- Podium: top 3 with stepped block heights, #1 gets CrownIcon + gold glow
- Mobile podium: halved heights, smaller avatars (40px)
- Filter tabs: Global / Freunde / Diese Woche
- Own rank sticky at bottom with dashed border + "Noch X Plätze" CTA

- [ ] **Step 1: Read current files**
- [ ] **Step 2: Rewrite JSX + CSS** — preserve Supabase data
- [ ] **Step 3: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/pages/RanglistePage.jsx src/pages/RanglistePage.module.css
git commit -m "feat: redesign RanglistePage — podium, filters, sticky own rank"
```

---

### Task 19: AchievementPage (`/achievements`)

**Files:**
- Modify: `src/pages/AchievementPage.jsx`
- Modify: `src/pages/AchievementPage.module.css`

**Design spec:** Section 10.9. Key elements:
- Hero: last unlocked badge (large) + X/29 counter + progress bar
- "Fast geschafft" banner: green accent + bar + CTA button
- Badge grid: 5-col desktop / 3-col ≤480px / 2-col ≤360px
- Locked: `filter: grayscale(1) opacity(0.5)`, `title` tooltip

- [ ] **Step 1: Read current files**
- [ ] **Step 2: Rewrite JSX + CSS**
- [ ] **Step 3: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/pages/AchievementPage.jsx src/pages/AchievementPage.module.css
git commit -m "feat: redesign AchievementPage — hero unlock, close-call banner, grid"
```

---

### Task 20: RegelnPage (`/regeln`)

**Files:**
- Modify: `src/pages/RegelnPage.jsx`
- Modify: `src/pages/RegelnPage.module.css`

**Design spec:** Section 10.10. Key elements:
- OrnamentDivider header + "REGELN" in Cormorant + italic subtitle
- Tab bar (horizontal scroll, no sidebar) for 5 sections
- Blockquotes + score grid (4-col desktop / 2-col mobile)

- [ ] **Step 1: Read current files**
- [ ] **Step 2: Rewrite JSX + CSS**
- [ ] **Step 3: Build + Commit**
```bash
cd /Users/sadanakb/eloquent && npm run build
git add src/pages/RegelnPage.jsx src/pages/RegelnPage.module.css
git commit -m "feat: redesign RegelnPage — tab nav, blockquotes, score grid"
```

---

## Task 21: Final Sweep + Remaining Components

**After all page tasks committed.**

**Files:**
- Modify: All remaining components that haven't been touched yet

- [ ] **Step 1: Update token names in remaining components**

Run for each file listed below — replace any remaining old token references:
```bash
# Files to check and update token references:
# src/components/AntwortEingabe.jsx + .module.css
# src/components/AuthModal.jsx + .module.css
# src/components/BewertungDisplay.jsx + .module.css
# src/components/DailyChallenge.jsx + .module.css
# src/components/GoldBar.jsx + .module.css
# src/components/InstallPrompt.jsx + .module.css
# src/components/Logo.jsx + .module.css
# src/components/SetupWizard.jsx + .module.css
# src/components/Toast.jsx + .module.css
# src/components/PageTransition.jsx

# Check for any remaining old tokens:
grep -r "var(--bg-page)\|var(--accent-gold)\|var(--text-primary)\|var(--text-secondary)\|var(--text-muted)" \
  /Users/sadanakb/eloquent/src/ --include="*.css" -l
```

- [ ] **Step 2: For each file with old tokens**, open it and replace old → new per the migration table in spec Section 5.2. Since theme.css now has aliases, this is cosmetic but ensures the codebase is clean.

- [ ] **Step 3: Final build check**
```bash
cd /Users/sadanakb/eloquent && npm run build
```
Expected: 0 errors.

- [ ] **Step 4: Run dev server and visually check all 10 routes**
```bash
npm run dev
```
Check: `/`, `/duell`, `/online`, `/woerterbuch`, `/profil`, `/uebung`, `/story`, `/rangliste`, `/achievements`, `/regeln`

- [ ] **Step 5: Final commit**
```bash
git add -A
git commit -m "feat: complete ELOQUENT design overhaul — all 10 pages redesigned"
```

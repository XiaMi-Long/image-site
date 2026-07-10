# Design

## Theme

Dark-first, light-second. Dark mode is the default experience; light mode exists for bright-environment fallback but is not optimized.

## Color Palette

### Dark Mode (primary)

```css
--canvas: oklch(0.135 0.012 265)      /* #14161a — 最深底 */
--surface: oklch(0.175 0.015 265)     /* #1c1f24 — 卡片/表面 */
--elevated: oklch(0.21 0.018 265)     /* #23272e — 悬浮/弹窗 */
--text: oklch(0.92 0.01 265)          /* #e8eaed */
--muted: oklch(0.55 0.025 265)        /* #7a7f89 */
--border: oklch(0.24 0.018 265)       /* #2f343d */
--accent: oklch(0.64 0.155 52)        /* #e67e22 — 橙 */
--accent-hover: oklch(0.69 0.155 52)  /* #f08c33 */
```

### Light Mode (secondary)

```css
--canvas: oklch(0.95 0.005 265)       /* #f2f2f3 */
--surface: oklch(1 0 0)               /* #ffffff */
--elevated: oklch(0.97 0.005 265)     /* #f5f5f6 */
--text: oklch(0.15 0.012 265)         /* #1c1f22 */
--muted: oklch(0.5 0.02 265)          /* #6b7078 */
--border: oklch(0.87 0.01 265)        /* #d4d6da */
--accent: oklch(0.58 0.155 52)        /* #c96f1e */
--accent-hover: oklch(0.63 0.155 52)  /* #d97d2a */
```

### Usage

| Token | Where |
|-------|-------|
| canvas | Body bg, page bg |
| surface | Card, sidebar bg, dropdown bg |
| elevated | Modal bg, popover bg, hover state |
| text | Body copy, headings |
| muted | Secondary text, placeholder, metadata |
| border | Dividers, input borders, card borders |
| accent | Links, active states, buttons, badges |
| accent-hover | Button hover, link hover |

## Typography

- **Body**: `Inter`, system-ui, `PingFang SC`, `Noto Sans SC`, sans-serif
- **Monospace**: `JetBrains Mono` / `Fira Code` (for code, if needed)
- **No serif/display font**. Serif font removed from project.

### Scale

| Step | Size | Weight | Where |
|------|------|--------|-------|
| caption | 11px / 0.6875rem | 400 | Badge, metadata, timestamps |
| label | 12px / 0.75rem | 500 | Button text, tab label, small UI |
| body | 14px / 0.875rem | 400 | Paragraphs, descriptions |
| body-large | 16px / 1rem | 400 | Longer content, image title |
| heading-sm | 18px / 1.125rem | 600 | Card title, section heading |
| heading-md | 24px / 1.5rem | 600 | Page heading |
| heading-lg | 32px / 2rem | 700 | Page title |

No uppercase + wide tracking except for section eyebrow labels ("作品集", "搜索" etc in nav).

### Line length

Body text max 70ch.

## Spacing

Compact scale: 2px / 4px / 8px / 12px / 16px / 24px / 32px / 48px / 64px

- Grid gap: 8px
- Card padding: 12px
- Section margin: 32px
- Page padding: 24px

## Layout

### Navigation

- Full-width solid `--surface` background, always opaque
- Height: 56px (compact)
- Left: site title
- Right: nav links (作品集, 搜索, 后台), theme toggle
- No transparent/scrolled state transition

### Image Grid

- CSS masonry, gap 8px
- Column count: 2 (sm) / 3 (md) / 4 (lg) / 5 (xl)
- No card bg, no border — image fills cell directly
- Hover: scale 1.02 + shadow, overlay with resolution badge + tags
- Info overlaid at bottom-right corner, not full-height gradient

### Admin Layout

- Left sidebar (240px) + right content area
- Sidebar: darker `--canvas` bg, compact menu items
- Top bar inside content area: page title + action buttons
- Table/list rows: minimal, no alternating bg, hover highlight only

## Components

### Buttons

- `btn-primary`: filled `--accent` bg, no border, rounded 6px, height 36px, padding 16px horizontal, 14px font
- `btn-outline`: 1px `--border` border, no bg, same sizing
- `btn-danger`: red tint, same pattern
- All buttons: 150ms ease-out on bg/color transitions

### Inputs / Form

- Border-bottom style (current) → change to full border `1px solid --border`, rounded 6px
- Height 40px, padding 8px 12px
- Focus: `--accent` border
- Select, textarea: same pattern

### Modals

- `--elevated` bg, 1px `--border` border, rounded 8px
- Backdrop: `--canvas` at 60% opacity
- Padding 24px
- Close button top-right

## Animation

### Principles

- Micro-interactions only. No decorative animation.
- Transitions: 150ms–200ms ease-out. No bounce, no elastic.
- Opacity + transform only (no layout animation).
- `prefers-reduced-motion`: all transitions zero-duration.

### Specifics

| Element | Animation |
|---------|-----------|
| Image fade-in | opacity 0→1, 400ms ease-out |
| Image hover | scale 1.02, shadow 200ms |
| Button hover | bg color 150ms |
| Modal enter | opacity 0→1 + translateY(-8px), 200ms |
| Nav link active | color transition 150ms |
| Page content fade | opacity 0→1, 300ms |
| Lightbox | instant (no animation, tool priority) |

## Dark/Light Mode

- Determined by `prefers-color-scheme` + localStorage override
- `class="dark"` on `<html>` toggles light/dark
- No flash-of-wrong-theme (existing `<script>` in index.html)
- Smooth transition on body bg + text color: 300ms ease-out

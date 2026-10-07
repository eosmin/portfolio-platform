# DESIGN.md — portfolio-platform visual direction

Status: **approved by the owner on 2026-10-07** (TDD §13 step 45a). Source of truth for steps 46a–49a. The TDD stays authoritative (project `CLAUDE.md`): if the two ever disagree, record a Deviation and fix the TDD first, then this file and the code.

Inputs: `ui-ux-pro-max` recommendation (Portfolio Grid pattern, Motion-Driven style, monochrome + blue accent), adjusted by the owner's choices below. Contrast ratios were computed with the WCAG 2.x formula, not estimated.

## 1. Decisions

| Question                | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Direction               | **Minimal technical**: monochrome surfaces, one blue accent, sans for reading, mono for metadata                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Dark mode               | **Yes, system default plus a persistent toggle** (system → light → dark). The choice is stored in `localStorage` (wrapped in try/catch) and applied before first paint by a tiny inline script, so there is no flash of the wrong theme. Without JS or storage the site follows `prefers-color-scheme`. Light and dark are designed together                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Cover images            | **`next/image`** with `images.remotePatterns`. `coverImage` is an absolute http(s) URL in the api contract, so every image has a hostname and that hostname must be in the allow-list, read from the `IMAGE_HOSTS` env var (comma-separated) in `next.config.ts`; adding a CDN is configuration, not code. Hostnames are fixed per build, each image URL stays dynamic. Recommended hosting: files under `apps/site/public/images/`, referenced with the site's own absolute URL, so the only hostname to allow is the site's domain; move to Cloudinary or Vercel Blob later by adding its hostname. Next 16 refuses to optimize images from private or local IPs, so the dev setup (`http://localhost:3000/...`) needs `images.dangerouslyAllowLocalIP` enabled in development only (verify with Context7 in step 48a) |
| Markdown                | **Rendered** with `react-markdown` (exact version pinned in step 48a, own `chore(deps): add react-markdown` commit; fetch its docs with Context7 first)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Hero and header content | `name`, `headline`, `location`, `available_for` come from the api (`GET /v1/profile`, editable in the admin). Step 45b seeds test values so the design can be reviewed with realistic content; the header and footer read `name` from the same source                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## 2. Principles

1. Content first: the page is for reading projects and posts. Decoration never competes with text.
2. One accent. Blue marks what is interactive (links, primary button, focus ring). Nothing else is colored except status (danger).
3. Mono is metadata only: dates, tags, tech badges, labels. Never body text.
4. Motion explains, it does not decorate: reveal on scroll and the hero entrance only. No parallax. At most 1–2 animated elements per view.
5. Accessibility is a constraint, not a pass: AA contrast, visible focus, reduced motion, 44 px targets.

## 3. Color tokens

Semantic names only; components never use raw palette classes or hex. Defined in `app/globals.css` with `@theme`. Dark values apply under `:root[data-theme="dark"]` and, when no explicit choice is stored, under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`. The inline script in `<head>` sets `data-theme` only when the visitor has chosen one; `<html>` gets `suppressHydrationWarning`.

| Token                   | Light     | Dark      | Use                                                      |
| ----------------------- | --------- | --------- | -------------------------------------------------------- |
| `--color-bg`            | `#FAFAFA` | `#09090B` | page background                                          |
| `--color-surface`       | `#FFFFFF` | `#18181B` | cards, inputs, header                                    |
| `--color-fg`            | `#09090B` | `#FAFAFA` | primary text                                             |
| `--color-fg-muted`      | `#52525B` | `#A1A1AA` | secondary text, captions                                 |
| `--color-border`        | `#E4E4E7` | `#27272A` | card and section dividers (decorative)                   |
| `--color-border-strong` | `#71717A` | `#71717A` | input borders, anything that must be perceivable (≥ 3:1) |
| `--color-accent`        | `#1D4ED8` | `#60A5FA` | links, primary button, focus ring                        |
| `--color-on-accent`     | `#FFFFFF` | `#09090B` | text on the accent background                            |
| `--color-danger`        | `#B91C1C` | `#F87171` | errors                                                   |

Measured contrast (WCAG ratio; text needs ≥ 4.5, UI parts ≥ 3):

| Pair                         | Light | Dark  |
| ---------------------------- | ----- | ----- |
| fg on bg                     | 19.06 | 19.06 |
| fg on surface                | 19.90 | 16.97 |
| fg-muted on bg               | 7.41  | 7.76  |
| fg-muted on surface          | 7.73  | 6.91  |
| accent on bg (links)         | 6.42  | 7.83  |
| accent on surface            | 6.70  | 6.97  |
| on-accent on accent (button) | 6.70  | 7.83  |
| danger on surface            | 6.47  | 6.40  |
| border-strong on bg          | 4.63  | 4.12  |
| border-strong on surface     | 4.83  | 3.67  |

Rules: dark mode is not an inversion; accent is lighter and surfaces are tonal steps, as above. State is never color-only (errors carry text, "Expired" is a badge with text, links are underlined in body copy). Step 46a re-runs these numbers against the final CSS and fails on any pair below the table.

## 4. Typography

Both families through `next/font/google` (self-hosted at build, `display: swap`, no runtime request to Google).

| Role                     | Family             | Weights            |
| ------------------------ | ------------------ | ------------------ |
| Sans (headings and body) | **Inter**          | 400, 500, 600, 700 |
| Mono (metadata)          | **JetBrains Mono** | 400, 500           |

Scale (px, rem-based so system text scaling works):

| Token         | Size / line-height                          | Weight  | Use                         |
| ------------- | ------------------------------------------- | ------- | --------------------------- |
| `display`     | 48 → 64 (≥ 640 px) / 1.05, tracking −0.02em | 700     | hero name                   |
| `h1`          | 36 → 44 / 1.1, tracking −0.015em            | 700     | page titles                 |
| `h2`          | 24 → 28 / 1.2                               | 600     | section titles              |
| `h3`          | 18 / 1.35                                   | 600     | card titles                 |
| `body`        | 16 / 1.6                                    | 400     | text                        |
| `lead`        | 18 → 20 / 1.55                              | 400     | hero headline, intros       |
| `small`       | 14 / 1.5                                    | 400–500 | captions                    |
| `meta` (mono) | 13 / 1.4, +0.01em                           | 500     | dates, tags, badges, labels |

Long text (blog and project bodies) is capped at `max-w-[68ch]`. Tabular figures on numbers (`font-variant-numeric: tabular-nums`) in GitHub stats and dates.

## 5. Spacing, layout, shape

- Spacing on a 4 px base; sections separated by 64 px on desktop and 48 px on mobile; card padding 24 px (20 px on mobile).
- Page container `max-w-5xl` (unchanged), 16 px gutter on mobile, 24 px from 640 px, 32 px from 1024 px. Breakpoints 375 / 768 / 1024 / 1440 for review; Tailwind defaults for code.
- Radius: `--radius-sm` 6 px (badges, inputs), `--radius-md` 10 px (buttons, cards), `--radius-lg` 16 px (cover images).
- Elevation: none by default (border only). One shadow token, `--shadow-card-hover`, used on card hover. No other shadows.
- Z-index scale: header 40, skip link 100.
- Min touch target 44 × 44 px (buttons, nav links, pagination links).

## 6. Components

| Component        | Direction                                                                                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header           | Sticky, `surface` with bottom `border`, no blur. Name on the left (from profile), nav on the right; current route marked with `accent` color **and** an underline                                                                |
| Footer           | Name, social links (text + icon), mono copyright line. Fixed-height skeleton while it streams (CLS < 0.1)                                                                                                                        |
| Button           | Primary: accent fill. Secondary: surface fill + `border-strong`. Ghost: text only. All have a visible 2 px accent focus ring offset by 2 px, press feedback by background change only (no layout shift), disabled at 0.5 opacity |
| Card             | `surface`, `border`, `radius-md`. Interactive cards: border turns `accent` and `--shadow-card-hover` appears over 200 ms; no translate                                                                                           |
| Badge / tag      | Mono `meta`, `radius-sm`, `border` + transparent fill (tonal, not filled)                                                                                                                                                        |
| Input / textarea | `surface`, `border-strong`, visible label above, error text below with `danger` and an icon, `aria-describedby` wired (already in the primitive)                                                                                 |
| Pagination       | Previous / Next buttons + "Page X of Y" in mono                                                                                                                                                                                  |
| Cover image      | `next/image`, fixed `aspect-ratio` 16 / 9, `radius-lg`, `sizes` set per layout, lazy below the fold, first card priority on `/projects`                                                                                          |
| Prose (Markdown) | Headings per the type scale, 68 ch measure, code blocks in mono on `surface` with `border`, links underlined in `accent`, images `max-w-full`                                                                                    |
| Icons            | `lucide-react` (already a dependency), 20 px, stroke 1.75, one style everywhere, never emoji                                                                                                                                     |

## 7. Hero concept

Left-aligned, generous top padding. In order: mono `meta` line with location and availability (profile keys `location`, `available_for`, omitted if absent), the `display` name, the `lead` headline (max 2 lines, 60 ch), two buttons: primary "View projects", secondary "Contact me". No image, no illustration, no animated background. Entrance: the existing `Reveal` on mount (opacity + 12 px rise, 300 ms ease-out).

## 8. Motion

| Token             | Value                                                                         |
| ----------------- | ----------------------------------------------------------------------------- |
| `--duration-fast` | 150 ms (hover, press)                                                         |
| `--duration-base` | 200 ms (state changes)                                                        |
| `--duration-slow` | 300 ms (reveals)                                                              |
| `--ease-out`      | `cubic-bezier(0.16, 1, 0.3, 1)` (enter), exits are 70 % of the enter duration |

Animate `opacity` and `transform` only. Scroll reveals and the hero entrance stay on `lib/motion` and degrade with `useReducedMotion()` (already implemented). Stagger of lists: 40 ms per item. Nothing blocks input; nothing loops.

## 9. Open items for the owner

1. Real content: `name`, `headline`, `location`, `available_for` and the cover images are test data from step 45b; replace them in the admin or the seed when the real content is ready.
2. The three PNGs in `apps/site/public/images/` and the `http://localhost:3000` cover URLs of the seed are placeholders for the design review; remove them (or replace with real covers) before the Phase 14 deploy. The seed base URL is hard-coded today; make it configurable if a non-local environment ever runs the seed.
3. Production image hosting: confirm the choice recorded in §1 (own domain first, CDN later) before the Phase 14 deploy; set `IMAGE_HOSTS` accordingly.

## 10. Acceptance (step 49a)

Screenshots of `/`, `/about`, `/projects`, `/projects/[slug]`, `/blog`, `/blog/[slug]`, `/contact` and the 404 at 375, 768 and 1280 px, in light and dark; Lighthouse accessibility ≥ 95 on `/`, `/about`, `/projects`, `/blog`, `/contact`; CLS < 0.1 on `/` with a cold cache; contrast table of §3 re-measured on the built CSS; reduced-motion verified; no horizontal scroll.

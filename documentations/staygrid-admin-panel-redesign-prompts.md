# StayGrid Admin Panel — UI/UX Redesign: Phase-Wise Prompts for Gemini

## How to use this
1. Paste the **Master Context Prompt** into Gemini first, once, at the start of a session.
2. Then paste **Phase 1**, let Gemini finish and report back, review the diff yourself, then move to **Phase 2**, and so on through **Phase 7**.
3. Do the phases in order — later phases assume earlier ones are already in the codebase.
4. If a phase's output looks off, don't move to the next one — paste back what's wrong and let Gemini fix it in place first. Compounding a bad Phase 3 into Phase 4 is how you end up back here again.
5. Mobile app gets the same treatment once this is fully signed off — that's the next document, once you're ready.

## Why the plan looks like this (short version)
- Gravel-500 (`#9B9B9B`) on ivory measures ~2.6:1 contrast. WCAG AA needs 4.5:1 for body text. That's not "a bit low" — it's a hard fail, and it's the sidebar/table-header bug you're seeing.
- The fix your Gemini doc proposed — mapping muted text to charcoal-700 (`#76766E`) — measures ~4.4:1. Closer, but still just under the line for normal-sized text. It would read better than gravel-500 but wouldn't be a clean pass, especially at the 12–14px sizes used for table headers and sidebar labels.
- The `tailwind.config.js` snippet in your palette doc nests charcoal-900/700 *inside* a "gravel" object, and separately references a `--staygrid-gravel-500` CSS variable that Step 1 of that doc never actually defines. Both are real bugs, not style nitpicks — the first sets up future confusion (`text-staygridGravel-700` would silently render a dark charcoal, not grey), the second means that specific color mapping currently resolves to nothing.
- `staygridSuccess-500` / `staygridWarning-500` / `staygridDanger-500` are referenced in Step 3 of that doc but only defined as flat single tokens (no `-500` shade) in Step 2 — those classes won't resolve as written.
- Also — this project is on Tailwind v4, where theme customization moved out of `tailwind.config.js` entirely into a CSS-first `@theme` block. The config.js pattern in your doc is the v3 approach. It may partially work through v4's backward-compatibility shim, but it's not how v4 projects are meant to be configured, and mixing the two patterns is a common source of "why isn't this color applying" bugs. Phase 1 below uses the current, correct approach.

## The corrected token architecture
Two layers, never mixed:
- **Primitives** — fixed hex values, named after what they are (gold, pool-blue, charcoal-900, gravel-500, etc). Only ever referenced when defining the layer below — never used directly on a component.
- **Semantic tokens** — named after their *job* (surface, text-primary, text-muted, border, etc), each pointing at a primitive. These are what actually flip between light and dark mode, and they're the only thing components ever consume.

This is the fix for the root cause, not just the symptom. The original bug happened because someone (or some AI) reached for a raw "500" shade without checking what it would sit on. If `text-muted` is the only option a developer sees — and its definition was contrast-checked once, centrally — that mistake becomes structurally hard to repeat.

| Semantic token | Light mode | Dark mode | Verified contrast |
|---|---|---|---|
| `surface` | ivory `#FBFBF9` | gravel-950 `#1C1C1E` | — |
| `text-primary` | charcoal-900 `#3A3A3C` | ivory `#FBFBF9` | 11:1 / 16.4:1 |
| `text-muted` | charcoal-600 `#68685F` *(new)* | gravel-500 `#9B9B9B` | 5.4:1 / 6.1:1 |
| `border` | gravel-300 `#CFCFC8` | charcoal-700 `#76766E` | non-text, decorative |
| `accent-primary` | pool-blue `#0066CC` | pool-blue `#0066CC` | — |
| `accent-premium` | gold `#D4AF37` | gold `#D4AF37` | — |
| `accent-nature` | palm-green `#228B22` | palm-green `#228B22` | — |
| `success` / `warning` / `danger` | `#10B981` / `#F59E0B` / `#EF4444` | same | — |

Three notes on that table:
- `charcoal-600` doesn't exist in your current palette yet — it's a new primitive, roughly `#68685F`, one step darker than charcoal-700, added specifically so muted *text* has a value that clears 4.5:1. Keep charcoal-700 in the system too — it's fine for borders/icons/dividers (non-text only needs 3:1), just never for text again.
- gravel-500 isn't being retired. It fails badly as text on ivory (2.6:1) but passes comfortably as muted text on the dark gravel-950 background (6.1:1). Same hex, different verdict, purely because of what it sits on — which is exactly why the semantic layer matters more than any single hex value.
- Palm-green and success-green are deliberately different colors doing different jobs — palm-green is a brand/thematic color (ties to the farmhouse/outdoor concept), success-green is system feedback (booking confirmed, save succeeded). Don't let these merge into one green during implementation.

---

## Master Context Prompt
*(paste this once, at the start)*

```
You are acting as a senior product designer with 15+ years of dedicated experience in web application and admin/dashboard UI/UX — including design-system work for premium hospitality, real estate, and consumer brands. You're fluent in WCAG 2.1 AA accessibility, typography and spacing systems, and Tailwind CSS v4 implementation.

PROJECT: StayGrid, a farmhouse booking platform. You're working on the Web Admin Panel only (Next.js App Router, Tailwind CSS v4). A separate Mobile App (Expo/NativeWind) shares the brand but is OUT OF SCOPE — do not open, reference, or modify anything under the mobile app's codebase during this engagement.

THE PROBLEM: the current admin panel fails basic readability in light mode. Muted text — sidebar links, table headers, subtitles — was mapped to a grey (#9B9B9B) that measures ~2.6:1 contrast against the ivory background, well under the 4.5:1 WCAG AA requirement for body text. Dark mode is technically contrast-safe but visually flat — it isn't using the brand accent colors with any intention, so it reads as generic grayscale instead of premium.

DESIGN DIRECTION: premium, luxury-tier, restrained. Generous whitespace over density. Color used sparingly and intentionally — mostly neutral, with the three brand accents (gold, pool-blue, palm-green) reserved for moments that matter, not scattered everywhere. Soft, low-opacity elevation instead of heavy borders or hard drop shadows. A clear, deliberate typographic hierarchy rather than "everything bold or everything grey." Reference points for the target quality bar: the restraint of Linear's dashboard, the calm of a boutique hospitality back-office — not a generic admin template.

TOKEN SYSTEM: Two layers. Primitives are fixed hex values (gold #D4AF37, pool-blue #0066CC, palm-green #228B22, ivory #FBFBF9, charcoal-900 #3A3A3C, charcoal-700 #76766E, charcoal-600 #68685F, gravel-300 #CFCFC8, gravel-500 #9B9B9B, gravel-950 #1C1C1E, success #10B981, warning #F59E0B, danger #EF4444). Semantic tokens are named by job (surface, text-primary, text-muted, border, accent-primary, etc), each resolving to a primitive, and each is what actually flips between light/dark mode. Components consume semantic tokens ONLY — never a raw primitive, never a raw Tailwind color.

STANDING RULES FOR EVERY PHASE:
1. Never introduce or leave in place a raw Tailwind palette class (blue-600, zinc-500, emerald-500, indigo-400, etc) anywhere you touch.
2. Never apply a "gravel" primitive directly to text. Never apply a "charcoal" primitive to a border, divider, or background fill. If you need a new value, extend the semantic layer — don't reach around it.
3. This project uses Tailwind v4. Define tokens in the CSS-first @theme block in globals.css (as CSS custom properties, e.g. --color-staygrid-text-primary), not in tailwind.config.js. If a config.js currently holds color definitions, migrate them out as part of Phase 1 and note what you removed.
4. Before you call any phase done, contrast-check every text/background pairing you touched and report the ratios back to me in your summary.
5. At the end of each phase, give me: (a) which files you changed, (b) a plain-English list of what visually changed, (c) anything you weren't sure about and made a judgment call on.
6. Stay inside the phase's stated scope. If you notice something broken outside it, tell me instead of fixing it — I'll decide where it fits.
7. If a decision is genuinely subjective and reasonable people could land differently, make a call, apply it consistently, and explain your reasoning — don't stall the phase waiting on approval. Only pause and ask first if a change would touch a shared component used outside this phase's scope.

Confirm you've got all of this, then wait for Phase 1.
```

---

## Phase 1 — Color & contrast token system
**Fixes:** the actual readability bug, and the structural bugs in the old palette plan (undefined variable references, the gravel/charcoal naming collision, the config.js-in-a-v4-project mismatch).

```
PHASE 1 of 7 — Color & Contrast Token System

Implement the full token system from the master context as the foundation of the design system:

1. Define every primitive listed as a CSS custom property in the @theme block of globals.css.
2. Define the semantic layer on top (surface, text-primary, text-muted, border, accent-primary, accent-premium, accent-nature, success, warning, danger, plus any you find you need — e.g. a border-strong for input focus states). Each semantic token resolves to a primitive.
3. Set up the dark-mode override: find however dark mode is currently being toggled in this codebase (check for next-themes or a manual .dark class approach) and redefine the semantic tokens' values inside that existing dark scope, matching the light/dark pairs from the master context table. Don't introduce a second, competing dark-mode mechanism.
4. If tailwind.config.js currently defines any of these colors, remove them from there and confirm nothing still depends on the old config-based classes.
5. Grep the codebase for every usage of a raw Tailwind neutral (zinc-*, gray-*, slate-*) and every raw semantic-adjacent color (blue-*, indigo-*, emerald-*, amber-*, red-*) across the admin panel, and replace each with the correct semantic token based on what it's actually doing (is this text, a border, a status indicator, a button?).
6. Specifically fix: sidebar inactive links, all table headers, all subtitle/description text under page titles — these were the worst offenders.

Do NOT touch component layout, spacing, or typography sizing in this phase — colors only. Report back per the standing rules, including the contrast ratio you measured for every text color against its actual background.
```

---

## Phase 2 — Typography, spacing & elevation foundation
**Fixes:** the "everything's either bold or grey" flatness, inconsistent spacing, boxy card styling that reads generic rather than premium.

```
PHASE 2 of 7 — Typography, Spacing & Elevation Foundation

1. Audit current type usage across the admin panel — every font-size/weight/line-height combination actually in use right now, including the Inter_800ExtraBold logo treatment.
2. Consolidate into a named type scale (aim for 6–8 steps — something like display, h1, h2, h3, body, body-sm, caption — decide the exact breakdown based on what the screens actually need). Define it as tokens, not one-off classes.
3. Reserve the heaviest weight (800/ExtraBold) for very limited, high-impact use — the logo, maybe one hero metric. Section headers should read as medium/semibold (500–600), body text as regular (400). Heavy weight used everywhere is part of why this currently reads generic rather than refined — fix that as you apply the scale.
4. Audit spacing — find inconsistent one-off padding/margin values and consolidate onto a single consistent scale.
5. Define elevation tokens: 2–3 shadow levels using soft, low-opacity shadows (not heavy drop shadows) for card-at-rest / hover-or-raised / modal-or-popover, plus consistent corner-radius tokens applied uniformly across cards, buttons, inputs, and pills.
6. Apply the new type/spacing/elevation tokens to at least 2 screens as a proof of concept (Dashboard Overview and one data table screen) so I can see it working before the rest of the panel gets touched in later phases.

Report back per the standing rules, plus the specific type scale you landed on and why.
```

---

## Phase 3 — Global shell: sidebar, header, footer
**Fixes:** the sidebar contrast bug specifically, the "scale-150 image trick" logo hack, generic active-state styling.

```
PHASE 3 of 7 — Global Shell (src/app/(dashboard)/layout.tsx)

1. Sidebar navigation links: inactive state uses text-muted (now readable). Active state should be intentional, not the current flat bg-zinc-100 — use a subtle accent-primary-tinted background with accent-primary text/icon, or a left accent bar, your call, but it needs to clearly read as "brand," not "generic gray highlight."
2. Logo: review the current circular-crop implementation (mentioned as a scale-150 image trick) and replace it with a clean, non-hacky implementation — proper container sizing and object-fit rather than scaling the image to fake a crop.
3. Footer: profile badge (role label), sign-out, and theme toggle — bring onto the new token system, and make the sun/moon theme toggle transition feel deliberate rather than an instant jump-cut.
4. Nav icons: confirm one consistent icon set and sizing throughout — flag if you find mixed icon sources.
5. This is the wrapper every other screen lives inside — get it right here, since Phases 4–6 will build on top of it without revisiting it.

Report back per the standing rules.
```

---

## Phase 4 — Dashboard overview
**Fixes:** generic stat-card styling, the promo banner, empty states.

```
PHASE 4 of 7 — Dashboard Overview (page.tsx)

1. Stat cards (Total Farmhouses / Active Bookings / Owner Admins / Total End Users): move past "light border, icon top-right, bold number" into something with more visual intention — consider a soft icon backdrop using a low-opacity brand accent, refined use of the new elevation tokens, maybe a subtle per-card accent tint. Keep it restrained — these are still data-dense utility cards, not hero moments.
2. Promo banner (owner view, "Featured Listing Program"): this is a premium-upsell moment — consider leaning on gold rather than defaulting to blue, since gold is your "featured/premium" association elsewhere. Make it feel like an intentional invitation, not a generic dismissible alert bar.
3. Owner Calendar (property selector + calendar view for farmhouse owners): bring onto the new tokens, confirm it reads clearly against both light and dark surfaces.
4. Empty state (owner with no properties): refine into something that feels inviting rather than a placeholder box — this is often a new owner's first impression of the panel, worth the extra care.

Report back per the standing rules.
```

---

## Phase 5 — Data table system + rollout
**Fixes:** the uppercase-grey table header bug specifically, generic toggle/pill/action styling repeated across four screens, the react-big-calendar default look.

```
PHASE 5 of 7 — Data Table System (Farmhouses, Bookings, Users, Owners)

Farmhouses, Bookings, Users, and Owners all use close variations of the same table pattern. Design ONE refined table system and apply it consistently rather than styling each screen separately.

1. Table header row: this was one of the worst contrast offenders (uppercase, tracking-wider, gravel-500). Fix the color first (text-muted), then reconsider whether uppercase+wide-tracking is even the most premium choice here versus a cleaner sentence-case header with a subtle bottom border — your call, but justify it.
2. Row treatment: hover state, and a decision on zebra striping vs relying on whitespace/dividers instead — premium tables often skip striping entirely. Pick one and apply it everywhere.
3. Status pill component: one component, consistent padding/radius, color mapped to status (confirmed/success, cancelled/danger, pending — needs a neutral treatment, not just "gray").
4. Toggle switches (isActive / isFeatured): restyle off the default library look using accent-primary or accent-nature for the "on" state — pick one and be consistent about which toggle means what.
5. Action icons (edit/delete/tag, etc): consistent sizing and hover states. If a row currently has 3+ loose icons and looks cluttered, consider grouping into a single overflow menu — your call, flag which you chose.
6. Search bar: bring onto new tokens.
7. Apply this system to all four screens: Farmhouses (thumbnail treatment, price typography), Bookings (status pills per state, the table/calendar segmented toggle control, AND theme react-big-calendar to match the brand — override its default event colors to map to status colors, restyle its toolbar/nav buttons to match the rest of the button system, don't leave it looking like a stock calendar plugin dropped into a themed page), Users & Owners (contact/demographic columns).

Report back per the standing rules, plus a screenshot-in-words description of the table pattern you landed on before I open it myself.
```

---

## Phase 6 — Media management + modals
**Fixes:** image-heavy screens (Categories, Hero Banners), Cloudinary upload modal styling.

```
PHASE 6 of 7 — Media Management (categories/page.tsx, hero-banners/page.tsx)

1. Establish consistent thumbnail treatment: Categories (smaller, roughly square) and Hero Banners (large, landscape) should feel like the same system while staying visually distinct for their different content types — consistent radius, consistent aspect-ratio handling.
2. Cloudinary upload widgets are triggered inside modals — you can't fully restyle Cloudinary's own internal UI, but theme the modal chrome around it properly (backdrop, close affordance, container radius/shadow from the Phase 2 elevation tokens) so it doesn't feel like a foreign popup dropped into a themed page.
3. "Add New" buttons and page headers here should match the pattern established in Phases 4–5 — don't reinvent it.

Report back per the standing rules.
```

---

## Phase 7 — Dark mode pass, motion polish & final QA
**Fixes:** the "whole UI looks black and white in dark mode" complaint, inconsistent transitions, and a full sweep to catch anything the earlier phases missed.

```
PHASE 7 of 7 — Dark Mode, Motion & Final QA

1. Go through every screen touched in Phases 3–6 specifically in dark mode. Contrast is already technically fine from Phase 1 — the actual problem is that dark mode currently reads flat/monochrome because the brand accents aren't showing up with any intention. Confirm gold, pool-blue, and palm-green all still read as vivid, deliberate accent colors in dark mode — not desaturated into gray-on-gray. Primary buttons, active states, and status colors should feel exactly as "branded" in dark mode as in light.
2. Optional but recommended: for large blocks of dark-mode body text, consider a very slightly dimmed off-white instead of pure ivory — pure white/near-white text on a near-black background at high contrast can cause a glare/halation effect in extended reading; a lot of premium dark-mode products dim body text slightly for exactly this reason. Keep headings at full ivory.
3. Motion pass: hover states, the theme-toggle transition, modal/toast entrances — subtle and consistent easing and duration throughout, nothing bouncy or default-feeling.
4. Final QA sweep across the entire admin panel:
   - Re-verify contrast on every text/background pairing touched across all 6 prior phases.
   - Grep for any remaining raw Tailwind palette class (blue-, zinc-, indigo-, emerald-, amber-, red- prefixes) anywhere in the admin panel — there should be zero.
   - Confirm radius, shadow, and spacing tokens are applied consistently and no screen reverted to one-off values.
5. Give me a final summary report: what changed across the whole 7-phase arc, and anything you'd flag as worth revisiting later.
```

---

Once this is all landed and you're happy with it, bring it back here and I'll build the same phase-by-phase plan for the Mobile App — the light-mode sidebar/text issue you mentioned there is almost certainly the same gravel-500-on-ivory bug, just needs the NativeWind-specific version of this fix.

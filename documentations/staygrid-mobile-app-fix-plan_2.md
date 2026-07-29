# StayGrid Mobile App — Fix & Redesign: Phase-Wise Prompts for Gemini

## How to use this
1. Handle **Fix This First** on its own, right now, before anything else — it's blocking real bookings.
2. Then paste the **Master Context Prompt** once, at the start of the redesign work.
3. Work through **Phase 1 → 8** in order, reviewing each before moving to the next.
4. This is the companion to the admin panel plan — same brand, same token philosophy, adapted for NativeWind and for the fact that this app has real functional bugs, not just visual ones.

## What's actually going on (short version)
- Update: the SafeAreaView fix worked. Checked the actual current code (login.tsx, signup.tsx, guests.tsx, farmhouse/[id].tsx) — all four correctly import SafeAreaView from 'react-native-safe-area-context' now. The original "Couldn't find a navigation context" crash from the stack traces looks resolved. What's happening now on 24H is a different, newly-surfaced bug — see below and the updated Fix This First.
- Bigger picture on direction: premium-through-restraint was calibrated wrong for this app. Vibrant, colorful, closer to Swiggy than to a muted dashboard is the right call for a consumer app trying to make someone excited to book a getaway. The admin panel can stay in its more restrained lane — it's an internal work tool, not something a customer sees — but the mobile direction below has been rewritten around this.
- The favorites bug is written up as three small, separate issues (Home hearts don't work, Detail "needs a toast," All Farmhouses "lags"). But your own description adds the missing piece: even the Detail page's working toggle doesn't reliably show up on the Favorites tab. That points to one shared state-management bug across four screens, not four unrelated ones — Phase 5 treats it that way instead of patching each screen separately.
- "Full blue only" is almost certainly the same disease the admin panel had — one raw color doing every job instead of the brand system being used deliberately — just showing up on mobile instead of web. Worth knowing up front: NativeWind v4 configures themes differently than web Tailwind v4 despite the matching version number (real detail in the master prompt below) — porting the web project's config over as-is won't work the same way here.
- There's also a real, currently-documented NativeWind regression — styles silently dropping on RN primitives in v4.2.3 specifically, from a prop-ordering bug — worth ruling out as a contributor to "screens look wrong in ways that don't quite make sense." It's a five-minute version check, folded into Phase 1.
- The new audit covers Home, Detail, All Farmhouses, and Favorites — it doesn't mention the splash screen, login/signup, the Bookings tab, or the Profile tab, all of which exist per the earlier screen index. A first-time user's actual first experience is the splash screen and login, not the home feed — that's very likely part of why the app "feels dull" overall. Those are folded back in below (Phases 3 and 7).
- The Home screen's problem isn't just "wrong sizes," it's that the visual weight is backwards — Featured (meant to be the prominent, curated content) is the smallest thing on screen, Explore-all (meant to be an efficient way to browse everything) is the biggest. The widget above shows the inversion and the target fix.
- Aesthetic direction refined further: minimalism as the structural foundation, glassmorphism for elevated/layered surfaces (modals, the sticky booking bar), claymorphism for tactile interactive accents (primary buttons, the guest-count controls) — see the addendum at the end for the concrete technique and a worked example.

---

## Fix this first
*(the SafeAreaView crash above is confirmed resolved — this replaces it as the current live blocker)*

```
URGENT — FIX BEFORE ANYTHING ELSE: 24H/CUSTOM booking freeze (JS thread lockup)

Confirmed root cause by reading the actual current code in app/farmhouse/[id].tsx: there are two separate mechanisms both mutating startDate/endDate and both firing their own fetch() for availability — the handleDayPress callback, AND a useEffect([startDate, bookingType, showCalendar, id]) that fires right after because startDate just changed. Tapping a date (or switching to 24H) triggers both, in quick succession: two parallel fetches for the same data, redundant setState calls, and getMarkedDates() is called inline (not memoized), so RNCalendar receives a brand-new object reference on every one of these cascading re-renders even when the dates haven't changed. RNCalendar is a heavy component — repeated unnecessary re-renders in a tight burst are what's freezing the JS thread and swallowing touch input.

Fix, in order:
1. Split the single useEffect into two: one that ONLY syncs endDate from startDate + bookingType (no fetch), and a second that ONLY fetches availability (with a cancellation guard so a stale response can't overwrite a newer one).
2. Make handleDayPress a pure state setter — remove its fetch() call and its own endDate calculation entirely. The two effects above now own that.
3. Wrap the markedDates calculation in useMemo([startDate, endDate]) so RNCalendar only gets a new object when the actual dates change, not on every render.

The exact corrected code for all three is in this conversation — copy it in directly rather than re-deriving it, and remove the old getMarkedDates function and the old handleDayPress body it replaces.

After the fix, reproduce by rapidly tapping between 12H, 24H, and CUSTOM and tapping several calendar dates in quick succession — the freeze should be gone under rapid interaction, not just on a single careful test.
```

---


## The corrected token architecture
Same brand, same primitive/semantic split as the admin panel — see that document for the full reasoning. Quick reference:

| Semantic token | Light mode | Dark mode |
|---|---|---|
| `surface` | ivory `#FBFBF9` | gravel-950 `#1C1C1E` |
| `text-primary` | charcoal-900 `#3A3A3C` | ivory `#FBFBF9` |
| `text-muted` | charcoal-600 `#68685F` | gravel-500 `#9B9B9B` |
| `border` | gravel-300 `#CFCFC8` | charcoal-700 `#76766E` |
| `accent-primary` | pool-blue `#0066CC` | pool-blue `#0066CC` |
| `accent-premium` | gold `#D4AF37` | gold `#D4AF37` |
| `accent-nature` | palm-green `#228B22` | palm-green `#228B22` |
| `success` / `warning` / `danger` | `#10B981` / `#F59E0B` / `#EF4444` | same |

The one thing that's genuinely different from the admin panel: **how** these get implemented. Web Tailwind v4 uses a CSS-first `@theme` block. NativeWind v4 (what this app is actually on) is still config-based — `tailwind.config.js` + `theme.extend.colors` pointing at CSS custom properties, combined with the `vars()` helper from the `nativewind` package to define light/dark sets, switched via `useColorScheme()`/`colorScheme.set()`. Same version number, different mechanism — that's called out explicitly in the master prompt so Gemini doesn't try to copy-paste the web project's config.

---

## Master Context Prompt
*(paste this once, after the crash fix, at the start of the redesign work)*

```
You are acting as a senior product designer with 15+ years of dedicated experience in mobile app UI/UX — consumer apps, booking and marketplace flows, premium hospitality and travel products — combined with hands-on fluency in React Native, Expo, and NativeWind implementation. You debug real functional issues as carefully as you make design decisions; you don't guess at root causes or accept "clearing the cache fixed it" as an explanation.

PROJECT: StayGrid, a farmhouse booking platform. You're working on the Mobile App only (Expo, Expo Router, NativeWind v4, Zustand, React Query, lucide-react-native). The Web Admin Panel (Next.js/Tailwind v4) shares the brand but is OUT OF SCOPE — do not open or modify anything under the admin panel's codebase during this engagement.

THE PROBLEM, two kinds:
(1) Functional — favorites don't reliably work (unwired on some screens, don't sync to the Favorites tab even when toggled elsewhere), and selecting a 24-hour booking crashes the app (handled separately, before this sequence starts).
(2) Visual — the app currently reads as "full blue" with no real hierarchy, several screens (splash, login, browse) feel dull and generic rather than trustworthy, and the Home screen's visual weight is backwards: curated Featured cards are small, Explore-all cards are oversized, so users scroll past a wall of big cards instead of being drawn toward the curated picks.

DESIGN DIRECTION: vibrant, colorful, and alive — not restrained. Direct product feedback on this: it should feel closer to Swiggy than to a muted admin dashboard. Use the full brand palette confidently — gold, pool-blue, and palm-green should all carry real visual weight across buttons, category tags, badges, and section accents, not just occasional restrained highlights. Backgrounds should not default to plain white/ivory everywhere — bring in color and warmth throughout. At the same time this still needs to work for a first-time user with zero patience: one obvious primary action per screen, minimal choices, generous tap targets, a clear visual hierarchy. Vibrant and easy-to-use are not in tension — Swiggy itself proves that. If someone can't immediately tell what to tap next, that's the bug to fix, regardless of how good the color feels.

SURFACE TREATMENT — blend three styles the way the 60-30-10 rule blends colors, applied to structure instead: roughly 60% minimalism (the base — generous padding, restrained layout, one type family at varied weights, this is the default state of every screen), 30% glassmorphism (elevated/layered surfaces specifically — modals, the sticky booking bar, anything floating over other content — via expo-blur's BlurView plus a tinted semi-transparent surface), 10% claymorphism (tactile accents only — primary buttons, the guest-count +/- controls — soft puffy depth via a two-layer shadow technique, since RN doesn't support multi-layer box-shadow the way CSS does). Full technique breakdown and a worked example are in the addendum at the end of this document — read that before starting Phase 2.

BRAND TOKENS: primitives — gold #D4AF37, pool-blue #0066CC, palm-green #228B22, ivory #FBFBF9, charcoal-900 #3A3A3C, charcoal-700 #76766E, charcoal-600 #68685F, gravel-300 #CFCFC8, gravel-500 #9B9B9B, gravel-950 #1C1C1E, success #10B981, warning #F59E0B, danger #EF4444. Semantic tokens on top: surface, text-primary, text-muted, border, accent-primary, accent-premium, accent-nature, success, warning, danger — same light/dark mapping as the admin panel. Components consume semantic tokens only, never a raw primitive, never a raw Tailwind/NativeWind color.

IMPORTANT — NativeWind v4 is not the same theming mechanism as Tailwind v4 on the web, despite the matching version number. Web Tailwind v4 uses a CSS-first @theme block. NativeWind v4 still uses tailwind.config.js with theme.extend.colors referencing CSS custom properties, combined with the vars() helper from the nativewind package to define light/dark variable sets, and useColorScheme()/colorScheme.set() from nativewind to switch them. Use that pattern here — don't port the web project's @theme syntax over, it will not behave the same way in this version.

STANDING RULES FOR EVERY PHASE:
1. Never introduce or leave in place a raw Tailwind/NativeWind palette class (blue-600, zinc-500, etc). Semantic tokens only.
2. Never apply a "gravel" primitive to text, never apply "charcoal" to a border or fill. Extend the semantic layer if you need something new — don't reach around it.
3. Every interactive element — buttons, icons, cards, toggles — gets a minimum 44×44pt tap target, even when the visible icon is smaller. Pad the touchable area, don't just resize the icon.
4. When you fix a bug, find the actual root cause before calling it fixed — reproduce it, get a real stack trace or logged error where possible. "It stopped happening" is not the same as "I know why it was happening."
5. Before any phase is done, report back: (a) files changed, (b) a plain-English list of what changed, functionally and visually, (c) for any bug fix specifically, what the actual root cause turned out to be, (d) anything you made a judgment call on.
6. Stay inside the phase's stated scope — flag anything you notice outside it instead of fixing it opportunistically.
7. Make reasonable subjective calls yourself and explain your reasoning rather than stalling for approval. Only pause and ask first if something would touch a shared component outside this phase's scope.
8. Several native props can't take a className at all — placeholderTextColor, a Lucide icon's color prop, ActivityIndicator's color, anything inside StyleSheet.create — and hardcoding a hex value into any of them is a bug already found in login.tsx, signup.tsx, and guests.tsx (placeholderTextColor="#9B9B9B" everywhere, ignoring dark mode entirely). Use the shared useThemeColors() hook (in the addendum) for every one of these instead of a literal hex string.

Confirm you've got this, then wait for Phase 1. (The crash fix above should already be handled separately, before this sequence starts.)
```

---

## Phase 1 — Design token system (NativeWind)
**Fixes:** the "full blue only" complaint, sets up correct light/dark theming, rules out a known dependency-version regression.

```
PHASE 1 of 8 — Design Token System (NativeWind)

1. Implement the primitive + semantic token system from the master context using NativeWind v4's actual mechanism: tailwind.config.js theme.extend.colors pointing at CSS custom properties, plus light/dark variable sets defined via vars() from the nativewind package.
2. Wire the theme toggle via useColorScheme()/colorScheme.set() from nativewind, and confirm it switches every semantic token, not just a subset.
3. Grep the entire mobile app for raw Tailwind/NativeWind colors (blue-*, zinc-*, gray-*, indigo-*, emerald-*, amber-*, red-*, plus any hardcoded hex in style props) and replace each with the correct semantic token. This is almost certainly the source of the "everything is blue" complaint — a single raw blue very likely doing the job of primary buttons, active states, icons, and highlights everywhere, instead of the three brand accents being used for different purposes.
4. Also run: npm list nativewind react-native-css-interop, note the versions, and cross-reference against the Expo SDK version for known compatibility issues before doing anything else — worth doing once, up front, since dependency-version style bugs can look identical to token-mapping bugs and waste time if the two get confused.
5. Do NOT touch layout, spacing, or component structure in this phase — colors and the theming mechanism only.
6. This phase should make the app visibly more colorful, not just correctly tokenized. If gold and palm-green were barely used before, they should be clearly and confidently present after this phase — category tags, section accents, badges — not just technically available as tokens nobody calls.

Report back per the standing rules, including the exact installed versions from step 4.
```

---

## Phase 2 — Typography, spacing, touch targets & elevation
**Fixes:** inconsistent type/spacing, undersized tap targets, flat/generic card styling.

```
PHASE 2 of 8 — Typography, Spacing, Touch Targets & Elevation

1. Audit current type usage across the app and consolidate into a named scale (display, h1, h2, body, body-sm, caption — adjust to what the screens actually need).
2. Audit spacing and consolidate onto one consistent scale.
3. Audit every tappable element in the app — buttons, icons, list rows, tab bar items, and specifically the favorite hearts — and confirm each has at least a 44×44pt touch target, padding the touchable area where the visible element is smaller. This matters as much as visual polish; undersized tap targets are exactly the kind of thing that makes an app feel untrustworthy on a small screen.
4. Define elevation tokens (soft, low-opacity shadows for card-at-rest / raised / modal states) and consistent corner-radius tokens, applied uniformly.
5. Apply the new scale to Home as a proof of concept before the rest of the app is touched in later phases.

Report back per the standing rules.
```

---

## Phase 3 — Splash screen & auth
**Fixes:** "no proper splash screen," the login/signup input contrast bug, unclear OTP delivery.

```
PHASE 3 of 8 — Splash Screen & Auth (login.tsx, signup.tsx)

1. Splash screen: confirmed right now to be a static black screen with just the logo — no animation, no motion. Build this as a real branded moment rather than polishing what's there — wire up the Lottie animation (assets/splash.json) if it exists but isn't playing, or build one if it was never actually connected. Also check for a flash of the wrong background color between the native splash and the first React-rendered frame, and fix that at the native config level (expo-system-ui / splash background) rather than only in the React tree. Per the design direction above, also use a loading state elsewhere in the app that echoes this same branded splash instead of a generic spinner.
2. Landing screen (before login/signup): the "New user? Please Sign Up" button currently has invisible text — same family of low-contrast bug as everywhere else, fix with the corrected tokens. This screen and the login screen both read flat and low-energy right now — bring in real color here per the new design direction, not white/ivory-with-black-text throughout.
3. Login/signup inputs, two separate issues: (a) borders and placeholders currently use gravel-300/500, low-contrast against ivory — move to corrected tokens; (b) the input fields visibly resize as the user types — reported as fields growing and shrinking, text shifting up and down. Find what's driving that (likely a label, helper-text, or error element whose presence is changing the input's computed height, or a focus/border transition that shifts layout instead of just recoloring) and make input height and position fully stable regardless of content or focus state.
4. OTP flow: OTP is delivered via WhatsApp through Twilio, not SMS. Make sure the UI actually tells the user to check WhatsApp specifically, not a generic "check your messages" — and design a clear fallback message for a user without WhatsApp installed, since that's currently a real dead end.
5. This is a new user's actual first impression of the app — treat it with the same care as the booking flow. Simple, obviously branded, colorful, nothing to figure out.

Report back per the standing rules.
```

---

## Phase 4 — Browse screens: Home & All Farmhouses
**Fixes:** the Home card-hierarchy inversion, missing favorite onPress handlers, the All Farmhouses margin/card review.

```
PHASE 4 of 8 — Browse Screens (home.tsx, farmhouse/all.tsx)

1. Home card hierarchy: Featured cards are currently small (w-72 h-44) and Explore-all cards are oversized (w-full h-64) — the visual weight is backwards from the content intent. Featured should read as the prominent, curated content; Explore-all should read as an efficient, scannable list, not a second hero section. Rebalance so Featured is visually the star and Explore-all is compact enough that users aren't scrolling past giant cards to browse.
2. Wire up the missing onPress handlers on the favorite heart icons on both the Home screen's cards (horizontal and vertical) and the All Farmhouses cards. Just connect the tap handler to the store correctly here — Phase 5 covers the deeper sync bug, don't debug that in this phase.
3. Farmhouse cards on All Farmhouses currently render with the image area completely blank — an empty white box, no photo. Find why in the shared FarmhouseCard component (broken image URL handling, a missing loading/fallback state, or the image prop not reaching the component) — this almost certainly affects Favorites too if it uses the same card component, so confirm that once it's fixed here rather than treating it as a separate bug later.
4. All Farmhouses: the FlatList padding was already reduced from padding:24 to paddingHorizontal:16 — confirm the FarmhouseCard component itself renders wide and balanced at that new padding rather than looking cramped or oddly proportioned, and adjust card internals if needed.
5. Category pills on Home and the filter row on All Farmhouses currently look like an afterthought — bring real design intention here. Look at how Swiggy treats its food categories: distinct icons, confident color per category, feels inviting rather than purely functional. Give categories real visual identity within the brand palette instead of uniform muted gray.

Report back per the standing rules.
```

---

## Phase 5 — Favorites state management (cross-cutting)
**Fixes:** the actual favorites sync bug, treated as one root cause across four screens instead of four separate patches.

```
PHASE 5 of 8 — Favorites State Management (cross-cutting)

This is a state management audit, not a per-screen visual fix. The symptom reports are: heart icons on Home cards don't work at all, the Detail screen's heart is wired to useFavoriteStore but toggling it doesn't reliably show up on the Favorites screen, and the All Farmhouses screen's favorite state "sometimes lags."

These are very likely the same root cause showing up differently on four screens, not four separate bugs. Investigate the Zustand store itself before touching any individual screen:
1. Is the store persisted (e.g. via Zustand's persist middleware + AsyncStorage)? If not, and the Favorites tab is reading a different snapshot than what Home/Detail wrote to, that alone explains "toggled here, doesn't show up there."
2. Are components subscribing to the store correctly — any selectors pulling the entire store state instead of the specific slice needed (a common cause of "reactivity lags"), and is anything memoized in a way that's capturing a stale closure over the favorite IDs?
3. Confirm there's exactly ONE source of truth for "is this farmhouse favorited" that Home, Detail, All Farmhouses, and the Favorites screen all read from and write to identically. If any screen derives favorite status from a separately-fetched React Query list instead of the Zustand store directly, that mismatch is a strong candidate for the bug.
4. Once the sync issue is actually fixed — confirmed by toggling from three different screens and checking the Favorites tab updates immediately every time, not just usually — add the toast/feedback notification on toggle, and fix the abrupt removal transition on the Favorites screen (LayoutAnimation or an equivalent exit animation).
5. Confirm the blank farmhouse-image bug fixed in Phase 4 also resolves on this screen — if Favorites uses the same FarmhouseCard component, verify rather than assuming.

Report back per the standing rules, and specifically name the actual root cause you found, not just which screens you touched.
```

---

## Phase 6 — Detail & checkout/booking flow
**Fixes:** confirms the crash fix holds, brings the booking flow onto the new system, addresses payment dead ends.

```
PHASE 6 of 8 — Farmhouse Detail & Checkout ([id].tsx, checkout/*)

1. Confirm the crash fix from the standalone prompt holds on this screen (24H selection) as well as on the login screen (OTP) — both need to be clear, not just one.
2. Sticky bottom bar overlap: the sticky "Book Now"/pricing bar currently overlaps the scrollable content above it — an amenity row and the booking-amount row both get visually cut into by the bar. Give the scrollable content enough bottom padding to clear the bar's actual rendered height, and confirm that holds regardless of how much content a given farmhouse has.
3. The Book Now button and the Show all reviews button are both currently too thin. Bring both up to a normal, confident button size consistent with the type/spacing scale from Phase 2 — Book Now especially should be unmistakably the primary action on this screen.
4. Amenity capsules (Features & Entertainment) currently resize awkwardly depending on label length. Give them a fixed, comfortable minimum size regardless of text length instead of shrinking to fit.
5. Reviews section shows "4.8, based on 124 reviews" but the button below reads "Show all 1 reviews" — that count is wrong somewhere. Find where it's being read from and fix the mismatch.
6. Quick sanity check, not necessarily a bug: at least one listing prices 24 Hours lower than 12 Hours (₹9,804 vs ₹9,901). If that's not an intentional overnight rate, flag it — if it is intentional, no action needed, just confirming it's not a data-entry mistake.
7. Guest count screen ("Who's coming?"): keep the +/- buttons, but also make the number directly tappable to type a value — nobody should have to tap a button 40 times to reach a 40-guest capacity. This screen should also support extra-guest pricing once the admin panel exposes a "max included guests" + "extra guest fee" field per farmhouse (a separate admin panel update, not part of this phase) — when that data becomes available, show a clear message here when the entered count exceeds the included max, stating the per-person extra charge before the user proceeds. Build the guest-count UI so that slots in without a rework later.
8. Checkout review screen: remove the "Room 1 / Room 2" room selection entirely — this books a whole farmhouse, not individual hotel rooms, and that selector doesn't belong in this flow. Check whether any backend field or request payload also assumes per-room booking and needs the same assumption dropped.
9. Payment: the checkout WebView loads the Razorpay checkout endpoint. Add a proper branded loading state before the WebView content appears (likely a blank flash right now), and confirm error handling exists if the WebView fails to load or payment fails.
10. Booking failure currently shows only "Booking Failed — Something went wrong," which gives nobody anything to act on. Surface the actual failure reason where the API provides one, and make sure enough detail is logged (client or server side) to debug the next failure instead of guessing at it.

Report back per the standing rules.
```

---

## Phase 7 — Bookings & profile tabs
**Fixes:** the two screens neither audit covered in any depth.

```
PHASE 7 of 8 — Bookings & Profile Tabs (bookings.tsx, profile.tsx)

Neither of these screens has been deeply audited yet — start this phase with your own quick audit of both (current layout, any obviously broken states, empty states) before applying fixes, and report what you found before proceeding.

1. Bookings: list of past/upcoming bookings with status badges — bring onto the token system (status pills should reuse whatever pattern applies to status indicators elsewhere in the app), confirm a real empty state exists for a user with no bookings yet.
2. Profile: menu for Edit Profile, Support, Logout — bring onto new tokens, confirm sign-out has a confirmation step rather than being a single accidental tap away.

Report back per the standing rules, including your initial audit findings for these two screens.
```

---

## Phase 8 — Dark mode, motion & final QA
**Fixes:** theme richness, transition polish, a full regression sweep.

```
PHASE 8 of 8 — Dark Mode, Motion & Final QA

1. Full dark-mode pass across every screen touched in Phases 3–7: confirm the brand accents (gold, pool-blue, palm-green) still read as deliberate and vivid, not desaturated to gray. Also confirm the native chrome — status bar style/color and splash background — actually matches the active theme, not just the in-app components. That layer is the easiest to forget and causes a flash of the wrong theme on launch or on theme switch.
2. Motion pass: favorite toggle animation, tab transitions, the Favorites screen's removal animation from Phase 5, pull-to-refresh if present — subtle and consistent, nothing that feels default or bouncy.
3. Final QA sweep:
   - Re-test the calendar freeze fix specifically: rapidly switch between 12H/24H/CUSTOM and tap several dates in quick succession, not just one careful pass.
   - Re-test favorites from all four touchpoints (Home, Detail, All Farmhouses, Favorites tab) to confirm the sync fix holds under repeated toggling, and confirm farmhouse images render on every card everywhere, not just some screens.
   - Confirm the Phase 6 checkout fixes hold: no room selector anywhere in the flow, booking failures show a real reason, sticky bar no longer overlaps content on a farmhouse with a long amenities list.
   - Grep for any remaining raw Tailwind/NativeWind color class anywhere in the app — there should be zero. Also grep for any hardcoded hex string passed to placeholderTextColor, a Lucide icon's color prop, or inside a StyleSheet.create block — those should all be reading from useThemeColors() instead.
   - Confirm every tappable element still meets the 44×44pt minimum after all the visual changes.
4. Final summary report: what changed across the full 8-phase arc plus the standalone crash fix, and anything worth flagging for a future pass.
```

---

## Addendum — Surface treatment: minimalism / glassmorphism / claymorphism
Read this before Phase 2, since elevation and the shared color hook both depend on it.

### The shared color hook (do this once, use it everywhere)
Several native props can't take a className — `placeholderTextColor`, a Lucide icon's `color` prop, `ActivityIndicator`'s `color`, anything inside `StyleSheet.create`. Hardcoding hex into any of these is exactly the bug already found in login.tsx/signup.tsx/guests.tsx (`placeholderTextColor="#9B9B9B"` everywhere, blind to dark mode). Create one hook and import it wherever a native prop needs a color:

```tsx
// lib/theme-colors.ts
import { useColorScheme } from "nativewind";

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  return {
    isDark,
    textPrimary: isDark ? "#FBFBF9" : "#3A3A3C",
    textMuted: isDark ? "#9B9B9B" : "#68685F",
    border: isDark ? "#76766E" : "#CFCFC8",
    accentPrimary: "#0066CC",
    accentPremium: "#D4AF37",
    accentNature: "#228B22",
    danger: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    // Glass surfaces: a tinted, semi-transparent version of the surface color,
    // meant to sit on top of a BlurView so content behind shows through slightly.
    glassBg: isDark ? "rgba(28,28,30,0.55)" : "rgba(251,251,249,0.55)",
    glassBorder: isDark ? "rgba(251,251,249,0.12)" : "rgba(255,255,255,0.5)",
  };
}
```

### The three techniques, translated from CSS to React Native
RN doesn't have `backdrop-filter` or multi-layer `box-shadow` the way CSS does — both need a workaround, not a direct port.

- **Minimalism (~60%, the default state of every screen)**: generous padding, one type family (already Inter) at varied weights, restrained layout. This is discipline, not a new component — it's what everything looks like when it isn't a modal or a primary button.
- **Glassmorphism (~30%, elevated/layered surfaces only — modals, the sticky booking bar, anything floating over other content)**: `expo-blur`'s `<BlurView intensity={80-90} tint="light"|"dark">` wrapping the content, layered with a semi-transparent tinted background (`glassBg`/`glassBorder` above) since blur alone can look washed out — the combination is what reads as "frosted glass." On Android, blur can look weak or costly by default; test with `experimentalBlurMethod="dimezisBlurView"` if the default looks flat, and don't nest multiple BlurViews or animate `intensity` — both hurt performance.
- **Claymorphism (~10%, tactile accents only — primary buttons, the guest-count +/- controls)**: CSS gets a puffy 3D look from two stacked box-shadows on one element; RN only gives you one shadow per view, so use two nested Views instead — an outer View carrying a soft, large-radius ambient glow shadow, wrapping an inner Pressable carrying a harder, tighter shadow in a darker shade of the button's own color (simulating the "underside"). On press, shrink the inner shadow's opacity and nudge the button down a few pixels with `translateY` — that's the "physically pressed" feel.

### Worked example (components/GuestCountModal.tsx, fully rewritten)
```tsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { X } from "lucide-react-native";
import { useThemeColors } from "../lib/theme-colors";

interface GuestCountModalProps {
  visible: boolean;
  title: string;
  initialValue: number;
  minValue?: number;
  maxValue?: number;
  onClose: () => void;
  onSave: (val: number) => void;
}

export function GuestCountModal({
  visible, title, initialValue, minValue = 0, maxValue = 50, onClose, onSave,
}: GuestCountModalProps) {
  const [val, setVal] = useState(initialValue.toString());
  const colors = useThemeColors();

  useEffect(() => {
    setVal(initialValue.toString());
  }, [initialValue, visible]);

  const handleSave = () => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      onSave(Math.max(minValue, Math.min(maxValue, num)));
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        {/* Glass panel — 30% glassmorphism, this is an elevated surface over other content */}
        <BlurView intensity={85} tint={colors.isDark ? "dark" : "light"} style={styles.blurWrap}>
          <View
            className="w-full p-6"
            style={[styles.glassPanel, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-[Inter_700Bold] text-text-primary dark:text-surface">{title}</Text>
              <TouchableOpacity onPress={onClose} className="p-1" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-text-muted font-[Inter_500Medium] mb-3">
              Enter exact count ({minValue} - {maxValue}):
            </Text>

            <View className="w-full h-14 bg-surface dark:bg-border border border-border dark:border-border rounded-xl px-4 justify-center mb-6">
              <TextInput
                className="w-full h-full text-center text-2xl font-[Inter_700Bold] text-text-primary dark:text-surface p-0"
                keyboardType="number-pad"
                value={val}
                onChangeText={(text) => setVal(text.replace(/[^0-9]/g, ""))}
                autoFocus
                selectTextOnFocus
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClose} className="flex-1 py-3.5 rounded-2xl border border-border dark:border-border items-center">
                <Text className="text-text-primary dark:text-surface font-[Inter_600SemiBold] text-sm">Cancel</Text>
              </TouchableOpacity>

              {/* Clay button — 10% claymorphism, the one tactile moment on this screen */}
              <ClayButton label="Save" onPress={handleSave} />
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

// Nested-View technique: outer = soft ambient glow, inner = harder "puffy underside"
// shadow that flattens on press. RN has no multi-layer box-shadow, so two views do the job.
function ClayButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={styles.clayGlow} className="flex-1">
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.clayInner,
          { transform: [{ translateY: pressed ? 3 : 0 }], shadowOpacity: pressed ? 0 : 0.9 },
        ]}
        className="bg-accent-primary items-center justify-center rounded-2xl py-3.5"
      >
        <Text className="text-white font-[Inter_700Bold] text-sm">{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  blurWrap: { width: "100%", maxWidth: 360, borderRadius: 28, overflow: "hidden" },
  glassPanel: { borderRadius: 28, borderWidth: 1 },
  clayGlow: {
    borderRadius: 20,
    shadowColor: "#0066CC",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  clayInner: {
    borderRadius: 20,
    shadowColor: "#00336B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 4,
  },
});
```

Apply the same pattern elsewhere: the sticky "Book Now" bar (currently a flat, 100%-opaque surface per its own code comment) is the other obvious glass candidate — swap its solid background for the BlurView + glassBg treatment above. The Book Now button itself and the guest-count +/- buttons are the other obvious clay candidates. Don't apply glass or clay to ordinary content cards, list rows, or body text — that's where the 60% minimalism stays in charge.

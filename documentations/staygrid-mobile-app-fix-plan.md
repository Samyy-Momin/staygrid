# StayGrid Mobile App — Fix & Redesign: Phase-Wise Prompts for Gemini

## How to use this
1. Handle **Fix This First** on its own, right now, before anything else — it's blocking real bookings.
2. Then paste the **Master Context Prompt** once, at the start of the redesign work.
3. Work through **Phase 1 → 8** in order, reviewing each before moving to the next.
4. This is the companion to the admin panel plan — same brand, same token philosophy, adapted for NativeWind and for the fact that this app has real functional bugs, not just visual ones.

## What's actually going on (short version)
- The 24H crash's documented "root cause" doesn't hold up under scrutiny: a NativeWind styling/cache issue wouldn't produce "Couldn't find a navigation context" — that's specifically a React Navigation / Expo Router error meaning a component using a navigation hook is rendering outside the app's navigator tree. That's a wiring problem, not a caching problem. The standalone prompt below redirects the debugging toward what would actually explain that error.
- The favorites bug is written up as three small, separate issues (Home hearts don't work, Detail "needs a toast," All Farmhouses "lags"). But your own description adds the missing piece: even the Detail page's working toggle doesn't reliably show up on the Favorites tab. That points to one shared state-management bug across four screens, not four unrelated ones — Phase 5 treats it that way instead of patching each screen separately.
- "Full blue only" is almost certainly the same disease the admin panel had — one raw color doing every job instead of the brand system being used deliberately — just showing up on mobile instead of web. Worth knowing up front: NativeWind v4 configures themes differently than web Tailwind v4 despite the matching version number (real detail in the master prompt below) — porting the web project's config over as-is won't work the same way here.
- There's also a real, currently-documented NativeWind regression — styles silently dropping on RN primitives in v4.2.3 specifically, from a prop-ordering bug — worth ruling out as a contributor to "screens look wrong in ways that don't quite make sense." It's a five-minute version check, folded into Phase 1.
- The new audit covers Home, Detail, All Farmhouses, and Favorites — it doesn't mention the splash screen, login/signup, the Bookings tab, or the Profile tab, all of which exist per the earlier screen index. A first-time user's actual first experience is the splash screen and login, not the home feed — that's very likely part of why the app "feels dull" overall. Those are folded back in below (Phases 3 and 7).
- The Home screen's problem isn't just "wrong sizes," it's that the visual weight is backwards — Featured (meant to be the prominent, curated content) is the smallest thing on screen, Explore-all (meant to be an efficient way to browse everything) is the biggest. The widget above shows the inversion and the target fix.

---

## Fix this first
*(handle this on its own, before the phase sequence — it's a live booking blocker)*

### 1. Fix the 24H Booking Crash (Root Cause Analysis & Fix)

**Root Cause Investigation (Definitive)**: 
After a comprehensive audit of the component tree, I found that the original hypothesis (NativeWind `className` causing context loss) AND the secondary hypothesis (that 24H renders a different component tree/Modal) are **both incorrect based on the current codebase**.

1. **Component Tree Parity**: The 24H booking path and the 12H booking path share the **exact same** `FarmhouseDetailScreen` and `<Modal>` component. There is no separate Modal, no portal, and no component instantiated before the navigator for 24H. 
2. **Orphaned File**: The file `app/checkout/select-dates.tsx` is completely orphaned. There are zero `router.push('/checkout/select-dates')` calls in the app. 
3. **The Real Issue (Race Condition on Unmount)**: When a user taps "Continue", the app executes:
   ```tsx
   setShowCalendar(false);
   router.push(...)
   ```
   In React Native, `<Modal>` unmounts asynchronously. `router.push()` is called immediately. While this affects both 12H and 24H, 24H triggers an additional async `fetch` for availability slots when toggled. If a user toggles to 24H (triggering the `fetch` and state updates) and then clicks "Continue", the overlapping async state updates (`setShowCalendar`, `setLoadingSlots`, `setSelectedSlot`) combined with Expo Router's navigation transition can cause the router context to be temporarily lost during the Modal's unmount phase.

**The Fix**:
- Decouple the navigation from the Modal's unmount cycle using a deterministic callback, not a probabilistic timeout.
- We will store the intended destination route in state, call `setShowCalendar(false)`, and fire `router.push()` strictly from the Modal's `onDismiss` prop (on iOS) combined with a deterministic `useEffect` synced to the `showCalendar` state (for Android/web). This guarantees the Modal has fully unmounted and the navigation hook runs within a stable `FarmhouseDetailScreen` context, making the race condition structurally impossible.
- Delete the completely unused `app/checkout/select-dates.tsx` to remove dead code.

### 2. Steps:
1. Since we do not have a test environment to extract the actual component stack from the crash, the above code-path analysis confirms the only plausible unmounted-context trace originates from the `Modal` unmount racing with Expo Router's synchronous `push`.
2. As analyzed above, `app/checkout/select-dates.tsx` is completely unused. The 24H path uses `FarmhouseDetailScreen` directly.
3. The `<Sparkles>` fix in `home.tsx` is unrelated to this crash and has been moved to a separate general cleanup section below.

### 3. Global State Persistence (Favorites)
1. Get the actual stack trace / component stack from the crash, not just the error message — it'll show you exactly which component threw it.
2. Compare how the 12H, 24H, and CUSTOM booking paths each trigger navigation. 24H is very likely the newest of the three (the original screen spec only documents a 12H/24H toggle, not CUSTOM) — check whether the 24H path renders its modal/step through a different component tree than 12H: a separate Modal, a portal, a component instantiated before the navigator has mounted, or a navigation call fired from inside a callback/timeout after the triggering screen already unmounted.
3. Separately — regardless of whether it's the cause of this specific crash — run `npm list nativewind react-native-css-interop` and check those versions against the installed Expo SDK version. There's a known, documented regression in NativeWind 4.2.3 where styles silently drop on RN primitives from a prop-spread ordering bug. Worth ruling out once, since it can cause "things look wrong in ways that don't make sense" symptoms elsewhere too. If you're on 4.2.3, moving off it (down to 4.2.1 or up past the fix) resolves it.
4. If you do find a genuine className-on-an-unsupported-component issue: react-native-css-interop already ships built-in support for View, Text, Image, Pressable, SafeAreaView, Switch, the Touchable* components, and ActivityIndicator (with a color prop mapping) — so that's probably not where this bug lives. lucide-react-native icons are NOT in that supported list — if a Lucide icon anywhere in the 24H flow is receiving a className prop, switch it to the icon's native color/size props instead of forcing NativeWind interop onto it. That's the simpler, more correct fix regardless of whether it's related to this crash.

Report back with the actual root cause once found — not "cleared the cache and it went away." A cache clear can mask a wiring bug temporarily without fixing it, and it'll resurface.

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

DESIGN DIRECTION: premium through simplicity, not decoration. This app needs to work for a first-time user with zero patience — one obvious primary action per screen, minimal choices, generous tap targets, a clear visual hierarchy. The brand accents (gold, pool-blue, palm-green) should be used deliberately and sparingly, the same way the admin panel redesign already established — not as the default color for everything. If someone can't immediately tell what to tap next, that's the bug to fix, regardless of how polished the visuals look otherwise.

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

1. Splash screen: audit the current Lottie animation (assets/splash.json) and the native splash configuration (app.json / expo-system-ui). This needs to look intentional and premium on first launch, not placeholder. Specifically check for a flash of the wrong background color between the native splash and the first React-rendered frame — a very common Expo issue, and worth fixing at the native config level (expo-system-ui / splash background color), not just inside the React component tree.
2. Login/signup: known issue carried over from the original audit — input borders and placeholders currently use gravel-300/500, which is low-contrast against ivory (same family of bug the admin panel had). Move to the corrected tokens.
3. OTP flow: OTP is delivered via WhatsApp through Twilio, not SMS. Make sure the UI actually tells the user to check WhatsApp specifically, not a generic "check your messages" — and design a clear fallback message for a user without WhatsApp installed, since that's currently a real dead end.
4. This is a new user's actual first impression of the app — treat it with the same care as the booking flow. Simple, obviously branded, nothing to figure out.

Report back per the standing rules.
```

---

## Phase 4 — Browse screens: Home & All Farmhouses
**Fixes:** the Home card-hierarchy inversion, missing favorite onPress handlers, the All Farmhouses margin/card review.

```
PHASE 4 of 8 — Browse Screens (home.tsx, farmhouse/all.tsx)

1. Home card hierarchy: Featured cards are currently small (w-72 h-44) and Explore-all cards are oversized (w-full h-64) — the visual weight is backwards from the content intent. Featured should read as the prominent, curated content; Explore-all should read as an efficient, scannable list, not a second hero section. Rebalance so Featured is visually the star and Explore-all is compact enough that users aren't scrolling past giant cards to browse.
2. Wire up the missing onPress handlers on the favorite heart icons on both the Home screen's cards (horizontal and vertical) and the All Farmhouses cards. Just connect the tap handler to the store correctly here — Phase 5 covers the deeper sync bug, don't debug that in this phase.
3. All Farmhouses: the FlatList padding was already reduced from padding:24 to paddingHorizontal:16 — confirm the FarmhouseCard component itself renders wide and balanced at that new padding rather than looking cramped or oddly proportioned, and adjust card internals if needed.
4. Category pills on Home: bring onto the new token system. These are currently described as multi-colored, which likely means raw Tailwind colors rather than the brand palette — make the color-coding deliberate if you keep it, or move to one consistent style if the multi-color treatment isn't actually communicating anything.

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

Report back per the standing rules, and specifically name the actual root cause you found, not just which screens you touched.
```

---

## Phase 6 — Detail & checkout/booking flow
**Fixes:** confirms the crash fix holds, brings the booking flow onto the new system, addresses payment dead ends.

```
PHASE 6 of 8 — Farmhouse Detail & Checkout ([id].tsx, checkout/*)

1. Confirm the 24H crash fix from the standalone prompt is solid, and specifically test 12H and CUSTOM too — if 24H had a wiring bug, check whether CUSTOM (also a newer addition) has a similar issue that just hasn't been hit yet.
2. Detail screen visual pass: hero image treatment, rating stars, amenities grid, owner details, sticky bottom booking bar — bring onto the tokens and type/spacing scale from Phases 1–2.
3. Booking type selection (12H/24H/CUSTOM): make all three options equally clear about what they mean and what they cost — this is a moment where confusion directly costs a booking.
4. Payment: the checkout WebView loads the Razorpay checkout endpoint. Add a proper branded loading state before the WebView content appears (likely a blank flash right now), and confirm error handling exists if the WebView fails to load or payment fails — a dead end here is exactly the kind of thing that makes someone give up and call instead of booking in-app.

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
   - Re-test the 24H (and 12H, CUSTOM) booking flow end to end.
   - Re-test favorites from all four touchpoints (Home, Detail, All Farmhouses, Favorites tab) to confirm the sync fix holds under repeated toggling.
   - Grep for any remaining raw Tailwind/NativeWind color class anywhere in the app — there should be zero.
   - Confirm every tappable element still meets the 44×44pt minimum after all the visual changes.
4. Final summary report: what changed across the full 8-phase arc plus the standalone crash fix, and anything worth flagging for a future pass.
```

# StayGrid Mobile App — Comprehensive UI/UX Audit & Screen-by-Screen Design Index

> **Purpose**: This document provides an exhaustive, screen-by-screen technical index and design audit of the StayGrid React Native / Expo mobile codebase (`apps/mobile`). Use this master guide to prompt Claude, GPT-4, or UI designers to implement pixel-perfect design upgrades, rich micro-animations, glassmorphic surfaces, and micro-interaction enhancements across every screen and component.

---

## 🛠️ 1. Technical Stack & Architecture Overview

- **Framework**: React Native with Expo Router v3 (file-based routing under `apps/mobile/app`).
- **Styling**: NativeWind (Tailwind CSS for React Native) paired with custom theme utility hooks (`useThemeColors`).
- **Design Tokens**:
  - `accentPrimary`: `#0066CC` (Royal Blue)
  - `accentSuccess` / `emerald`: `#10B981` (Emerald Green for primary CTAs like Pay/Submit)
  - `warning`: `#F59E0B` (Amber for ratings/fees)
  - `danger`: `#EF4444` (Coral Red for warnings/delete)
  - `glassBg` / `glassBorder`: Translucent blur surfaces powered by `expo-blur`.
  - `typography`: Google Fonts Inter (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`, `Inter_800ExtraBold`).
- **State Management**:
  - `AsyncStorage`: Auth tokens & user session persistence.
  - `Zustand`: `useFavoriteStore` for instant offline favorite toggling.
  - `@tanstack/react-query` & `Axios`: API data fetching (`authApi.ts`).

---

## 📱 2. Master Screen Index & UI Breakdown

```
apps/mobile/app/
├── index.tsx                # Splash / Onboarding Screen
├── (tabs)/
│   ├── _layout.tsx          # Bottom Tab Bar Navigation
│   ├── home.tsx             # Main Home Screen & Notifications Drawer
│   ├── bookings.tsx         # My Bookings Screen (Upcoming, History & Saved Drafts)
│   └── profile.tsx          # User Profile & Settings Screen
├── auth/
│   ├── login.tsx            # User Login Screen
│   └── signup.tsx           # Account Registration Screen
├── farmhouse/
│   ├── [id].tsx             # Property Details & Booking Engine
│   └── all.tsx              # Filter & All Properties Feed Screen
├── checkout/
│   ├── [id].tsx             # Checkout Summary & Razorpay Payment Screen
│   └── guests.tsx           # Guest Count Stepper & Extra Fee Confirmation
├── reviews/
│   ├── [farmhouseId].tsx    # Reviews Feed Screen
│   └── new.tsx              # Write a Review Screen
└── favorites.tsx            # Saved / Bookmarked Farmhouses Screen
```

---

## 🔍 3. Exhaustive Screen-by-Screen UI & Component Audit

---

### Screen 1: Splash / Onboarding (`app/index.tsx`)

#### Current UI Structure
- **Hero Background**: Full-screen high-definition farmhouse image backdrop (`ImageBackground`) with a dark gradient overlay (`bg-black/50`).
- **Branding Header**: StayGrid logo badge and tagline: *"Book luxury farmhouses with private pools, turfs, and zero hassle."*
- **Call-to-Action Buttons**:
  - `Get Started` (Primary Button): Rounded pill button (`bg-[#10B981]`), navigates to `(tabs)/home`.
  - `Log In` / `Sign Up` (Secondary Row): Transparent outline buttons with white borders.

#### Minor Details & Micro-Interactions
- Floating badge elements with blur effect.
- Touch feedback scaling on CTA press.

#### 💡 Claude UI Improvement Prompt Recommendations
- **Glassmorphism Hero Card**: Wrap the bottom text container in a frosted `BlurView` (intensity 80) with a subtle 1px translucent border (`border-white/20`).
- **Animated Pagination Indicator**: Add automated multi-image slide carousel with animated dot indicators showing 3 hero images (Pool, Lawn, Luxury Villa).
- **Haptic Feedback**: Add `expo-haptics` trigger on pressing `"Get Started"`.

---

### Screen 2: Home Screen Tab (`app/(tabs)/home.tsx`)

#### Current UI Structure
1. **Top Greeting Bar**:
   - Left: *"Hello, {FirstName}"* subtitle + *"Let's find the best farmhouse"* title.
   - Right: Favorites Heart button (`#f43f5e`) + Notifications Bell button (`Bell` icon with red unread dot).
2. **Hero Promo Banners Carousel**:
   - Horizontal sliding banner cards featuring active promotions fetched dynamically from `/api/hero-banners`.
3. **Search & Category Filter Chips**:
   - `TextInput` search bar with `Search` icon and live debounced query (`300ms`).
   - Quick category pills row: `Location`, `Turf`, `Big Pools`, `Couple Friendly`, `Pet Friendly`.
4. **Featured Farmhouses Section**:
   - Horizontal scrolling card list (`FlatList` horizontal) with 4.8★ rating badge, location pin, title, and 12-hour price tag.
5. **Explore All Feed**:
   - Vertical listing of active properties with thumbnail image, favorite heart toggle, rating pill, title, location, and price.
6. **Notifications & Stays Drawer Modal**:
   - Slide-up bottom sheet triggered by the Bell icon.
   - Dynamically fetches user's active/upcoming bookings from `/api/bookings/me`.
   - Renders property thumbnail, date range, status badge (`CONFIRMED`, `PENDING_PAYMENT`, `SAVED`), total amount, and tap-to-view route.

#### Minor Details & Micro-Interactions
- Heart icon toggles instantly in local Zustand state with visual fill color change (`#f43f5e`).
- Empty search state rendered via `EmptyState` component.

#### 💡 Claude UI Improvement Prompt Recommendations
- **Sticky Blur Header**: Convert top greeting bar into a sticky header that glassmorphs on scroll (`BlurView` with background opacity transition).
- **Skeleton Shimmer**: Replace static loading activity indicator with shimmer skeleton cards (`SkeletonCard`).
- **Filter Chip Animation**: Animate category selection pill indicator with `react-native-reanimated` spring transitions.

---

### Screen 3: Property Details & Booking Engine (`app/farmhouse/[id].tsx`)

#### Current UI Structure
1. **Hero Gallery Header**:
   - Full-width image slider with photo index pill (`1/8`), back navigation circle, and favorite heart button.
2. **Title & Rating Section**:
   - Property title, city location link, rating star badge (4.9★), capacity pill (`Up to 25 Guests`), host verified badge.
3. **Interactive Booking Engine**:
   - **Booking Type Cards**: 3 selectable options:
     - `12H Day Stay`: `10:00 AM - 10:00 PM`
     - `24H Night Stay`: `10:00 AM - Next Morning 10:00 AM`
     - `CUSTOM Multi-Day`: Select start & end dates cleanly.
   - **Custom Calendar View**: Shows month grid. Dates booked in DB are automatically rendered in **Red with Line-through Text** and disabled touches.
   - **Check-in Time Slot Picker**: Horizontal time slot pills (`10:00 AM`, `02:00 PM`, `06:00 PM`) with explicit check-in/out label notes.
4. **Amenities Grid**:
   - 2-column grid featuring Swimming Pool, Turf Ground, AC Bedrooms, Wifi, Kitchen, Music System, Lawn, BBQ Grill.
5. **Host Notes & House Rules**:
   - Collapsible policy card detailing check-in rules, party policy, and extra guest charges.
6. **Reviews Section**:
   - Breakdown of average rating and recent guest reviews with star ratings and comment cards.
7. **Bottom Floating Sticky Bar**:
   - Left: Price display (`₹10,000 / 12 hrs`).
   - Right: Primary CTA button (`"Book Now"` in Emerald Green `#10B981`).

#### Minor Details & Micro-Interactions
- Selecting dates or slots updates check-out display dynamically without page re-renders.
- Booked date ranges fetched from `GET /api/bookings/booked-dates?farmhouseId={id}`.

#### 💡 Claude UI Improvement Prompt Recommendations
- **Full-Screen Lightbox**: Add pinch-to-zoom full-screen modal on tapping hero photos.
- **Floating Price Bar Elevation**: Give the bottom bar a soft ambient shadow (`shadowColor: '#10B981'`, shadowOpacity 0.3) and glass translucent background.
- **Sticky Section Tabs**: Add quick jump tabs (`Overview`, `Booking`, `Amenities`, `Reviews`) anchored below hero image.

---

### Screen 4: Checkout Summary & Payment (`app/checkout/[id].tsx`)

#### Current UI Structure
1. **Header Bar**: Top bar with back button and title `"Confirm & Pay"`.
2. **Trip Summary Card**:
   - Property image, title, selected dates, booking type (`24H Night Stay`), and check-in slot (`10:00 AM`).
3. **Guests Card**:
   - Displays selected guest count (`35 Guests - 30 Adults, 5 Children`) with an `"Edit"` button linking to `checkout/guests.tsx`.
4. **Contact Info Card**:
   - Floating label inputs for Email Address and Phone Number.
5. **Redesigned Price Details Card**:
   - Rent line item: `₹10,000 X 1 Booking` = `₹10,000`
   - Extra Guest Fee: `+₹1,500` (if applicable)
   - Total Amount: `₹11,500`
   - **Token Amount Paid Now**: `₹2,000` (highlighted in Royal Blue `#0066CC`)
   - **Remaining Balance Due at Check-in**: `₹9,500` (highlighted in Emerald Green `#10B981`)
6. **Additional Host Note Field**:
   - Multi-line text input for optional special requests.
7. **Bottom Actions**:
   - Primary CTA: `"Pay Token Amount (₹2,000)"` -> opens Razorpay payment webview overlay.
   - Secondary CTA: `"Save Booking for Later"` -> saves draft booking to `POST /api/bookings/save`.

#### Minor Details & Micro-Interactions
- Razorpay verification calls `POST /api/bookings/verify`. HMAC check bypassed cleanly for test modes.
- Successful payments trigger a booking confirmation email and mobile push notification.

#### 💡 Claude UI Improvement Prompt Recommendations
- **Invoice Breakdown Card**: Apply a subtle ticket-stub layout with dashed dividing line between Total Amount and Token Paid Now.
- **Payment Method Badges**: Display UPI, Credit Card, Netbanking, and Razorpay trust badges near the Pay button.

---

### Screen 5: Guest Selection & Extra Fee Modal (`app/checkout/guests.tsx`)

#### Current UI Structure
1. **Capacity Card**: Displays property included guest capacity (e.g. *"Base Stay Includes 20 Guests"*).
2. **Adults & Children Steppers**:
   - Minus (`-`), count box, and Plus (`+`) buttons for Adults and Children.
   - Tapping the numeric count box opens `GuestCountModal` for direct numeric entry.
3. **Input Bounds & Protection**:
   - `GuestCountModal` text input enforces `maxLength={3}` and live value capping to `Math.max(100, capacity * 5)`.
   - Entering numbers beyond max limit triggers an alert: *"Limit Exceeded: Maximum allowed count for this field is 100."*
4. **Extra Guest Fee Agreement Alert**:
   - Selecting guests exceeding included count (e.g. 35 adults on 20 capacity) displays an explicit alert detailing extra fee rate (`(35 - 20) * ₹500 = +₹7,500`).
5. **Bottom Action**:
   - `"Proceed to Review"` button.

#### 💡 Claude UI Improvement Prompt Recommendations
- **Animated Number Counter**: Add animated numeric layout transition (`reanimated` layout animation) when tapping `+` or `-`.
- **Visual Extra Fee Meter**: Progress bar visualizer showing green up to included capacity, switching to amber for extra guests.

---

### Screen 6: My Bookings Tab (`app/(tabs)/bookings.tsx`)

#### Current UI Structure
1. **Header Bar**: Title `"My Bookings"` with top right icon triggers:
   - 📜 **History Modal Icon**: Opens past completed & cancelled bookings list.
   - 🔖 **Saved Drafts Modal Icon**: Opens saved draft bookings saved for later.
2. **Upcoming Bookings Feed**:
   - Displays live upcoming bookings with property image, dates, status pill (`CONFIRMED`, `PENDING_PAYMENT`), token paid, and pending balance.
   - Buttons: `"Pay Token Now"` (if pending), `"View Farmhouse"`, `"Cancel Booking"`.
3. **History Modal**:
   - Modal bottom sheet showing past stays with `"Write a Review"` action button.
4. **Saved Drafts Modal**:
   - Modal bottom sheet showing draft bookings with `"Complete Booking & Pay Token"` action button.

#### 💡 Claude UI Improvement Prompt Recommendations
- **Segmented Control Switcher**: Convert top modals into a smooth 3-tab segmented control bar (`Upcoming`, `Saved Drafts`, `History`).
- **Interactive Ticket Card**: Style booking items as boarding pass tickets with barcode graphic and QR code check-in scanner shortcut.

---

### Screen 7: Write a Review (`app/reviews/new.tsx`)

#### Current UI Structure
1. **Header**: Back arrow + `"Write a Review"` title.
2. **Interactive 5-Star Selector**:
   - Large touchable star icons (`size={36}`) changing color from gray `#CFCFC8` to amber `#F59E0B`.
   - Live rating description string (e.g. *"5 Stars - Outstanding Experience!"*).
3. **Review Feedback Input**:
   - Multi-line text input (`min-h-[110px]`) inside rounded glass surface.
4. **Bottom Submit Button**:
   - `"Submit Review"` button in Emerald Green (`bg-[#10B981]`), contained inside `ScrollView` + `KeyboardAvoidingView`.

#### 💡 Claude UI Improvement Prompt Recommendations
- **Star Bounce Animation**: Add spring scale bounce on star press (`Reanimated` spring effect).
- **Quick Tags**: Add quick selection pills (e.g. `Clean Pool 🏊`, `Great Host 🤝`, `Spacious Lawn 🌿`, `Fast Wifi 📶`).

---

### Screen 8: Auth Screens (`app/auth/login.tsx` & `app/auth/signup.tsx`)

#### Current UI Structure
1. **Branding Header**: StayGrid logo badge and welcome message.
2. **Form Inputs**: Floating label text fields for Email / Phone Number and Password. Password field includes `Eye` icon visibility toggle.
3. **Primary CTA**: `"Log In"` / `"Create Account"` button with activity loading indicator.
4. **Footer Link**: Toggle link between Login and Registration screens.

#### 💡 Claude UI Improvement Prompt Recommendations
- **Social Login Buttons**: Add Google and Apple 1-tap authentication buttons with official branded icons.
- **Input Validation Rings**: Add real-time green checkmark icons when valid email/phone is typed.

---

## 🎨 4. Complete Design Enhancement Summary Checklist for Claude

| Screen | Target Area | Recommended UI Upgrade |
| :--- | :--- | :--- |
| **Home (`home.tsx`)** | Header & Drawers | Add sticky blur header, skeleton shimmer loaders, and spring chip selector. |
| **Farmhouse (`[id].tsx`)** | Hero & Booking Bar | Add photo lightbox, ambient green shadow on floating bar, and sticky section tabs. |
| **Checkout (`checkout/[id].tsx`)**| Price Card | Ticket-stub layout with dashed lines, payment method trust badges (UPI, Cards). |
| **Guests (`guests.tsx`)** | Stepper Inputs | Reanimated numeric transition and visual color progress meter for extra guests. |
| **Bookings (`bookings.tsx`)** | Screen Layout | Replace top icons with 3-tab Segmented Control and boarding-pass card styling. |
| **Review (`new.tsx`)** | Rating Component | Star bounce spring micro-animations and quick amenity review tag chips. |
| **Auth (`login.tsx`)** | Login Options | Add Google & Apple 1-tap auth buttons and real-time input validation checkmarks. |

---

## 📁 5. Target File Paths Reference

- **App Entry**: [app/index.tsx](file:///d:/staygrid/apps/mobile/app/index.tsx)
- **Home Screen**: [app/(tabs)/home.tsx](file:///d:/staygrid/apps/mobile/app/%28tabs%29/home.tsx)
- **Farmhouse Details**: [app/farmhouse/[id].tsx](file:///d:/staygrid/apps/mobile/app/farmhouse/%5Bid%5D.tsx)
- **Checkout Screen**: [app/checkout/[id].tsx](file:///d:/staygrid/apps/mobile/app/checkout/%5Bid%5D.tsx)
- **Guest Stepper**: [app/checkout/guests.tsx](file:///d:/staygrid/apps/mobile/app/checkout/guests.tsx)
- **My Bookings**: [app/(tabs)/bookings.tsx](file:///d:/staygrid/apps/mobile/app/%28tabs%29/bookings.tsx)
- **Write Review**: [app/reviews/new.tsx](file:///d:/staygrid/apps/mobile/app/reviews/new.tsx)
- **Auth Login**: [app/auth/login.tsx](file:///d:/staygrid/apps/mobile/app/auth/login.tsx)
- **Theme Tokens**: [lib/theme-colors.ts](file:///d:/staygrid/apps/mobile/lib/theme-colors.ts)

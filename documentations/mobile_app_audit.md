# Mobile App & Backend API Audit

This document provides a comprehensive breakdown of the StayGrid Mobile App (React Native/Expo) and its associated Backend API (NestJS). It is designed to be passed to Claude or another LLM to streamline UI/UX refinement and bug resolution.

## 📱 Mobile App Architecture Overview
- **Framework**: Expo (React Native) with Expo Router (File-based routing).
- **Styling**: NativeWind v4 (Tailwind CSS for React Native). 
- **State Management**: Zustand (for favorites), React Query (for API calls).
- **Icons**: `lucide-react-native`.

---

## 🔍 Screen-by-Screen Audit & Known UI/UX Issues

### 1. Home Screen (`app/(tabs)/home.tsx`)
**Current Layout**:
- **Hero Section**: Displays a dynamic background image with a search bar.
- **Categories**: Horizontal scroll of multi-colored category pills.
- **Featured Farmhouses**: Horizontal list of cards.
- **Explore All**: Vertical list of remaining farmhouses.

**Known UI/UX Issues**:
- **Proportions are off**: The "Featured" cards are too small (`w-72`, `h-44`), making them feel cramped. The "Explore All" vertical cards below them are excessively large (`w-full`, `h-64`), causing an unbalanced hierarchy.
- **Non-functional Favorites**: The Heart icons overlaying the images on BOTH the horizontal and vertical cards have no `onPress` handler attached. Clicking them does nothing.

### 2. Farmhouse Detail Screen (`app/farmhouse/[id].tsx`)
**Current Layout**:
- Image header, title, location, amenities, owner details, and a sticky bottom bar for booking.
- Includes a booking modal that dynamically switches between `12H`, `24H`, and `CUSTOM` booking types.

**Known Functional Bugs**:
- **The 24-Hour Booking Crash**: Clicking the `24H` button triggers a fatal React Navigation error (`Couldn't find a navigation context`). 
  - *Root Cause Context*: This is heavily tied to NativeWind v4's `react-native-css-interop` engine throwing a `printUpgradeWarning` when rendering un-mapped components. Even when fixed in code, the Expo Metro Bundler cache tightly holds onto the corrupted AST tree. (Requires `npx expo start -c` to clear, but code should be audited to ensure absolutely NO `className` props are passed to unsupported elements like `ActivityIndicator` or `lucide-react-native` icons).
- **Favorites State**: The heart icon in the top header is currently mapped to `useFavoriteStore`, but needs UX polish to show a toast notification when toggled.

### 3. All Farmhouses Screen (`app/farmhouse/all.tsx`)
**Current Layout**:
- A paginated list of all farmhouses with search and category filters at the top.

**Known UI/UX Issues**:
- **Excessive Margins**: The `FlatList` container previously had `padding: 24`, causing massive empty spaces on the left and right of the cards. This has been reduced to `paddingHorizontal: 16`, but the card dimensions (`FarmhouseCard` component) should be reviewed to ensure they look wide and horizontally balanced.
- **Favorites Integration**: The `FarmhouseCard` uses `useFavoriteStore`, but state reactivity sometimes lags if not properly memoized.

### 4. Favorites Screen (`app/favorites.tsx`)
**Current Layout**:
- Displays a `ScrollView` of farmhouses filtered by the Zustand store's saved IDs.
- Includes an empty state illustration.

**Known UI/UX Issues**:
- The transition when removing an item from favorites while on this screen is abrupt. Needs LayoutAnimation or a smoother exit transition.

---

## ⚙️ Backend API Index (NestJS)

The mobile app relies on the following backend services hosted at `API_URL`.

### 1. Farmhouses (`/api/farmhouses`)
- `GET /api/farmhouses`: Retrieves a paginated list of farmhouses. Supports query params: `page`, `limit`, `search`, `category`, `isActive`.
- `GET /api/farmhouses/:id`: Retrieves detailed data for a single farmhouse, including availability, amenities, and owner details.
- `GET /api/farmhouses/featured`: Retrieves farmhouses marked as `isFeatured=true`.

### 2. Bookings (`/api/bookings`)
- `POST /api/bookings`: Creates a new booking. Requires `farmhouseId`, `checkIn`, `checkOut`, `bookingType` (12H/24H/CUSTOM), and payment token.
- `GET /api/bookings/user`: Retrieves all past and upcoming bookings for the logged-in mobile user.
- `GET /api/bookings/check-availability`: Validates if a farmhouse is available for the requested time slot.

### 3. Authentication (`/api/auth`)
- `POST /api/auth/email-otp/send-verification-otp`: Sends a sign-in code to the user's email.
- `POST /api/auth/sign-in/email-otp`: Verifies the email code and creates a session.
- `POST /api/notifications/push-token`: Registers the signed-in mobile device for push notifications.
- Configure `EXPO_PUBLIC_EAS_PROJECT_ID` and the required APNs/FCM credentials for native builds so Expo can issue and deliver project-scoped push tokens.
- `GET /api/notifications/me`: Lists recent in-app notifications.
- `GET /api/auth/me`: Returns the current user's profile.

### 4. Categories & Banners (`/api/categories`, `/api/hero-banners`)
- `GET /api/categories`: Returns the dynamic list of farmhouse categories (e.g., Pool, Pet Friendly).
- `GET /api/hero-banners`: Returns active promotional banners for the mobile home screen hero section.

---

## 🎯 Directives for Claude (Prompt Instructions)

When passing this document to Claude to fix the app, use the following prompt:

> "Claude, here is the audit of my React Native Expo app using NativeWind v4. Please help me refactor the UI and fix the functional bugs:
> 1. **Home Screen (`home.tsx`)**: Rebalance the sizing. Make the 'Featured' cards larger and more prominent, and reduce the oversized height of the 'Explore All' vertical cards. Add working `onPress` favorite toggles to all cards using the `useFavoriteStore`.
> 2. **Detail Screen (`[id].tsx`)**: Deeply audit the file for ANY NativeWind v4 illegal `className` props on third-party components (especially Lucide icons or Modals) to permanently fix the 'Navigation Context' crash during the 24H booking flow.
> 3. **All Farmhouses (`all.tsx`)**: Ensure the `FlatList` cards span perfectly horizontally without excessive side margins.
> 4. **Overall UX**: Ensure consistent spacing, luxury aesthetic (dark/light mode), and smooth interactions."

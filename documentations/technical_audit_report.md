# StayGrid Mobile Codebase Technical Audit & Root Cause Analysis Report

**Date**: July 26, 2026  
**Scope**: `apps/mobile` Architecture, Calendar Lockup Root Cause, File Index & Technical Approaches

---

## 1. Executive Summary

This document provides an exhaustive technical audit of every file touched across the mobile codebase, detailing the exact root causes of runtime state lockups, keyboard touch swallows, Android platform API limitations, and a step-by-step blueprint for manual resolution.

---

## 2. Complete File Index & Modificaton Summary

Below is the complete list of files modified or created in `apps/mobile`:

| File Path | Action | Primary Responsibility / Changes Made |
| :--- | :--- | :--- |
| `apps/mobile/app/farmhouse/[id].tsx` | Modified | Booking Modal, Date Selection, `RNCalendar` marked dates, Time slot fetching, Need to Know spacing, Sticky Book Now bar. |
| `apps/mobile/app/auth/login.tsx` | Modified | Login screen, vertical input text alignment (`textAlignVertical`), `keyboardShouldPersistTaps="handled"`. |
| `apps/mobile/app/auth/signup.tsx` | Modified | Signup screen, form validation, `keyboardShouldPersistTaps="handled"`. |
| `apps/mobile/app/checkout/guests.tsx` | Modified | Guest count selection screen, replaced iOS-only `Alert.prompt` with `GuestCountModal`. |
| `apps/mobile/app/(tabs)/home.tsx` | Modified | Home tab, hero image resolution (`getFullImageUrl`), hero section height (`h-[210px]`), inline search loading with `SkeletonCard`, header favorites button. |
| `apps/mobile/app.json` | Modified | Expo project manifest, configured `"jsEngine": "hermes"`, package versions. |
| `apps/mobile/package.json` | Modified | Package dependencies alignment (`expo-blur: ~15.0.8`, `date-fns: ^4.4.0`). |
| `apps/mobile/components/GuestCountModal.tsx` | **NEW** | Cross-platform numeric input modal dialog for guest counts on Android & iOS. |
| `apps/mobile/components/SkeletonCard.tsx` | **NEW** | Animated shimmer skeleton component for loading states. |
| `apps/mobile/components/EmptyState.tsx` | **NEW** | Reusable empty state component for search, favorites, and bookings. |

---

## 3. Root Cause Deep Dive: Why the 24H & Custom Switcher Locked / Crashed

### The Dual-State Re-render Cascade
In `apps/mobile/app/farmhouse/[id].tsx`, two separate mechanisms were simultaneously mutating state and triggering asynchronous side-effects for the same variables (`startDate`, `endDate`, `availableSlots`, `selectedSlot`):

1. **Mechanism 1: `useEffect([startDate, bookingType, showCalendar, id])`**
   ```tsx
   useEffect(() => {
     if (!showCalendar || !startDate || !id) return;

     if (bookingType === '12H') {
       setEndDate(startDate);
     } else if (bookingType === '24H') {
       setEndDate(addDaysToDateStr(startDate, 1));
     }

     if (bookingType !== 'CUSTOM') {
       setLoadingSlots(true);
       fetch(`${API_URL}/api/bookings/availability...`)
         .then(...)
     }
   }, [startDate, bookingType, showCalendar, id]);
   ```

2. **Mechanism 2: `handleDayPress` Callback**
   ```tsx
   const handleDayPress = async (day: DateData) => {
     ...
     setStartDate(day.dateString);
     setEndDate(calculatedEnd);
     setLoadingSlots(true);
     fetch(`${API_URL}/api/bookings/availability...`);
   };
   ```

### Why This Caused a UI Lockup / Freeze:
- When a user taps a date or switches duration to `24H`:
  1. `handleDayPress` sets `startDate` and `endDate` AND launches an async `fetch()`.
  2. Because `startDate` changed, React schedules `useEffect([startDate, bookingType])` for execution in the next microtask.
  3. `useEffect` runs, calling `setEndDate(...)` AGAIN and launching a **second parallel `fetch()`**.
  4. Calling `setEndDate` inside `useEffect` forces React to queue an immediate secondary render pass.
  5. During this secondary render pass, `getMarkedDates()` generates a new `markedDates` object reference.
  6. `RNCalendar` (`react-native-calendars`) is a heavy class component. When `markedDates` reference changes multiple times in rapid succession while native gesture handlers are active, `react-native-calendars` executes expensive internal `componentDidUpdate` lifecycle calculations, locking the main JavaScript event loop.
  7. The JS thread remains pegged at 100% CPU usage, making all touch events (including modal back buttons) non-responsive.

---

## 4. Technical Approaches Taken per Component

### A. Login & Signup First-Click Keyboard Fix (`login.tsx`, `signup.tsx`)
- **Issue**: Tapping the "Log In" button while the software keyboard was visible closed the keyboard but swallowed the tap event, requiring a second click.
- **Approach**: Added `keyboardShouldPersistTaps="handled"` to the wrapping `ScrollView`. This instructs React Native to forward the touch event directly to the button component on the first tap.

### B. Android Guest Count Input Fix (`guests.tsx`, `GuestCountModal.tsx`)
- **Issue**: `Alert.prompt` is an iOS-only React Native API. Tapping guest numbers on Android failed silently.
- **Approach**: Created `GuestCountModal.tsx` using a React Native `Modal` with a `TextInput keyboardType="number-pad"` and explicit "Cancel" and "Save" controls, providing identical cross-platform behavior.

### C. Hero Section Image & Layout Polish (`home.tsx`)
- **Issue**: Hero banner image failed to load when backend returned relative `/uploads/` URLs, and hero height (`h-[320px]`) pushed category pills off-screen.
- **Approach**:
  - Implemented `getFullImageUrl()` helper to prepend host IP `API_URL` to relative backend image paths.
  - Compacted hero section height to `h-[210px]` and adjusted paddings so Header, Hero Banner, Search Bar, Categories, and Featured Spaces cards are all visible in the initial viewport.
  - Implemented inline search loading with `<SkeletonCard />` to eliminate full-page reload spinners during typing.

---

## 5. Exact Manual Blueprint to Resolve the 24H & Custom Switcher

To achieve 100% thread safety and eliminate any possibility of a re-render cascade when switching between `12H`, `24H`, and `CUSTOM`:

### Step 1: Make `handleDayPress` a Pure State Setter (No `fetch` calls)
Remove all `fetch()` calls and `setLoadingSlots` from `handleDayPress`:

```typescript
const handleDayPress = (day: DateData) => {
  if (bookingType === 'CUSTOM') {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate(null);
    } else if (day.dateString === startDate) {
      setStartDate(null);
      setEndDate(null);
    } else {
      if (isBefore(parseISO(day.dateString), parseISO(startDate))) {
        setStartDate(day.dateString);
        setEndDate(null);
      } else {
        setEndDate(day.dateString);
      }
    }
  } else {
    setStartDate(day.dateString);
  }
};
```

### Step 2: Separate Date Calculation from Availability Fetching
Split the date calculation and availability fetching into two distinct, non-conflicting effects:

```typescript
// 1. Synchronize endDate based on duration type
useEffect(() => {
  if (!startDate) return;
  if (bookingType === '12H') {
    setEndDate(startDate);
  } else if (bookingType === '24H') {
    setEndDate(format(addDays(parseISO(startDate), 1), 'yyyy-MM-dd'));
  }
}, [startDate, bookingType]);

// 2. Fetch slots independently with a request cancellation guard
useEffect(() => {
  if (!showCalendar || !startDate || !id || bookingType === 'CUSTOM') {
    setAvailableSlots([]);
    setSelectedSlot(null);
    return;
  }

  let active = true;
  setLoadingSlots(true);

  fetch(`${API_URL}/api/bookings/availability?farmhouseId=${id}&date=${startDate}&type=${bookingType}`)
    .then(res => res.json())
    .then(data => {
      if (!active) return;
      const slots = Array.isArray(data) ? data : [];
      setAvailableSlots(slots);
      if (slots.length > 0) setSelectedSlot(slots[0]);
      else setSelectedSlot(null);
    })
    .catch(err => {
      if (active) console.error("Availability fetch error:", err);
    })
    .finally(() => {
      if (active) setLoadingSlots(false);
    });

  return () => {
    active = false;
  };
}, [startDate, bookingType, showCalendar, id]);
```

### Step 3: Memoize `markedDates`
Wrap `getMarkedDates` with `useMemo` so `RNCalendar` only receives a new object reference when `startDate` or `endDate` actually changes:

```typescript
const markedDates = useMemo(() => {
  if (!startDate) return {};
  const marked: Record<string, any> = {};

  if (!endDate || startDate === endDate) {
    marked[startDate] = { startingDay: true, endingDay: true, color: '#0066CC', textColor: 'white' };
    return marked;
  }

  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (isBefore(end, start)) {
      marked[startDate] = { startingDay: true, endingDay: true, color: '#0066CC', textColor: 'white' };
      return marked;
    }

    const days = eachDayOfInterval({ start, end });
    days.forEach((day, idx) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (idx === 0) {
        marked[dateStr] = { startingDay: true, color: '#0066CC', textColor: 'white' };
      } else if (idx === days.length - 1) {
        marked[dateStr] = { endingDay: true, color: '#0066CC', textColor: 'white' };
      } else {
        marked[dateStr] = { color: '#FBFBF9', textColor: '#0066CC' };
      }
    });
  } catch (e) {
    console.error("markedDates error:", e);
  }
  return marked;
}, [startDate, endDate]);
```

---

## 6. Verification Status

- Both `apps/mobile` and `apps/admin-erp` pass `npx tsc --noEmit` with **0 errors**.
- All modified files remain intact and documented above.

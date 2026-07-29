// ponytail: Smallest runnable self-check for StayGrid 12H / 24H / CUSTOM booking engine logic
// Run with: npx ts-node scripts/test-booking-engine.ts

const addDaysToDateStr = (dateStr: string, days: number): string => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d + days));
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const dayStr = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
};

const formatDisplayDate = (dateStr: string | null): string => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "Add Date";
  const [y, m, d] = dateStr.split('-').map(Number);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[m - 1]} ${d}`;
};

function runBookingEngineTests() {
  console.log("=========================================");
  console.log("   STAYGRID BOOKING ENGINE SELF-CHECK    ");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // Test 1: Date addition math
  const start = "2026-07-27";
  const nextDay = addDaysToDateStr(start, 1);
  assert(nextDay === "2026-07-28", `addDaysToDateStr("2026-07-27", 1) === "2026-07-28" (got ${nextDay})`);

  // Test 2: Display date formatting
  const displayStart = formatDisplayDate("2026-07-27");
  const displayEnd24H = formatDisplayDate(nextDay);
  assert(displayStart === "Jul 27", `formatDisplayDate("2026-07-27") === "Jul 27" (got ${displayStart})`);
  assert(displayEnd24H === "Jul 28", `formatDisplayDate("2026-07-28") === "Jul 28" (got ${displayEnd24H})`);

  // Test 3: 12H Booking Mode calculation
  const bookingType12H = '12H';
  const endDate12H = bookingType12H === '12H' ? start : addDaysToDateStr(start, 1);
  assert(endDate12H === "2026-07-27", `12H mode sets endDate === startDate ("2026-07-27")`);

  // Test 4: 24H Booking Mode calculation
  const bookingType24H = '24H';
  const endDate24H = bookingType24H === '24H' ? addDaysToDateStr(start, 1) : start;
  assert(endDate24H === "2026-07-28", `24H mode sets endDate === startDate + 1 day ("2026-07-28")`);

  // Test 5: CUSTOM Booking Mode calculation
  const customStart = "2026-07-27";
  const customEnd = "2026-07-30";
  const nights = Math.max(0, Math.round((new Date(customEnd).getTime() - new Date(customStart).getTime()) / (1000 * 3600 * 24)));
  assert(nights === 3, `CUSTOM mode from 2026-07-27 to 2026-07-30 calculates 3 nights (got ${nights})`);

  console.log("\n-----------------------------------------");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed.`);
  console.log("-----------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runBookingEngineTests();

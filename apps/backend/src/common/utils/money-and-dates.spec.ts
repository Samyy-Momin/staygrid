import { istDay } from './ist-date';
import { commissionSnapshot } from '../../bookings/bookings.service';
import { dueState, slugifySubdomain } from '../../websites/websites.service';

describe('istDay', () => {
  it('takes YYYY-MM-DD literally', () => {
    expect(istDay('2026-12-25').toISOString()).toBe('2026-12-25T00:00:00.000Z');
  });
  it('maps an IST-midnight instant (18:30Z previous day) to the IST date', () => {
    expect(istDay('2026-12-24T18:30:00.000Z').toISOString()).toBe('2026-12-25T00:00:00.000Z');
  });
  it('maps an early-morning IST check-in to the IST date, not the UTC date', () => {
    // 03:00 IST on 25 Dec == 21:30Z on 24 Dec
    expect(istDay(new Date('2026-12-24T21:30:00.000Z')).toISOString()).toBe('2026-12-25T00:00:00.000Z');
  });
});

describe('commissionSnapshot', () => {
  it('uses the farmhouse rate, not a hard-coded 20%', () => {
    expect(commissionSnapshot(10000, 12.5)).toEqual({ commissionPercentage: 12.5, staygridNetCommission: 1250, ownerShareAmount: 8750 });
  });
  it('falls back to 20% when no rate is set', () => {
    expect(commissionSnapshot(9999, null).staygridNetCommission).toBe(1999.8);
  });
});

describe('dueState', () => {
  const now = new Date('2026-11-21T00:00:00Z');
  it('classifies subscription status', () => {
    expect(dueState(null, now)).toBe('UNPAID');
    expect(dueState(new Date('2026-11-20T00:00:00Z'), now)).toBe('OVERDUE');
    expect(dueState(new Date('2026-11-24T00:00:00Z'), now)).toBe('DUE_SOON');
    expect(dueState(new Date('2026-12-21T00:00:00Z'), now)).toBe('PAID');
  });
});

describe('slugifySubdomain', () => {
  it('builds a DNS-safe subdomain from a title', () => {
    expect(slugifySubdomain('Sharifa Farmhouse')).toBe('sharifafarmhouse');
    expect(slugifySubdomain('Café & Villa #1')).toBe('cafevilla1');
    expect(slugifySubdomain('A')).toMatch(/^[a-z0-9]{4,}$/);
  });
});

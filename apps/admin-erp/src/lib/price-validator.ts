export interface PriceValidationResult {
  isValid: boolean;
  price12Hours?: number;
  price24Hours?: number;
  error?: string;
}

/**
 * Parses raw input value into a clean numeric INR amount.
 * Handles strings with commas ("5,000"), currency symbols ("₹ 5,000"), decimals ("5000.50"), etc.
 */
export function parsePrice(val: any): { value: number | null; error: string | null } {
  if (val === null || val === undefined || val === "") {
    return { value: null, error: "Price is required." };
  }

  // Convert to string and sanitize commas, spaces, currency symbols
  const rawStr = String(val).replace(/[₹,\s]/g, "").trim();
  
  if (!rawStr) {
    return { value: null, error: "Price is required." };
  }

  const parsed = Number(rawStr);

  if (isNaN(parsed)) {
    return { value: null, error: "Price must be a valid number (e.g. 5000)." };
  }

  if (parsed < 0) {
    return { value: null, error: "Price cannot be negative." };
  }

  if (parsed === 0) {
    return { value: null, error: "Price must be greater than ₹0." };
  }

  if (parsed > 10000000) {
    return { value: null, error: "Price cannot exceed ₹10,000,000 (1 Crore)." };
  }

  // Round decimals (e.g. 5000.50 -> 5001) for integer INR pricing
  const finalPrice = Math.round(parsed);

  return { value: finalPrice, error: null };
}

/**
 * Validates 12-hour and 24-hour stay prices, enforcing the critical constraint:
 * "24-hour price must be greater than or equal to the 12-hour price."
 */
export function validateFarmhousePrices(price12HInput: any, price24HInput: any): PriceValidationResult {
  const p12 = parsePrice(price12HInput);
  if (p12.error || p12.value === null) {
    return { isValid: false, error: `12-Hour Price Error: ${p12.error}` };
  }

  const p24 = parsePrice(price24HInput);
  if (p24.error || p24.value === null) {
    return { isValid: false, error: `24-Hour Price Error: ${p24.error}` };
  }

  // Critical constraint validation
  if (p24.value < p12.value) {
    return {
      isValid: false,
      error: "24-hour price must be greater than or equal to the 12-hour price.",
    };
  }

  return {
    isValid: true,
    price12Hours: p12.value,
    price24Hours: p24.value,
  };
}

// Common country codes with dial codes and phone validation patterns
export interface CountryCode {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dialCode: string;
  pattern: RegExp; // Validation pattern for phone number (without country code)
  placeholder: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "IN", name: "India", dialCode: "+91", pattern: /^[6-9]\d{9}$/, placeholder: "9876543210" },
  { code: "US", name: "United States", dialCode: "+1", pattern: /^\d{10}$/, placeholder: "2025551234" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", pattern: /^\d{10,11}$/, placeholder: "7911123456" },
  { code: "CA", name: "Canada", dialCode: "+1", pattern: /^\d{10}$/, placeholder: "4165551234" },
  { code: "AU", name: "Australia", dialCode: "+61", pattern: /^\d{9}$/, placeholder: "412345678" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", pattern: /^\d{8,10}$/, placeholder: "211234567" },
  { code: "IE", name: "Ireland", dialCode: "+353", pattern: /^\d{9}$/, placeholder: "871234567" },
  { code: "ZA", name: "South Africa", dialCode: "+27", pattern: /^\d{9}$/, placeholder: "821234567" },
  { code: "SG", name: "Singapore", dialCode: "+65", pattern: /^\d{8}$/, placeholder: "91234567" },
  { code: "PH", name: "Philippines", dialCode: "+63", pattern: /^\d{10}$/, placeholder: "9171234567" },
];

// Default country code
export const DEFAULT_COUNTRY_CODE = "IN";

/**
 * Get country by ISO code
 */
export function getCountryByCode(code: string): CountryCode | undefined {
  return COUNTRY_CODES.find((c) => c.code === code);
}

/**
 * Validate phone number for a specific country
 */
export function validatePhone(phone: string, countryCode: string): boolean {
  const country = getCountryByCode(countryCode);
  if (!country) {
    // Fallback: allow 7-15 digits for unknown countries
    return /^\d{7,15}$/.test(phone);
  }
  return country.pattern.test(phone);
}

/**
 * Format phone number for display
 */
export function formatPhoneDisplay(phone: string, dialCode: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return `${dialCode} ${digits}`;
}

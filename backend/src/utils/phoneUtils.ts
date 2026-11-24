export interface NormalizedPhone {
  raw: string;          // Original raw input
  digits: string;       // e.g. '919551382296' (WATI API format without '+')
  e164: string;         // e.g. '+919551382296' (Standard E.164 database format)
  formatted: string;    // e.g. '+91 95513 82296' (User-friendly display format)
  isValid: boolean;     // True if valid 10-digit mobile or valid 91-prefixed 12-digit
}

/**
 * Universal Indian phone number normalizer supporting inputs with or without +91.
 * Supports:
 * - 9551382296 (10 digits)
 * - +91 95513 82296 (with +91 and spaces)
 * - +919551382296 (with +91)
 * - 919551382296 (with 91 prefix)
 * - 09551382296 (with leading 0)
 */
export function normalizePhoneNumber(input: string | undefined | null): NormalizedPhone {
  if (!input) {
    return { raw: '', digits: '', e164: '', formatted: '', isValid: false };
  }

  const raw = String(input).trim();
  let digits = raw.replace(/[^0-9]/g, '');

  // Handle leading 00 (e.g. 00919551382296 -> 919551382296)
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Handle single leading 0 (e.g. 09551382296 -> 9551382296)
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  // If 10 digits (standard Indian mobile without country code), auto-prepend 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  const isValid = digits.length === 12 && digits.startsWith('91');
  const e164 = isValid ? `+${digits}` : (digits ? `+${digits}` : '');

  let formatted = e164;
  if (isValid) {
    formatted = `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  return {
    raw,
    digits,
    e164,
    formatted,
    isValid,
  };
}

/**
 * Quick helper returning normalized E.164 (+91XXXXXXXXXX) or fallback
 */
export function toE164Phone(input: string | undefined | null): string {
  return normalizePhoneNumber(input).e164;
}

/**
 * Quick helper returning clean digits for WATI (91XXXXXXXXXX)
 */
export function toWatiDigits(input: string | undefined | null): string {
  return normalizePhoneNumber(input).digits;
}


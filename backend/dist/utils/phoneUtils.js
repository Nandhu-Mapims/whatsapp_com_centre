"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePhoneNumber = normalizePhoneNumber;
exports.toE164Phone = toE164Phone;
exports.toWatiDigits = toWatiDigits;
/**
 * Universal Indian phone number normalizer supporting inputs with or without +91.
 * Supports:
 * - 9551382296 (10 digits)
 * - +91 95513 82296 (with +91 and spaces)
 * - +919551382296 (with +91)
 * - 919551382296 (with 91 prefix)
 * - 09551382296 (with leading 0)
 */
function normalizePhoneNumber(input) {
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
function toE164Phone(input) {
    return normalizePhoneNumber(input).e164;
}
/**
 * Quick helper returning clean digits for WATI (91XXXXXXXXXX)
 */
function toWatiDigits(input) {
    return normalizePhoneNumber(input).digits;
}

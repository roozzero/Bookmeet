const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts all English (0-9) and Arabic-Indic (٠-٩) digits in a string or number to Persian digits (۰-۹).
 */
export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)])
    .replace(/[٠-٩]/g, (d) => PERSIAN_DIGITS[d.charCodeAt(0) - 0x0660]);
}

/**
 * Converts Persian or Arabic-Indic digits back to standard ASCII digits (0-9) for numeric parsing.
 */
export function toEnglishDigits(input: string | number): string {
  return String(input)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/**
 * Extracts prefix, numeric value, and suffix from strings like "+۱۲۰" or "۴۸"
 */
export function parseStatString(raw: string): {
  prefix: string;
  targetValue: number;
  suffix: string;
} {
  const normalized = toEnglishDigits(raw.trim());
  const match = normalized.match(/^([^0-9]*)(\d+)(.*)$/);
  if (!match) {
    return { prefix: '', targetValue: 0, suffix: toPersianDigits(raw) };
  }
  return {
    prefix: toPersianDigits(match[1]),
    targetValue: parseInt(match[2], 10) || 0,
    suffix: toPersianDigits(match[3]),
  };
}

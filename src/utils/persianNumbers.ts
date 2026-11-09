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

/**
 * Formats an ISO Gregorian date string (YYYY-MM-DD) or Persian date string into a readable Persian Jalali date with Persian digits.
 */
export function formatPersianDateDisplay(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const raw = String(input).trim();
  if (!raw) return '';

  const ascii = toEnglishDigits(raw);
  const replaced = ascii.replace(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g, (_full, y, m, d) => {
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 12, 0, 0);
    if (Number.isNaN(dateObj.getTime())) return _full;
    try {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(dateObj);
    } catch {
      return _full;
    }
  });

  return toPersianDigits(replaced);
}

/**
 * Extracts a YYYY-MM-DD string suitable for <input type="date"> if present.
 */
export function extractIsoDateForInput(input: string | null | undefined): string {
  if (!input) return '';
  const ascii = toEnglishDigits(String(input).trim());
  const match = ascii.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (!match) return '';
  const yyyy = match[1];
  const mm = match[2].padStart(2, '0');
  const dd = match[3].padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Extracts an HH:MM string suitable for <input type="time"> if present.
 */
export function extractTimeForInput(input: string | null | undefined): string {
  if (!input) return '';
  const ascii = toEnglishDigits(String(input).trim());
  const match = ascii.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!match) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}


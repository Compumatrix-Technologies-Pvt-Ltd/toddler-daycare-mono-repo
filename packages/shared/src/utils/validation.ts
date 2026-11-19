/**
 * Validation utilities for Toddler application
 * Provides RFC-compliant email checking and comprehensive password specification rules.
 */

export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates whether an email string has a valid format:
 * - Proper alphanumeric and symbol composition in username
 * - Exactly one @ symbol separating user and domain
 * - Valid domain hierarchy with no consecutive dots
 * - Valid top-level domain (TLD) of at least 2 alphabetic characters
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  if (trimmed.includes("..")) return false;
  if (!EMAIL_REGEX.test(trimmed)) return false;

  const parts = trimmed.split("@");
  if (parts.length !== 2 || !parts[1]) return false;

  const domainParts = parts[1].split(".");
  const tld = domainParts[domainParts.length - 1];
  if (!tld) return false;
  return /^[a-zA-Z]{2,}$/.test(tld);
}

/**
 * Password criteria breakdown for UI feedback and policy verification:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special character
 */
export interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function checkPasswordCriteria(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

/**
 * Returns true only when password strictly satisfies all 5 security specifications.
 */
export function isPasswordValid(password: string): boolean {
  const criteria = checkPasswordCriteria(password);
  return (
    criteria.minLength &&
    criteria.hasUpper &&
    criteria.hasLower &&
    criteria.hasNumber &&
    criteria.hasSpecial
  );
}

/**
 * Regex accepting only alphabet letters (including German umlauts Ä, ä, Ö, ö, Ü, ü, ß),
 * whitespace, hyphens, periods, and apostrophes commonly found in names.
 */
export const ALPHABET_REGEX = /^[a-zA-ZäöüÄÖÜß\s\-'.]+$/;

/**
 * Checks whether a given string consists only of letters, umlauts, and allowed punctuation.
 */
export function isAlphabetOnly(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return ALPHABET_REGEX.test(trimmed);
}

/**
 * Strips any character that is not an alphabet letter, umlaut, space, hyphen, period, or apostrophe.
 */
export function sanitizeAlphabetInput(value: string): string {
  return value.replace(/[^a-zA-ZäöüÄÖÜß\s\-'.]/g, "");
}

/**
 * Country Phone Configuration & Validator
 */
export interface CountryPhoneConfig {
  code: string;
  nameDe: string;
  nameEn: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  minDigits: number;
  maxDigits: number;
  regex?: RegExp;
}

export const COUNTRY_PHONE_CONFIGS: CountryPhoneConfig[] = [
  {
    code: "DE",
    nameDe: "Deutschland",
    nameEn: "Germany",
    dialCode: "+49",
    flag: "🇩🇪",
    placeholder: "151 23456789",
    minDigits: 9,
    maxDigits: 12,
    regex: /^[1-9]\d{8,11}$/,
  },
  {
    code: "AT",
    nameDe: "Österreich",
    nameEn: "Austria",
    dialCode: "+43",
    flag: "🇦🇹",
    placeholder: "664 1234567",
    minDigits: 7,
    maxDigits: 13,
    regex: /^[1-9]\d{6,12}$/,
  },
  {
    code: "CH",
    nameDe: "Schweiz",
    nameEn: "Switzerland",
    dialCode: "+41",
    flag: "🇨🇭",
    placeholder: "79 123 45 67",
    minDigits: 9,
    maxDigits: 10,
    regex: /^[1-9]\d{8,9}$/,
  },
  {
    code: "FR",
    nameDe: "Frankreich",
    nameEn: "France",
    dialCode: "+33",
    flag: "🇫🇷",
    placeholder: "6 12 34 56 78",
    minDigits: 9,
    maxDigits: 9,
    regex: /^[1-9]\d{8}$/,
  },
  {
    code: "NL",
    nameDe: "Niederlande",
    nameEn: "Netherlands",
    dialCode: "+31",
    flag: "🇳🇱",
    placeholder: "6 12345678",
    minDigits: 9,
    maxDigits: 9,
    regex: /^[1-9]\d{8}$/,
  },
  {
    code: "PL",
    nameDe: "Polen",
    nameEn: "Poland",
    dialCode: "+48",
    flag: "🇵🇱",
    placeholder: "512 345 678",
    minDigits: 9,
    maxDigits: 9,
    regex: /^[1-9]\d{8}$/,
  },
  {
    code: "IT",
    nameDe: "Italien",
    nameEn: "Italy",
    dialCode: "+39",
    flag: "🇮🇹",
    placeholder: "312 3456789",
    minDigits: 9,
    maxDigits: 11,
    regex: /^[3]\d{8,10}$/,
  },
  {
    code: "GB",
    nameDe: "Großbritannien",
    nameEn: "United Kingdom",
    dialCode: "+44",
    flag: "🇬🇧",
    placeholder: "7911 123456",
    minDigits: 10,
    maxDigits: 10,
    regex: /^[1-9]\d{9}$/,
  },
  {
    code: "US",
    nameDe: "Vereinigte Staaten",
    nameEn: "United States",
    dialCode: "+1",
    flag: "🇺🇸",
    placeholder: "202 555 0123",
    minDigits: 10,
    maxDigits: 10,
    regex: /^[2-9]\d{9}$/,
  },
];

/**
 * Parses a raw phone string into matching country config and clean national number.
 */
export function parsePhoneNumber(rawPhone: string): {
  country: CountryPhoneConfig;
  nationalNumber: string;
} {
  const defaultCountry = COUNTRY_PHONE_CONFIGS[0] ?? {
    code: "DE",
    nameDe: "Deutschland",
    nameEn: "Germany",
    dialCode: "+49",
    flag: "🇩🇪",
    placeholder: "151 23456789",
    minDigits: 9,
    maxDigits: 12,
  };

  if (!rawPhone || typeof rawPhone !== "string") {
    return { country: defaultCountry, nationalNumber: "" };
  }

  const trimmed = rawPhone.trim();

  // 1. Try matching with explicit dial codes (e.g. +49, +43)
  for (const cfg of COUNTRY_PHONE_CONFIGS) {
    if (trimmed.startsWith(cfg.dialCode)) {
      const rest = trimmed.slice(cfg.dialCode.length).trim().replace(/^0+/, "");
      return { country: cfg, nationalNumber: rest };
    }
  }

  // 2. Try matching 00 prefix (e.g. 0049...)
  for (const cfg of COUNTRY_PHONE_CONFIGS) {
    const doubleZero = "00" + cfg.dialCode.replace("+", "");
    if (trimmed.startsWith(doubleZero)) {
      const rest = trimmed.slice(doubleZero.length).trim().replace(/^0+/, "");
      return { country: cfg, nationalNumber: rest };
    }
  }

  // 3. Fallback: assume default Germany (+49) and strip leading zero
  return {
    country: defaultCountry,
    nationalNumber: trimmed.replace(/^0+/, ""),
  };
}

/**
 * Validates national digits according to country-specific rules.
 */
export function validateCountryPhone(
  nationalNumber: string,
  country: CountryPhoneConfig
): { isValid: boolean; digits: string } {
  const digits = nationalNumber.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return { isValid: false, digits: "" };

  const meetsLength =
    digits.length >= country.minDigits && digits.length <= country.maxDigits;
  const meetsPattern = country.regex ? country.regex.test(digits) : true;

  return {
    isValid: meetsLength && meetsPattern,
    digits,
  };
}

/**
 * Validates that a date string or Date object represents a date today or in the future.
 */
export function isFutureOrTodayDate(dateVal: Date | string | null | undefined): boolean {
  if (!dateVal) return false;
  let d: Date | null = null;
  if (dateVal instanceof Date) {
    d = dateVal;
  } else if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    // 1. DD.MM.YYYY
    const deMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
    if (deMatch && deMatch[1] && deMatch[2] && deMatch[3]) {
      d = new Date(parseInt(deMatch[3], 10), parseInt(deMatch[2], 10) - 1, parseInt(deMatch[1], 10));
    } else {
      // 2. dd,mmm,yyyy (e.g. "18, Nov, 2026")
      const mmmMatch = /^(\d{1,2})[\s,]+([a-zA-ZäöüÄÖÜ]+)[\s,]+(\d{4})/.exec(trimmed);
      if (mmmMatch && mmmMatch[1] && mmmMatch[2] && mmmMatch[3]) {
        const day = parseInt(mmmMatch[1], 10);
        const mStr = mmmMatch[2].toLowerCase();
        const year = parseInt(mmmMatch[3], 10);
        const months = ["jan", "feb", "mar", "mär", "apr", "may", "mai", "jun", "jul", "aug", "sep", "oct", "okt", "nov", "dec", "dez"];
        const monthIndices = [0, 1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 9, 10, 11, 11];
        const idx = months.findIndex((m) => mStr.startsWith(m));
        const mNum = idx !== -1 ? (monthIndices[idx] ?? 0) : 0;
        d = new Date(year, mNum, day);
      } else {
        // 3. ISO YYYY-MM-DD
        const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
        if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
          d = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
        } else {
          const parsed = new Date(trimmed);
          if (!isNaN(parsed.getTime())) d = parsed;
        }
      }
    }
  }

  if (!d || isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() >= today.getTime();
}


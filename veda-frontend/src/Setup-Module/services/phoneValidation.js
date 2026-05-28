import { Country } from "country-state-city";

/** National number length (without country dial code) */
const NATIONAL_LENGTH_BY_ISO = {
  IN: { min: 10, max: 10 },
  US: { min: 10, max: 10 },
  CA: { min: 10, max: 10 },
  GB: { min: 10, max: 11 },
  AU: { min: 9, max: 9 },
  AE: { min: 9, max: 9 },
  SG: { min: 8, max: 8 },
  DE: { min: 10, max: 11 },
  FR: { min: 9, max: 9 },
  JP: { min: 10, max: 11 },
  CN: { min: 11, max: 11 },
  PK: { min: 10, max: 10 },
  BD: { min: 10, max: 10 },
  NP: { min: 10, max: 10 },
  LK: { min: 9, max: 9 },
};

const DEFAULT_LENGTH = { min: 6, max: 15 };

export function getPhoneLengthRule(isoCode) {
  if (!isoCode) return DEFAULT_LENGTH;
  return NATIONAL_LENGTH_BY_ISO[isoCode.toUpperCase()] || DEFAULT_LENGTH;
}

export function getDialCodeForCountry(isoCode) {
  if (!isoCode) return "";
  const country = Country.getCountryByCode(isoCode.toUpperCase());
  return country?.phonecode ? String(country.phonecode) : "";
}

export function buildPhoneOptions(countryOptions) {
  const seen = new Set();
  const options = [];

  for (const c of countryOptions) {
    const dial = getDialCodeForCountry(c.isoCode);
    if (!dial || seen.has(dial)) continue;
    seen.add(dial);
    const rule = getPhoneLengthRule(c.isoCode);
    options.push({
      value: dial,
      label: `+${dial}`,
      isoCode: c.isoCode,
      flag: c.flag,
      min: rule.min,
      max: rule.max,
    });
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export function findPhoneOptionByDial(dialCode, phoneOptions) {
  const dial = String(dialCode || "").replace(/\D/g, "");
  if (!dial) return null;
  return phoneOptions.find((o) => o.value === dial) || null;
}

/** Parse saved full number into dial + national parts */
export function parseStoredPhone(phoneNumber, defaultDial = "") {
  const raw = String(phoneNumber || "").trim();
  if (!raw) {
    return { dialCode: defaultDial, national: "" };
  }

  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    return { dialCode: defaultDial, national: "" };
  }

  if (raw.startsWith("+")) {
    for (let len = 3; len >= 1; len -= 1) {
      const dial = digits.slice(0, len);
      const national = digits.slice(len);
      if (national.length >= 6) {
        return { dialCode: dial, national };
      }
    }
  }

  if (defaultDial && digits.startsWith(defaultDial)) {
    return {
      dialCode: defaultDial,
      national: digits.slice(defaultDial.length),
    };
  }

  return { dialCode: defaultDial, national: digits };
}

export function formatFullPhone(dialCode, nationalNumber) {
  const dial = String(dialCode || "").replace(/\D/g, "");
  const national = String(nationalNumber || "").replace(/\D/g, "");
  if (!dial && !national) return "";
  if (!national) return dial ? `+${dial}` : "";
  return `+${dial}${national}`;
}

export function validateNationalPhone(national, isoCode) {
  const digits = String(national || "").replace(/\D/g, "");
  if (!digits) return "";

  const { min, max } = getPhoneLengthRule(isoCode);
  if (digits.length < min) {
    return `Enter at least ${min} digits`;
  }
  if (digits.length > max) {
    return `Enter at most ${max} digits`;
  }
  return "";
}

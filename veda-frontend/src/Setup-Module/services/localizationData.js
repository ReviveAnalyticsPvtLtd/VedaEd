import { City, Country, State } from "country-state-city";
import ct from "countries-and-timezones";

/** Display labels — matches legacy saved values in setup wizard */
export const CURRENCY_LABELS = {
  INR: "INR (₹)",
  USD: "USD ($)",
  GBP: "GBP (£)",
  AED: "AED (د.إ)",
  SGD: "SGD (S$)",
  AUD: "AUD (A$)",
  CAD: "CAD (C$)",
  EUR: "EUR (€)",
  JPY: "JPY (¥)",
  CNY: "CNY (¥)",
  CHF: "CHF (Fr)",
  SAR: "SAR (﷼)",
  ZAR: "ZAR (R)",
  NZD: "NZD ($)",
  BRL: "BRL (R$)",
  MXN: "MXN ($)",
  KRW: "KRW (₩)",
  THB: "THB (฿)",
  MYR: "MYR (RM)",
  PHP: "PHP (₱)",
  IDR: "IDR (Rp)",
  PKR: "PKR (₨)",
  BDT: "BDT (৳)",
  LKR: "LKR (Rs)",
  NPR: "NPR (Rs)",
};

/** Primary ISO 4217 currency per country (ISO 3166-1 alpha-2) */
const PRIMARY_CURRENCY_BY_COUNTRY = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  AE: "AED",
  SG: "SGD",
  AU: "AUD",
  CA: "CAD",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  JP: "JPY",
  CN: "CNY",
  CH: "CHF",
  SA: "SAR",
  ZA: "ZAR",
  NZ: "NZD",
  BR: "BRL",
  MX: "MXN",
  KR: "KRW",
  TH: "THB",
  MY: "MYR",
  PH: "PHP",
  ID: "IDR",
  PK: "PKR",
  BD: "BDT",
  LK: "LKR",
  NP: "NPR",
};

/** Legacy country names from earlier setup wizard builds */
const COUNTRY_NAME_ALIASES = {
  "United States of America": "United States",
  USA: "United States",
  UK: "United Kingdom",
  UAE: "United Arab Emirates",
};

/** Postal API / legacy spellings → country-state-city library names (India) */
const STATE_NAME_ALIASES = {
  Orissa: "Odisha",
  Pondicherry: "Puducherry",
  Uttaranchal: "Uttarakhand",
  Chattisgarh: "Chhattisgarh",
  "NCT of Delhi": "Delhi",
  "Andaman and Nicobar Islands": "Andaman and Nicobar Islands",
};

let countriesCache = null;

export function isoToFlagEmoji(isoCode) {
  if (!isoCode || isoCode.length !== 2) return "";
  const code = isoCode.toUpperCase();
  return String.fromCodePoint(
    ...[...code].map((char) => 127397 + char.charCodeAt(0))
  );
}

export function formatCurrencyLabel(code) {
  if (!code) return "";
  const upper = code.toUpperCase();
  return CURRENCY_LABELS[upper] || upper;
}

export function parseCurrencyCode(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  const match = trimmed.match(/^([A-Z]{3})/i);
  return match ? match[1].toUpperCase() : trimmed;
}

export function loadAllCountries() {
  if (countriesCache) return countriesCache;

  countriesCache = Country.getAllCountries()
    .map((c) => ({
      value: c.isoCode,
      label: c.name,
      isoCode: c.isoCode,
      name: c.name,
      flag: c.flag || isoToFlagEmoji(c.isoCode),
      currencyCode: c.currency || PRIMARY_CURRENCY_BY_COUNTRY[c.isoCode] || "",
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return countriesCache;
}

export function findCountryByNameOrCode(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  const alias = COUNTRY_NAME_ALIASES[trimmed] || trimmed;
  const countries = loadAllCountries();

  return (
    countries.find(
      (c) =>
        c.isoCode.toLowerCase() === alias.toLowerCase() ||
        c.name.toLowerCase() === alias.toLowerCase() ||
        c.label.toLowerCase() === alias.toLowerCase()
    ) || null
  );
}

export function getStatesForCountry(isoCode) {
  if (!isoCode) return [];
  return State.getStatesOfCountry(isoCode)
    .map((s) => ({
      value: s.name,
      label: s.name,
      isoCode: s.isoCode,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function findStateInCountry(isoCode, stateName) {
  if (!isoCode || !stateName) return null;
  const needle = String(stateName).trim().toLowerCase();
  if (!needle) return null;

  return (
    State.getStatesOfCountry(isoCode).find(
      (s) =>
        s.name.toLowerCase() === needle ||
        s.isoCode.toLowerCase() === needle
    ) || null
  );
}

export function getCitiesForState(countryIso, stateName) {
  const state = findStateInCountry(countryIso, stateName);
  if (!state) return [];

  return City.getCitiesOfState(countryIso, state.isoCode)
    .map((c) => ({
      value: c.name,
      label: c.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Match API state string to a known state option value */
export function resolveStateName(isoCode, rawState, stateOptions = []) {
  const raw = String(rawState || "").trim();
  if (!raw) return "";

  const fromList = stateOptions.find(
    (o) => o.value.toLowerCase() === raw.toLowerCase()
  );
  if (fromList) return fromList.value;

  const alias = STATE_NAME_ALIASES[raw] || raw;
  const matched = findStateInCountry(isoCode, alias);
  if (matched) return matched.name;

  if (alias !== raw) {
    const fromAliasList = stateOptions.find(
      (o) => o.value.toLowerCase() === alias.toLowerCase()
    );
    if (fromAliasList) return fromAliasList.value;
  }

  return raw;
}

export function getTimezonesForCountry(isoCode) {
  if (!isoCode) return [];

  const tzFromPackage = ct.getTimezonesForCountry(isoCode);
  let list = [];

  if (Array.isArray(tzFromPackage) && tzFromPackage.length > 0) {
    list = tzFromPackage.map((z) => z.name);
  } else {
    const csc = Country.getCountryByCode(isoCode);
    list = (csc?.timezones || []).map((t) => t.tzName).filter(Boolean);
  }

  return [...new Set(list)].sort().map((tz) => ({
    value: tz,
    label: tz.replace(/_/g, " "),
  }));
}

export function getDefaultTimezoneForCountry(isoCode) {
  const options = getTimezonesForCountry(isoCode);
  return options[0]?.value || "";
}

export function getPrimaryCurrencyCode(isoCode) {
  if (!isoCode) return "";
  const upper = isoCode.toUpperCase();
  const fromList = loadAllCountries().find((c) => c.isoCode === upper);
  return fromList?.currencyCode || PRIMARY_CURRENCY_BY_COUNTRY[upper] || "";
}

export function getCurrencyOptionsForCountry(isoCode) {
  const primary = getPrimaryCurrencyCode(isoCode);
  const codes = new Set(Object.keys(CURRENCY_LABELS));
  if (primary) codes.add(primary);

  return [...codes]
    .sort((a, b) => {
      if (a === primary) return -1;
      if (b === primary) return 1;
      return formatCurrencyLabel(a).localeCompare(formatCurrencyLabel(b));
    })
    .map((code) => ({
      value: formatCurrencyLabel(code),
      label: formatCurrencyLabel(code),
      code,
    }));
}

export function getAllCurrencyOptions() {
  return Object.keys(CURRENCY_LABELS).map((code) => ({
    value: formatCurrencyLabel(code),
    label: formatCurrencyLabel(code),
    code,
  }));
}

export function getDefaultsForCountry(isoCode) {
  const currencyCode = getPrimaryCurrencyCode(isoCode);
  return {
    currency: formatCurrencyLabel(currencyCode),
    timezone: getDefaultTimezoneForCountry(isoCode),
  };
}

/** Build react-select option from saved string; includes value if missing from list */
export function ensureOptionInList(options, savedValue, fallbackLabel) {
  if (!savedValue) return options;
  const exists = options.some((o) => o.value === savedValue);
  if (exists) return options;
  return [
    { value: savedValue, label: fallbackLabel || savedValue },
    ...options,
  ];
}

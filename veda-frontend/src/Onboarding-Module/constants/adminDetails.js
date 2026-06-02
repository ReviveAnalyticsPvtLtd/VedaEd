import { Country } from "country-state-city";
import { isoToFlagEmoji } from "../utils/countryFlags";

export const DEFAULT_COUNTRY_CODE = "+91";

const COUNTRY_DIAL_ENTRIES = [
  { isoCode: "IN", dial: "91", min: 10, max: 10 },
  { isoCode: "US", dial: "1", min: 10, max: 10 },
  { isoCode: "GB", dial: "44", min: 10, max: 11 },
  { isoCode: "AU", dial: "61", min: 9, max: 9 },
  { isoCode: "AE", dial: "971", min: 9, max: 9 },
  { isoCode: "SG", dial: "65", min: 8, max: 8 },
  { isoCode: "DE", dial: "49", min: 10, max: 11 },
  { isoCode: "FR", dial: "33", min: 9, max: 9 },
  { isoCode: "JP", dial: "81", min: 10, max: 11 },
  { isoCode: "CN", dial: "86", min: 11, max: 11 },
  { isoCode: "PK", dial: "92", min: 10, max: 10 },
  { isoCode: "BD", dial: "880", min: 10, max: 10 },
  { isoCode: "NP", dial: "977", min: 10, max: 10 },
  { isoCode: "LK", dial: "94", min: 9, max: 9 },
];

function buildCountryCodeOption({ isoCode, dial, min, max }) {
  const country = Country.getCountryByCode(isoCode);
  const value = `+${dial}`;
  return {
    value,
    label: value,
    dial,
    isoCode,
    countryName: country?.name || isoCode,
    flag: country?.flag || isoToFlagEmoji(isoCode),
    min,
    max,
  };
}

/** Dial codes supported in onboarding step 3 (with flag + country name) */
export const ONBOARDING_COUNTRY_CODES = COUNTRY_DIAL_ENTRIES.map(buildCountryCodeOption);

export const STEP3_DRAFT_KEY = "veda-onboarding-step3-draft";

export const FIELD_ERRORS = {
  fullName: "Enter a valid name.",
  email: "Enter a valid email address.",
  mobileNumber: "Enter a valid 10-digit mobile number.",
  mobileNumberInUse: "This mobile number is already registered.",
};

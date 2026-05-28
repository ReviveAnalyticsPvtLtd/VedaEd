const axios = require("axios");

const REQUEST_TIMEOUT_MS = 8000;

/** @type {Promise<typeof import('postalcodes-india')> | null} */
let indiaPostalModulePromise = null;

function getIndiaPostalModule() {
  if (!indiaPostalModulePromise) {
    indiaPostalModulePromise = import("postalcodes-india");
  }
  return indiaPostalModulePromise;
}

async function lookupIndiaPincode(pin) {
  const { find } = await getIndiaPostalModule();
  const result = find(pin);
  if (!result?.isValid) return null;

  const state = result.state || "";
  const city = result.district || result.place || "";

  return state || city ? { state, city } : null;
}

async function lookupZippopotam(countryIso, postal) {
  const iso = String(countryIso || "").toLowerCase();
  const code = encodeURIComponent(String(postal || "").trim());
  if (!iso || !code) return null;

  const res = await axios.get(`https://api.zippopotam.us/${iso}/${code}`, {
    timeout: REQUEST_TIMEOUT_MS,
    validateStatus: (status) => status < 500,
  });
  if (res.status !== 200) return null;

  const place = res.data?.places?.[0];
  if (!place) return null;

  return {
    state: place.state || place["state abbreviation"] || "",
    city: place["place name"] || "",
  };
}

/**
 * Resolve postal / PIN code to state and city.
 * India: local postalcodes-india dataset; other countries: zippopotam.us
 */
async function lookupPostalCode(countryIso, postalCode) {
  const pin = String(postalCode || "").trim();
  if (!pin || !countryIso) return null;

  const iso = countryIso.toUpperCase();

  try {
    if (iso === "IN" && /^\d{6}$/.test(pin)) {
      const india = await lookupIndiaPincode(pin);
      if (india) return india;
    }

    return await lookupZippopotam(iso, pin);
  } catch {
    return null;
  }
}

module.exports = { lookupPostalCode };

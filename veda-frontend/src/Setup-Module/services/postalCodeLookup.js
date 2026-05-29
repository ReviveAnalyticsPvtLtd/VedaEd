import axios from "axios";
import config from "../../config";

/**
 * Resolve postal / PIN code to state and city via backend proxy
 * (avoids browser CORS limits on third-party postal APIs).
 */
export async function lookupPostalCode(countryIso, postalCode) {
  const pin = String(postalCode || "").trim();
  if (!pin || !countryIso) return null;

  try {
    const { data } = await axios.get(`${config.API_BASE_URL}/setup-wizard/postal-lookup`, {
      params: {
        country: countryIso.toUpperCase(),
        code: pin,
      },
      timeout: 10000,
    });

    if (!data?.success || !data?.data) return null;

    const { state = "", city = "" } = data.data;
    return state || city ? { state, city } : null;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    return null;
  }
}

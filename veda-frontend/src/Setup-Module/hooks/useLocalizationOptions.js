import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ensureOptionInList,
  findCountryByNameOrCode,
  formatCurrencyLabel,
  getCurrencyOptionsForCountry,
  getDefaultsForCountry,
  getPrimaryCurrencyCode,
  getCitiesForState,
  getStatesForCountry,
  getTimezonesForCountry,
  loadAllCountries,
  resolveStateName,
} from "../services/localizationData";
import { lookupPostalCode } from "../services/postalCodeLookup";

/**
 * Dynamic country / state / timezone / currency options for Step 3.
 * Keeps `form.country` as human-readable name for backend compatibility.
 */
export function useLocalizationOptions(form, { enabled = true } = {}) {
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [stateOptions, setStateOptions] = useState([]);
  const [timezoneOptions, setTimezoneOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [postalLookupLoading, setPostalLookupLoading] = useState(false);

  const countryOptions = useMemo(() => {
    if (!enabled) return [];
    return loadAllCountries();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setTimeout(() => setCountriesLoading(false), 0);
    return () => clearTimeout(timer);
  }, [enabled]);

  const refreshCityOptions = useCallback((isoCode, stateName, savedCity) => {
    if (!isoCode || !stateName) {
      setCityOptions([]);
      return;
    }
    const cities = getCitiesForState(isoCode, stateName);
    setCityOptions(ensureOptionInList(cities, savedCity, savedCity));
  }, []);

  const loadCountryDependencies = useCallback((isoCode, savedState, savedTimezone, savedCurrency) => {
    if (!isoCode) {
      setStateOptions([]);
      setTimezoneOptions([]);
      setCurrencyOptions([]);
      return;
    }

    setStatesLoading(true);
    try {
      const states = getStatesForCountry(isoCode);
      const timezones = getTimezonesForCountry(isoCode);
      const currencies = getCurrencyOptionsForCountry(isoCode);

      setStateOptions(
        ensureOptionInList(states, savedState, savedState)
      );
      setTimezoneOptions(
        ensureOptionInList(timezones, savedTimezone, savedTimezone)
      );
      setCurrencyOptions(
        ensureOptionInList(currencies, savedCurrency, savedCurrency)
      );
      refreshCityOptions(isoCode, savedState, "");
    } finally {
      setStatesLoading(false);
    }
  }, [refreshCityOptions]);

  /** Sync dropdown data when form is prefilled from API */
  useEffect(() => {
    if (!enabled || countriesLoading) return;

    const match = findCountryByNameOrCode(form.country);
    if (match) {
      setCountryCode(match.isoCode);
      loadCountryDependencies(
        match.isoCode,
        form.state,
        form.timezone,
        form.currency
      );
    } else if (!form.country) {
      setCountryCode("");
      setStateOptions([]);
      setTimezoneOptions([]);
      setCurrencyOptions([]);
    } else {
      setCountryCode("");
      setTimezoneOptions(
        ensureOptionInList([], form.timezone, form.timezone)
      );
      setCurrencyOptions(
        ensureOptionInList([], form.currency, form.currency)
      );
      setStateOptions([]);
      setCityOptions([]);
    }
  }, [enabled, countriesLoading, form.country, loadCountryDependencies]);

  useEffect(() => {
    if (!enabled || !countryCode) {
      setCityOptions([]);
      return;
    }
    refreshCityOptions(countryCode, form.state, form.city);
  }, [enabled, countryCode, form.state, form.city, refreshCityOptions]);

  const applyCountrySelection = useCallback(
    (isoCode) => {
      const country = countryOptions.find((c) => c.isoCode === isoCode);
      if (!country) return null;

      const defaults = getDefaultsForCountry(isoCode);
      const states = getStatesForCountry(isoCode);
      const timezones = getTimezonesForCountry(isoCode);
      const currencies = getCurrencyOptionsForCountry(isoCode);

      setCountryCode(isoCode);
      setStateOptions(states);
      setTimezoneOptions(timezones);
      setCurrencyOptions(currencies);
      setCityOptions([]);

      const currency =
        defaults.currency ||
        (getPrimaryCurrencyCode(isoCode)
          ? formatCurrencyLabel(getPrimaryCurrencyCode(isoCode))
          : "");

      return {
        countryName: country.name,
        state: "",
        timezone: defaults.timezone,
        currency,
      };
    },
    [countryOptions]
  );

  const lookupFromPostalCode = useCallback(
    async (postalCode) => {
      if (!countryCode || !postalCode?.trim()) return null;

      setPostalLookupLoading(true);
      try {
        return await lookupPostalCode(countryCode, postalCode);
      } finally {
        setPostalLookupLoading(false);
      }
    },
    [countryCode]
  );

  const applyPostalLookupResult = useCallback(
    (result) => {
      if (!result || !countryCode) return null;

      const states =
        stateOptions.length > 0
          ? stateOptions
          : getStatesForCountry(countryCode);
      const resolvedState = resolveStateName(
        countryCode,
        result.state,
        states
      );

      setStateOptions(ensureOptionInList(states, resolvedState, resolvedState));

      const cities = resolvedState
        ? getCitiesForState(countryCode, resolvedState)
        : [];
      setCityOptions(ensureOptionInList(cities, result.city, result.city));

      return {
        state: resolvedState,
        city: result.city || "",
      };
    },
    [countryCode, stateOptions]
  );

  const hasStates = stateOptions.length > 0;
  const hasCities = cityOptions.length > 0;

  return {
    countriesLoading,
    statesLoading,
    countryCode,
    countryOptions,
    stateOptions,
    timezoneOptions,
    currencyOptions,
    cityOptions,
    postalLookupLoading,
    hasStates,
    hasCities,
    applyCountrySelection,
    lookupFromPostalCode,
    applyPostalLookupResult,
    refreshCityOptions,
    findCountryByNameOrCode,
  };
}
